import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9400";
const b = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const outcomes = [];
async function visitor() {
	const c = await b.newContext({
		extraHTTPHeaders: { "If-Modified-Since": "Mon, 01 Jan 1900 00:00:00 GMT" },
	});
	const p = await c.newPage();
	const requests = [];
	await p.route("**/*", (r) => {
		const u = new URL(r.request().url());
		if (u.origin !== base) {
			requests.push(u.origin + u.pathname);
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
	return { c, p, requests };
}
try {
	const v = await visitor();
	await v.p.goto(base + "/probe-static/");
	await v.p.waitForSelector(".cb-content-placeholder");
	assert.equal(v.requests.length, 0);
	outcomes.push("no request before consent on cached WP page");
	await v.p
		.locator(".cb-content-placeholder")
		.getByRole("button", { name: /Zgadzam/ })
		.click();
	await v.p.waitForTimeout(300);
	assert(v.requests.length > 0);
	assert(v.requests.every((u) => u.includes("youtube")));
	outcomes.push("only selected provider activated");
	await v.p.reload();
	await v.p.waitForTimeout(400);
	assert.equal(await v.p.locator('iframe[title="raw-video"][src]').count(), 1);
	outcomes.push("grant restored after reload");
	await v.p
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	const nav = v.p.waitForNavigation();
	await v.p
		.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
		.click();
	await nav;
	const before = v.requests.length;
	await v.p.waitForTimeout(350);
	assert.equal(v.requests.length, before);
	assert.equal(await v.p.locator('iframe[title="raw-video"][src]').count(), 0);
	outcomes.push("withdrawal persists after reload");
	await v.c.close();
	const fresh = await visitor();
	await fresh.p.goto(base + "/probe-static/");
	await fresh.p.waitForSelector(".cb-content-placeholder");
	await fresh.p.waitForTimeout(250);
	assert.equal(fresh.requests.length, 0);
	outcomes.push("cache does not share a previous visitor grant");
	await fresh.c.close();
	await fs.writeFile(
		new URL("../docs/research/wordpress-consent-results.json", import.meta.url),
		JSON.stringify({ base, outcomes }, null, 2) + "\n",
	);
	console.log(outcomes);
} finally {
	await b.close();
}
