import { browserTestOutputDirectory } from "../../../tests/browser-output.mjs";
import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9400";
const b = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const results = [];
try {
	for (const probe of [
		"static",
		"srcset",
		"srcdoc",
		"namespace",
		"shadow",
		"raw-loader",
		"fetch",
	]) {
		for (const pass of ["first", "repeat"]) {
			const c = await b.newContext({
				extraHTTPHeaders: {
					"If-Modified-Since": "Mon, 01 Jan 1900 00:00:00 GMT",
				},
			});
			const p = await c.newPage();
			const attempts = [];
			const errors = [];
			await p.route("**/*", (r) => {
				const u = new URL(r.request().url());
				if (u.origin !== base) {
					attempts.push(u.origin + u.pathname);
					return r.fulfill({
						status: 200,
						contentType: "text/html",
						body: "mock",
					});
				}
				return r.continue();
			});
			p.on("pageerror", (e) => errors.push(e.message));
			const response = await p.goto(base + "/probe-" + probe + "/", {
				waitUntil: "domcontentloaded",
			});
			await p.waitForTimeout(350);
			const html = await response.text();
			results.push({
				probe,
				pass,
				status: attempts.length ? "BYPASS" : "BLOCKED",
				attempts,
				errors,
				theme: response.headers()["x-cb-test-theme"],
				wordpress: response.headers()["x-cb-test-wp"],
				cachePlugin: response.headers()["x-cb-test-cache"],
				cacheEvidence:
					html.match(/<!--[^]*?Cache Enabler[^]*?-->/)?.[0] || null,
				placeholders: await p.locator(".cb-content-placeholder").count(),
				banner: await p.locator("#cookie-consent-host").count(),
			});
			await c.close();
		}
	}
	const report = {
		scope:
			"Full local WordPress Playground + real active theme + installed Cache Enabler; repeated anonymous requests are not proof of cache HIT without cacheEvidence.",
		results,
	};
	await fs.writeFile(
		new URL(
			browserTestOutputDirectory + "/wordpress-playground-results.json",
			import.meta.url,
		),
		JSON.stringify(report, null, 2) + "\n",
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await b.close();
}
