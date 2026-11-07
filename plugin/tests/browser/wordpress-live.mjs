import { chromium } from "playwright";
import fs from "node:fs/promises";
const url = process.env.WORDPRESS_TEST_URL;
if (!url) throw Error("Set WORDPRESS_TEST_URL to the confirmed target URL.");
const bundle = await fs.readFile(
	new URL("../../../dist/cookie-banner.js", import.meta.url),
	"utf8",
);
const b = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const results = [];
try {
	for (const mode of ["deployed", "local-runtime-substitution"]) {
		const ctx = await b.newContext();
		const p = await ctx.newPage();
		const external = [];
		const errors = [];
		let substituted = 0;
		p.on("pageerror", (e) => errors.push(e.message));
		await p.route("**/*", async (r) => {
			const u = new URL(r.request().url());
			if (u.hostname !== new URL(url).hostname) {
				external.push(u.origin + u.pathname);
				return r.abort();
			}
			if (
				mode === "local-runtime-substitution" &&
				u.pathname.includes("cookie-banner-wp/assets/cookie-banner.js")
			) {
				substituted++;
				return r.fulfill({
					contentType: "application/javascript; charset=utf-8",
					body:
						"if(window.__cookieConsent)window.__cookieConsent.autoBlock=true;\n" +
						bundle,
				});
			}
			return r.continue();
		});
		const response = await p.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: 30000,
		});
		await p.waitForTimeout(750);
		const beforeInteraction = external.length;
		await p.mouse.move(400, 300);
		await p.mouse.wheel(0, 600);
		await p.waitForTimeout(1500);
		const headers = response.headers();
		results.push({
			mode,
			status: response.status(),
			substituted,
			beforeInteraction,
			externalAttempts: [...new Set(external)],
			errors: errors.slice(0, 12),
			cacheHeaders: Object.fromEntries(
				Object.entries(headers).filter(([k]) =>
					/^(cache-control|age|x-cache|cf-cache-status|x-rocket-cache|last-modified)$/.test(
						k,
					),
				),
			),
			dom: await p.evaluate(() => ({
				title: document.title,
				theme: [
					...new Set(
						[...document.querySelectorAll("[src],[href]")]
							.map((e) => e.getAttribute("src") || e.getAttribute("href"))
							.flatMap(
								(s) => s.match(/\/wp-content\/themes\/([^/]+)/)?.[1] || [],
							),
					),
				],
				autoBlock: window.__cookieConsent?.autoBlock === true,
				host: !!document.getElementById("cookie-consent-host"),
				inert: document.querySelectorAll("[data-cb-service]").length,
			})),
		});
		await ctx.close();
	}
	const report = {
		url,
		scope:
			"Read-only public page. External requests aborted. Local runtime substitution does NOT install the PHP blocker or validate the new plugin with purged/warm server cache.",
		results,
	};
	await fs.writeFile(
		new URL("../../../docs/research/wordpress-live-results.json", import.meta.url),
		JSON.stringify(report, null, 2) + "\n",
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await b.close();
}
