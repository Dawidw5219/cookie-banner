import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9403";
const browser = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
try {
	const context = await browser.newContext();
	const page = await context.newPage();
	const network = [];
	await page.route("**/*", (r) => {
		if (new URL(r.request().url()).origin === base) return r.continue();
		network.push(r.request().url());
		return r.fulfill({
			contentType: "text/html",
			body: "<p>Unknown embed restored</p>",
		});
	});
	await page.goto(base + "/elementor-consent-probe/?cb_unknown=1");
	await page.waitForTimeout(300);
	assert.deepEqual(network, []);
	await Promise.all([
		page.waitForResponse((r) => r.request().isNavigationRequest()),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.waitForLoadState("domcontentloaded");
	const [response] = await Promise.all([
		page.waitForResponse(
			(r) =>
				r.request().isNavigationRequest() &&
				r
					.headers()
					["content-security-policy"]?.includes("https://unknown.vendor.test"),
		),
		page
			.locator(
				'iframe[title="unknown-vendor"] + .cb-content-placeholder button',
			)
			.click(),
	]);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(300);
	assert.deepEqual(network, ["https://unknown.vendor.test/embed"]);
	const csp = response.headers()["content-security-policy"];
	assert.ok(csp.includes("frame-src 'self' https://unknown.vendor.test"));
	assert.ok(csp.includes("script-src 'self'"));
	assert.ok(!csp.includes("never-allowed.test"));
	// A forged service ID is not permission to create a destination absent from HTML.
	await context.addCookies([
		{
			name: "cb_csp_consent",
			value: encodeURIComponent(
				JSON.stringify(["external-never-allowed.test"]),
			),
			url: base,
		},
	]);
	const forged = await context.request.get(
		base + "/elementor-consent-probe/?cb_unknown=1",
	);
	assert.ok(
		!forged.headers()["content-security-policy"].includes("never-allowed.test"),
	);
	const independent = await context.request.get(
		base + "/elementor-consent-probe/?cb_unknown=1&cb_extra_csp=1",
	);
	const policies = (await independent.headersArray()).filter(
		(h) => h.name.toLowerCase() === "content-security-policy",
	);
	assert.equal(policies.length, 2, "Independent site CSP was overwritten");
	assert.ok(policies.some((h) => h.value === "img-src 'self' data:"));
	await writeFile(
		new URL(
			"../docs/research/wordpress-csp-unknown-results.json",
			import.meta.url,
		),
		JSON.stringify({ base, csp, network, forgedCookieBlocked: true }, null, 2) +
			"\n",
	);
	console.log(
		"PASS unknown iframe: page-derived frame-only permission; unknown script and forged cookie remain denied",
	);
} finally {
	await browser.close();
}
