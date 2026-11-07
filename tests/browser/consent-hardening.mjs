import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { consentCspHeaders } from "../../dist/native.js";

const root = new URL("../../dist/", import.meta.url);
const results = [];
const evidence = new URL(
	"../../docs/research/consent-hardening/",
	import.meta.url,
);
await mkdir(evidence, { recursive: true });
const version = "hardening-qa-1";
const services = [
	{
		id: "probe",
		name: "QA video",
		description: "Play a video explicitly requested by the visitor.",
		privacyUrl: "https://optional.test/privacy",
		retention: "Session",
		urls: ["https://optional.test/"],
		cleanup: {
			cookies: ["_qa_tracker"],
			localStorage: ["vendor-id"],
			sessionStorage: ["vendor-session"],
		},
	},
];
const server = createServer(async (req, res) => {
	try {
		const url = new URL(req.url, "http://localhost");
		if (url.pathname === "/worker-probe.js") {
			res.setHeader("Content-Type", "application/javascript");
			res.end(
				'fetch("https://unreviewed.test/worker").finally(()=>self.close())',
			);
			return;
		}
		if (url.pathname === "/frame-probe") {
			res.setHeader("Content-Type", "text/html");
			res.end('<img src="https://unreviewed.test/frame">');
			return;
		}
		if (/\.js$/.test(url.pathname)) {
			const safe = url.pathname.slice(1);
			if (safe.includes("..")) {
				res.writeHead(400).end();
				return;
			}
			res.setHeader("Content-Type", "application/javascript");
			res.end(await readFile(new URL(safe, root)));
			return;
		}
		const missing = url.pathname === "/missing";
		const noticeVersion =
			url.pathname === "/revised" ? "hardening-qa-2" : version;
		const config = {
			strictCsp: true,
   buttonStyle: url.searchParams.get("buttons") || "standard",
			mode: url.searchParams.get("mode") || "standalone",
			lang: "pl",
			variant: url.searchParams.get("variant") || "modal",
			noticeVersion,
			controller: missing ? undefined : { name: "QA controller" },
			purposes: "Optional video requested by the visitor.",
			privacyPolicyUrl: "/privacy",
			services,
			theme:
				url.searchParams.get("theme") === "dark"
					? { background: "#111111", text: "#111111", primary: "#111111" }
					: url.searchParams.get("theme") === "poor"
						? { background: "#ffffff", text: "#ffffff", primary: "#ffff00" }
						: undefined,
		};
		res.writeHead(200, {
			"Content-Type": "text/html; charset=utf-8",
			...consentCspHeaders(
				{
					noticeVersion,
					services: {
						probe: {
							"script-src": ["https://optional.test"],
							"frame-src": ["https://optional.test"],
							"connect-src": ["https://optional.test"],
						},
					},
				},
				req.headers.cookie,
			),
		});
		res.end(
			`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.__cookieConsent=${JSON.stringify(config)}</script><script type="module">import {initializeConsent,setServiceConsent,getConsentReceipt} from '/native.js';window.qa={setServiceConsent,getConsentReceipt,initializeConsent};await initializeConsent(window.__cookieConsent);</script><script src="https://optional.test/vendor.js"></script></head><body><h1>QA native SSR</h1><iframe hidden title="QA player" data-cb-service="probe" data-cb-src="https://optional.test/player"></iframe><iframe hidden title="Unknown vendor" data-cb-service="external-unreviewed.test" data-cb-src="https://unreviewed.test/player"></iframe><button id="local-action" onclick="this.textContent='Works'">Local</button></body></html>`,
		);
	} catch (error) {
		res.writeHead(500).end(String(error));
	}
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
async function visitor(width = 390) {
	const context = await browser.newContext({
		viewport: { width, height: 900 },
	});
	const page = await context.newPage();
	const requests = [];
	await context.route("**/*", (route) => {
		const url = new URL(route.request().url());
		if (url.origin === base) return route.continue();
		requests.push(url.href);
		if (route.request().resourceType() === "script")
			return route.fulfill({
				contentType: "application/javascript",
				body: "window.vendorStarted=true;window.gtag=(command,kind)=>{if(command==='consent'&&kind==='update'){console.log('qa-consent-signal');navigator.sendBeacon('https://optional.test/consent-ping','withdrawal probe')}};addEventListener('pagehide',()=>navigator.sendBeacon('https://optional.test/unload-beacon','withdrawal probe'));document.cookie='_qa_tracker=active; Path=/';localStorage.setItem('vendor-id','active');sessionStorage.setItem('vendor-session','active');",
			});
		return route.fulfill({
			contentType: "text/html",
			body: "<button onclick=\"this.textContent='Playing'\">Play</button>",
		});
	});
	return { context, page, requests };
}
try {
	for (const variant of ["modal", "bar"])
		for (const width of [320, 390, 768, 1440]) {
			const v = await visitor(width);
			await v.page.goto(`${base}/?variant=${variant}`);
			await v.page
				.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
				.waitFor();
			const accept = v.page.getByRole("button", {
				name: "Zaakceptuj wszystkie",
				exact: true,
			});
			const reject = v.page.getByRole("button", {
				name: "Odrzuć wszystkie",
				exact: true,
			});
			const style = (locator) =>
				locator.evaluate((el) => {
					const s = getComputedStyle(el);
					const r = el.getBoundingClientRect();
					return {
						width: r.width,
						height: r.height,
						font: s.fontSize,
						weight: s.fontWeight,
						color: s.color,
						background: s.backgroundColor,
						border: s.border,
						widthOverflow: el.scrollWidth > el.clientWidth + 1,
					};
				});
			const a = await style(accept),
				r = await style(reject);
			assert.ok(
				Math.abs(a.width - r.width) < 1,
				"Equal button width within browser subpixel rounding",
			);
			delete a.width;
			delete r.width;
			assert.notEqual(a.background, r.background, "Acceptance is filled and refusal is outlined");
   assert.ok(a.border.includes("1px") && r.border.includes("1px"));
   delete a.color; delete r.color; delete a.background; delete r.background;
   assert.deepEqual(a, r, `Consistent decision sizing ${variant} ${width}`);
			assert.ok(
				!a.border.startsWith("0px"),
				"Decision controls have a visible border",
			);
			assert.equal((await style(accept)).widthOverflow, false);
			assert.deepEqual(v.requests, []);
			if (variant === "modal") {
				await v.page.keyboard.press("Tab");
				assert.equal(
					await v.page.evaluate(
						() =>
							document
								.getElementById("cookie-consent-host")
								.shadowRoot.activeElement.closest("[role=dialog]") !== null,
					),
					true,
				);
			}
			await v.page.screenshot({
				path: fileURLToPath(
					new URL(`native-${variant}-${width}.png`, evidence),
				),
				fullPage: true,
			});
			results.push(
				`Filled acceptance, outlined refusal and zero pre-consent requests: ${variant} ${width}px`,
			);
			await v.context.close();
		}
	for (const variant of ["modal", "bar"]) {
  const v = await visitor();
  await v.page.goto(`${base}/?variant=${variant}&buttons=equal`);
  const accept=v.page.getByRole("button",{name:"Zaakceptuj wszystkie",exact:true});
  const reject=v.page.getByRole("button",{name:"Odrzuć wszystkie",exact:true});
  await accept.waitFor();
  const appearance=element=>{const s=getComputedStyle(element);const r=element.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,width:r.width,height:r.height,border:s.border};};
  assert.deepEqual(await accept.evaluate(appearance),await reject.evaluate(appearance));
  assert.deepEqual(v.requests,[]);
  await v.context.close();
  results.push(`Strict button style: identical decisions in ${variant}; zero pre-consent requests`);
 }
	for (const theme of ["dark", "poor"]) {
		const themed = await visitor();
		await themed.page.goto(`${base}/?theme=${theme}`);
		const button = themed.page.getByRole("button", {
			name: "Zaakceptuj wszystkie",
			exact: true,
		});
		await button.waitFor();
		const colors = await button.evaluate((element) => ({
			color: getComputedStyle(element).color,
			background: getComputedStyle(element).backgroundColor,
		}));
		const luminance = (rgb) => {
			const channels = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
				v /= 255;
				return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
			});
			return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
		};
		const foreground = luminance(colors.color), background = luminance(colors.background);
		assert.ok((Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) >= 4.5,
			`Readable decision contrast with ${theme} colors`);

		await themed.page.screenshot({
			path: fileURLToPath(new URL(`native-theme-${theme}.png`, evidence)),
			fullPage: true,
		});
		assert.deepEqual(themed.requests, []);
		await themed.context.close();
		results.push(
			`Readable rendered decision controls with ${theme} configured HEX colors`,
		);
	}
	const v = await visitor();
	const { page, context, requests } = v;
	await page.goto(base);
	await page
		.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
		.waitFor();
	await page.evaluate(() => {
		try {
			const worker = new Worker("/worker-probe.js");
			worker.onerror = () => {};
		} catch {}
		const frame = document.createElement("iframe");
		frame.id = "unsupervised-frame";
		frame.src = "/frame-probe";
		document.body.append(frame);
	});
	await page.waitForTimeout(150);
	assert.deepEqual(requests, []);
	await page.locator("#unsupervised-frame").evaluate((frame) => frame.remove());
	results.push(
		"Local worker and unprotected local iframe cannot escape the document CSP to send external requests",
	);
	await Promise.all([
		page.waitForNavigation(),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	assert.deepEqual(requests, []);
	await page.evaluate(
		() => (document.cookie = "site_session=essential; Path=/"),
	);
	await Promise.all([
		page.waitForNavigation(),
		page
			.locator(".cb-content-placeholder")
			.first()
			.getByRole("button", { name: /Zgadzam/ })
			.click(),
	]);
	await page.waitForFunction(() => window.vendorStarted === true);
 await page.evaluate(() => {
  const script=document.createElement("script"); script.type="text/plain";
  script.dataset.cbService="probe";script.dataset.cbSrc="https://optional.test/extra-sdk.js";
  document.body.append(script);
 });
 await page.waitForFunction(() => document.querySelectorAll('script[src="https://optional.test/extra-sdk.js"]').length === 1);
 await page.evaluate(() => window.qa.initializeConsent(window.__cookieConsent));
 assert.equal(await page.locator('script[src="https://optional.test/extra-sdk.js"]').count(),1,"Repeated initialization does not execute an inert SDK twice");

	await page
		.frameLocator('iframe[title="QA player"]')
		.getByRole("button", { name: "Play" })
		.click();
	assert.equal(
		await page
			.frameLocator('iframe[title="QA player"]')
			.getByRole("button")
			.innerText(),
		"Playing",
	);
	assert.ok(requests.every((url) => new URL(url).hostname === "optional.test"));
	const receipt = await page.evaluate(() => window.qa.getConsentReceipt());
	assert.equal(receipt.services.probe, true);
	assert.equal(receipt.services["external-unreviewed.test"], undefined);
	assert.ok(
		receipt.notice.services.some(
			(service) => service.id === "probe" && service.retention === "Session",
		),
	);
	assert.equal(JSON.parse(receipt.noticeKey).controller.name, "QA controller");
	assert.ok(
		await page.evaluate(() => document.cookie.includes("_qa_tracker=active")),
	);
	const count = requests.length;
	await page
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	assert.equal(
		await page
			.getByRole("switch", { name: "unreviewed.test", exact: true })
			.isDisabled(),
		true,
	);
	await Promise.all([
		page.waitForNavigation(),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	await page.waitForTimeout(150);
	assert.equal(requests.length, count);
	assert.equal(await page.evaluate(() => window.vendorStarted === true), false);
	const identifiers = await page.evaluate(() => ({
		cookie: document.cookie,
		local: localStorage.getItem("vendor-id"),
		session: sessionStorage.getItem("vendor-session"),
	}));
	assert.ok(!identifiers.cookie.includes("_qa_tracker"));
	assert.ok(identifiers.cookie.includes("site_session=essential"));
	assert.equal(identifiers.local, null);
	assert.equal(identifiers.session, null);
	results.push(
		"Native API + placeholder: selected SDK and interactive player work after consent; unknown vendor remains disabled; withdrawal removes tracker identifiers and sends no further external request",
	);
	await page.evaluate(() => window.qa.setServiceConsent("probe", true));
	await page.waitForFunction(() => window.vendorStarted === true);
	await page.frameLocator('iframe[title="QA player"]').getByRole("button", {name:"Play", exact:true}).waitFor();
	const beforeDirect = requests.length;
	await Promise.all([
		page.waitForNavigation(),
		page
			.getByRole("button", {
				name: "Wycofaj wszystkie opcjonalne zgody",
				exact: true,
			})
			.click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	assert.equal(requests.length, beforeDirect);
	results.push(
		"Persistent one-click withdrawal works directly without opening preferences",
	);
	await page.evaluate(() => window.qa.setServiceConsent("probe", true));
	await page.waitForFunction(() => window.vendorStarted === true);
	const other = await context.newPage();
	await other.goto(base);
	await other
		.getByRole("button", {
			name: "Wycofaj wszystkie opcjonalne zgody",
			exact: true,
		})
		.waitFor();
	await other.waitForLoadState("networkidle");
	const beforeCrossTab = requests.length;
	const [crossTabResponse] = await Promise.all([
		page.waitForNavigation(),
		other.waitForNavigation(),
		other
			.getByRole("button", {
				name: "Wycofaj wszystkie opcjonalne zgody",
				exact: true,
			})
			.click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	await page.waitForTimeout(150);
	assert.ok(
		!crossTabResponse
			.headers()
			["content-security-policy"].includes("optional.test"),
	);
	assert.equal(requests.length, beforeCrossTab);
	await other.close();
	results.push(
		"Withdrawal in another tab reloads the first tab with denied CSP before any parser-inserted vendor request",
	);
	await page.evaluate(() => window.qa.setServiceConsent("probe", true));
	await page.waitForFunction(() => window.vendorStarted === true);
	await page.waitForFunction(() => typeof window.qa?.initializeConsent === "function");
	const beforeRevision = requests.length;
	const [response] = await Promise.all([
		page.waitForResponse(
			(response) =>
				response.request().isNavigationRequest() &&
				new URL(response.url()).pathname === "/revised",
		),
		page.evaluate(() => {
			history.pushState(null, "", "/revised");
			return window.qa.initializeConsent({
				...window.__cookieConsent,
				noticeVersion: "hardening-qa-2",
			});
		}),
	]);
	await page
		.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
		.waitFor();
	await page.waitForTimeout(100);
	assert.ok(
		!response.headers()["content-security-policy"].includes("optional.test"),
	);
	assert.equal(requests.length, beforeRevision);
	results.push(
		"Policy revision during a client-side route change reloads denied CSP before the HTML parser and SDK run",
	);
	await context.close();
	const sdk = await visitor();
	const signals = [];
	sdk.page.on("console", (message) => {
		if (message.text() === "qa-consent-signal") signals.push(message.text());
	});
	await sdk.page.goto(base + "/?mode=gtm");
	await sdk.page.waitForFunction(() => !!window.qa);
	await sdk.page.evaluate(() => window.qa.setServiceConsent("probe", true));
	await sdk.page.waitForFunction(() => window.vendorStarted === true);
	await sdk.page.waitForLoadState("networkidle");
	const beforeSdkWithdrawal = sdk.requests.length;
	await Promise.all([
		sdk.page.waitForNavigation(),
		sdk.page
			.getByRole("button", {
				name: "Wycofaj wszystkie opcjonalne zgody",
				exact: true,
			})
			.click(),
	]);
	await sdk.page.locator(".cb-content-placeholder").first().waitFor();
	await sdk.page.waitForTimeout(150);
	assert.ok(signals.length > 0, "Provider did not receive the revoke signal");
	assert.equal(
		sdk.requests.length,
		beforeSdkWithdrawal,
		"Consent-update or unload beacon escaped after withdrawal",
	);
	await sdk.context.close();
	results.push(
		"A loaded SDK receives the withdrawal signal but consent-update and pagehide beacons are blocked before reload",
	);
	const missing = await visitor();
	await missing.page.goto(base + "/missing");
	await missing.page
		.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
		.waitFor();
	assert.equal(
		await missing.page
			.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
			.isDisabled(),
		true,
	);
	await Promise.all([
		missing.page.waitForNavigation(),
		missing.page
			.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
			.click(),
	]);
	await missing.page
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.waitFor();
	assert.deepEqual(missing.requests, []);
	await missing.context.close();
	results.push(
		"Incomplete controller disclosure disables opt-in while one-click refusal remains usable",
	);
	console.log(JSON.stringify(results, null, 2));
	await writeFile(
		new URL("native-results.json", evidence),
		JSON.stringify({ testedAt: new Date().toISOString(), results }, null, 2) +
			"\n",
	);
} finally {
	await browser.close();
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
}
