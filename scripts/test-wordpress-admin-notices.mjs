import { chromium } from "playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9403";
const session = JSON.parse(
	await fs.readFile(
		process.env.WORDPRESS_ADMIN_SESSION || "/tmp/cb-admin-test-session.json",
		"utf8",
	),
);
const browser = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
try {
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1050 },
	});
	await context.addCookies(session.cookies);
	const page = await context.newPage();
	await page.route("**/*", (r) =>
		new URL(r.request().url()).origin === base ? r.continue() : r.abort(),
	);
	await page.goto(
		base + "/wp-admin/options-general.php?page=cookie-banner-wp",
		{ waitUntil: "domcontentloaded" },
	);
	await page.locator('svg[data-cookie4-brand="cookie"]').waitFor();
	assert.equal(
		await page
			.locator("#cb-test-foreign-notice,#cb-test-foreign-global-notice")
			.count(),
		0,
	);
	assert.equal(await page.getByText(/WP Rocket is good to go/).count(), 0);
	await page.getByText(/GitHub API rate limit reached/).waitFor();
	const other = await context.request.get(base + "/wp-admin/plugins.php");
	const html = await other.text();
	assert.ok(
		html.includes('id="cb-test-foreign-notice"') &&
			html.includes('id="cb-test-foreign-global-notice"'),
	);
	await fs.writeFile(
		"docs/research/wordpress-admin-notices-results.json",
		JSON.stringify(
			{
				base,
				checks: [
					"Shared cookie icon renders",
					"Foreign admin_notices and all_admin_notices removed on our screen",
					"Our updater notice remains visible",
					"Foreign notices remain on the Plugins screen",
				],
			},
			null,
			2,
		) + "\n",
	);
	console.log(
		"PASS cookie branding, isolated foreign notices, retained own updater notice, unchanged other admin screens",
	);
} finally {
	await browser.close();
}
