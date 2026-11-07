import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9401";
const b = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const results = [];
try {
	for (const profile of (
		process.env.PROFILES || "off,combine,delay,both"
	).split(",")) {
		console.log("Starting profile", profile);
		const config = await b.newContext();
		await config.request.get(
			base + "/elementor-consent-probe/?cb_optimizer=" + profile,
			{ timeout: 90000 },
		);
		await config.close();
		console.log("Configured", profile);
		const ctx = await b.newContext();
		const p = await ctx.newPage();
		const attempts = [];
		const errors = [];
		await p.route("**/*", (r) => {
			let u = new URL(r.request().url());
			if (u.origin !== base) {
				attempts.push(u.origin + u.pathname);
				return r.fulfill({
					status: 200,
					contentType:
						r.request().resourceType() === "script"
							? "application/javascript"
							: "text/html",
					body: "",
				});
			}
			return r.continue();
		});
		p.on("pageerror", (e) => errors.push(e.message));
		const response = await p.goto(base + "/elementor-consent-probe/", {
			waitUntil: "commit",
			timeout: 30000,
		});
		await p
			.waitForLoadState("domcontentloaded", { timeout: 15000 })
			.catch((e) => errors.push(e.message));
		const html = await response.text();
		console.log("Loaded", profile);
		await p.waitForTimeout(600);
		const csp = response.headers()["content-security-policy"];
		const cacheControl = response.headers()["cache-control"];
		assert.ok(
			csp?.includes("default-src 'none'"),
			"Enforced CSP header missing",
		);
		assert.ok(cacheControl?.includes("no-store"), "HTML can be cached");
		await p.evaluate(() => {
			window.cbCspViolations = [];
			document.addEventListener("securitypolicyviolation", (e) =>
				window.cbCspViolations.push({
					directive: e.effectiveDirective,
					uri: e.blockedURI,
				}),
			);
			const url = "https://unregistered.cookie-consent.invalid/probe";
			fetch(url).catch(() => {});
			new Image().src = url + "?image";
			const script = document.createElement("script");
			script.src = url + "?script";
			document.head.append(script);
			const iframe = document.createElement("iframe");
			iframe.src = url + "?frame";
			document.body.append(iframe);
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = url + "?style";
			document.head.append(link);
			navigator.sendBeacon(url + "?beacon", "probe");
		});
		await p.waitForTimeout(200);
		const violations = await p.evaluate(() => window.cbCspViolations);
		assert.ok(
			violations.some((v) => v.directive === "connect-src"),
			"Unknown fetch not blocked by CSP",
		);
		assert.ok(
			violations.some((v) => v.directive === "img-src"),
			"Unknown image not blocked by CSP",
		);
		const before = [...attempts];
		await p.mouse.move(300, 300);
		await p.mouse.wheel(0, 200);
		await p.waitForTimeout(600);
		const afterInteraction = [...attempts];
		if (
			!(await p
				.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
				.count())
		) {
			results.push({
				profile,
				httpStatus: response.status(),
				htmlBytes: html.length,
				failure: "Consent UI missing after interactions",
				before,
				afterInteraction,
				errors,
				combinedAssets: (
					html.match(/wp-content\/(?:litespeed\/js|cache\/min)\//g) || []
				).length,
				delayedAssets: (
					html.match(
						/data-deferred|data-src|text\/litespeed|rocketlazyloadscript/g,
					) || []
				).length,
				diagnostics: await p.evaluate(() => ({
					host: !!document.getElementById("cookie-consent-host"),
					config: window.__cookieConsent,
					buttons: [...document.querySelectorAll("button")]
						.map((b) => b.textContent)
						.slice(0, 5),
				})),
			});
			await fs.writeFile(
				new URL(
					"../../../docs/research/elementor-" +
						(process.env.OPTIMIZER_NAME || "litespeed") +
						"-results.json",
					import.meta.url,
				),
				JSON.stringify({ base, results }, null, 2) + "\n",
			);
			await ctx.close();
			continue;
		}
		await Promise.all([
			p.waitForResponse(
				(r) =>
					r.request().isNavigationRequest() &&
					!!r.headers()["content-security-policy"],
			),
			p.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
		]);
		await p.waitForLoadState("domcontentloaded");
		await p.mouse.move(350, 350);
		await p.mouse.wheel(0, 100);
		await p.waitForTimeout(600);
		const refused = [...attempts];
		const [grantedResponse] = await Promise.all([
			p.waitForResponse(
				(r) =>
					r.request().isNavigationRequest() &&
					!!r
						.headers()
						["content-security-policy"]?.includes("https://youtube.com"),
			),
			p
				.locator(".cb-content-placeholder")
				.first()
				.getByRole("button", { name: /Zgadzam/ })
				.click(),
		]);
		assert.ok(
			grantedResponse
				.headers()
				["content-security-policy"].includes("https://youtube.com"),
			"Consent did not update HTTP policy",
		);
		await p.waitForLoadState("domcontentloaded");
		await p.mouse.move(400, 400);
		await p.waitForTimeout(800);
		await p.locator("#local-action").click();
		await p.waitForFunction(
			() => document.querySelector("#local-action")?.textContent === "Works",
			{ timeout: 10000 },
		);
		assert.deepEqual(before, [], "Network leak before consent");
		assert.deepEqual(afterInteraction, [], "Network leak after interaction");
		assert.deepEqual(refused, [], "Network leak after rejection");
		assert.ok(
			attempts.some((url) => url.includes("youtube.com")),
			"No YouTube load after consent",
		);
		assert.equal(await p.locator("#local-action").innerText(), "Works");
		await p.waitForFunction(() => window.cbFunctionalWorks === true, null, {
			timeout: 10000,
		});
		assert.equal(await p.evaluate(() => window.cbFunctionalWorks), true);
		assert.deepEqual(errors, []);
		results.push({
			csp,
			cacheControl,
			violations,
			grantedCsp: grantedResponse.headers()["content-security-policy"],
			profile,
			httpStatus: response.status(),
			htmlBytes: html.length,
			elementor: html.includes("elementor-element-testhtml"),
			combinedAssets: (
				html.match(/wp-content\/(?:litespeed\/js|cache\/min)\//g) || []
			).length,
			delayedAssets: (
				html.match(
					/data-deferred|data-src|text\/litespeed|rocketlazyloadscript/g,
				) || []
			).length,
			before,
			afterInteraction,
			refused,
			afterConsent: attempts,
			functionalFlag: await p.evaluate(() => window.cbFunctionalWorks === true),
			localButton: await p.locator("#local-action").innerText(),
			liveIframe: await p
				.locator('iframe[title="elementor-video"][src]')
				.count(),
			errors,
		});
		await ctx.close();
		await fs.writeFile(
			new URL(
				"../../../docs/research/elementor-" +
					(process.env.OPTIMIZER_NAME || "litespeed") +
					"-results.json",
				import.meta.url,
			),
			JSON.stringify({ base, results }, null, 2) + "\n",
		);
	}
	await fs.writeFile(
		new URL(
			"../../../docs/research/elementor-" +
				(process.env.OPTIMIZER_NAME || "litespeed") +
				"-results.json",
			import.meta.url,
		),
		JSON.stringify({ base, results }, null, 2) + "\n",
	);
	for (const row of results) {
		assert.ok(!row.failure, `Missing consent UI in ${row.profile}`);
		if (["combine", "both"].includes(row.profile))
			assert.ok(row.combinedAssets > 0, "Combining did not run");
		if (["delay", "both"].includes(row.profile))
			assert.ok(row.delayedAssets > 0, "Delay did not run");
	}
	console.log(JSON.stringify(results, null, 2));
} finally {
	await b.close();
}
