import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { consentCspHeaders } from "../../dist/native.js";
const options = {
	noticeVersion: "test-notice-1",
	services: {
		probe: {
			"script-src": ["https://third.party.test"],
			"img-src": ["https://third.party.test"],
			"frame-src": ["https://third.party.test"],
			"connect-src": ["https://third.party.test"],
		},
	},
};
const runtime = await readFile(
	new URL("../../dist/cookie-banner.js", import.meta.url),
);
const server = createServer((req, res) => {
	if (req.url === "/banner.js") {
		res.setHeader("Content-Type", "application/javascript");
		res.end(runtime);
		return;
	}
	res.writeHead(200, {
		"Content-Type": "text/html; charset=utf-8",
		...consentCspHeaders(options, req.headers.cookie),
	});
	res.end(
		`<!doctype html><html><head><script>window.__cookieConsent={strictCsp:true,mode:'standalone',lang:'pl',noticeVersion:'test-notice-1',controller:{name:'Test controller'},purposes:'Test optional player',privacyPolicyUrl:'/privacy',services:[{id:'probe',name:'Probe',description:'Test vendor',privacyUrl:'https://third.party.test/privacy',retention:'Session',urls:['https://third.party.test']}]}</script><script src="/banner.js"></script><script src="https://third.party.test/vendor.js"></script><style>body{background-image:url(https://unregistered.test/pixel)}</style></head><body><iframe data-cb-service="probe" data-cb-src="https://third.party.test/embed" hidden></iframe><button onclick="this.textContent='Works'" id="functional">Local</button></body></html>`,
	);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
try {
	const context = await browser.newContext();
	const page = await context.newPage();
	const network = [];
	page.on("pageerror", (e) => console.error(e.message));
	await page.route("**/*", (route) => {
		const url = route.request().url();
		if (new URL(url).origin === base) return route.continue();
		network.push(url);
		return route.fulfill({
			contentType:
				route.request().resourceType() === "script"
					? "application/javascript"
					: "text/html",
			body:
				route.request().resourceType() === "script"
					? "window.vendorLoaded=true"
					: "<p>Embed works</p>",
		});
	});
	console.log("Native server", base);
	const initial = await page.goto(base);
	await page.waitForTimeout(300);
	assert.deepEqual(network, []);
	await Promise.all([
		page.waitForResponse((r) => r.request().isNavigationRequest()),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(200);
	assert.deepEqual(network, []);
	console.log("Granting");
	const [granted] = await Promise.all([
		page.waitForResponse(
			(r) =>
				r.request().isNavigationRequest() &&
				r.headers()["content-security-policy"].includes("third.party.test"),
		),
		page.locator(".cb-content-placeholder button").click(),
	]);
	await page.waitForLoadState("load");
	assert.equal(await page.evaluate(() => window.vendorLoaded), true);
	assert.equal(await page.locator("iframe[src]").count(), 1);
	assert.ok(network.length >= 2);
	assert.ok(
		network.every((url) => new URL(url).hostname === "third.party.test"),
	);
	await page.locator("#functional").click();
	assert.equal(await page.locator("#functional").innerText(), "Works");
	// Alternate consent and no-consent HTTP clients at the identical URL.
	for (let i = 0; i < 8; i++) {
		const cookie = i % 2 ? `cb_csp_consent=${encodeURIComponent(JSON.stringify({version: options.noticeVersion, services: ["probe"], expires: Date.now() + 10000}))}` : "";
		const r = await fetch(base, { headers: { cookie } });
		const csp = r.headers.get("content-security-policy");
		assert.equal(csp.includes("third.party.test"), !!cookie);
		assert.match(r.headers.get("cache-control"), /no-store/);
	}
	// Revocation also gets a new denied policy and does not reload the vendor.
	const count = network.length;
	await page
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	const [revoked] = await Promise.all([
		page.waitForResponse(
			(r) =>
				r.request().isNavigationRequest() &&
				!r.headers()["content-security-policy"].includes("third.party.test"),
		),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(200);
	assert.equal(network.length, count);
	assert.ok(
		!revoked.headers()["content-security-policy"].includes("third.party.test"),
	);
	const report = {
		initialCsp: initial.headers()["content-security-policy"],
		grantedCsp: granted.headers()["content-security-policy"],
		network,
		checks: [
			"parser-inserted vendor blocked before consent",
			"unknown CSS image blocked",
			"rejection reload denied",
			"consent reload allows vendor and iframe",
			"local handler works",
			"8 alternating cache isolation requests",
			"revocation blocks vendor again",
		],
	};
	await writeFile(
		new URL("../../docs/research/native-csp-results.json", import.meta.url),
		JSON.stringify(report, null, 2) + "\n",
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await browser.close();
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
}
