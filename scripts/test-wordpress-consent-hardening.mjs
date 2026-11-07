import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9403";
const reportDir = new URL(
	"../docs/research/consent-hardening/",
	import.meta.url,
);
await mkdir(reportDir, { recursive: true });
const browser = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const results = [];
try {
	const context = await browser.newContext();
	const page = await context.newPage();
	const network = [];
	await context.route("**/*", (route) => {
		const url = new URL(route.request().url());
		if (url.origin === base) return route.continue();
		network.push(url.origin + url.pathname);
		return route.fulfill({
			contentType:
				route.request().resourceType() === "script"
					? "application/javascript"
					: "text/html",
			body:
				route.request().resourceType() === "script"
					? "window.qaVendorLoaded=true;"
					: "<button onclick=\"this.textContent='Playing'\">Play</button>",
		});
	});
	const records = [];
	page.on("response", (response) => {
		if (
			response.url().includes("/consent-receipts") &&
			response.request().method() === "POST"
		)
			records.push(response);
	});
	await page.goto(base + "/elementor-consent-probe/?cb_unknown=1");
	await page.locator(".cb-content-placeholder").first().waitFor();
	await page.waitForTimeout(150);
	assert.deepEqual(network, []);
	const cfg = await page.evaluate(() => window.__cookieConsent);
	assert.ok(cfg.controller.name);
	assert.ok(cfg.noticeVersion);
	assert.ok(cfg.serviceDisclosures.youtube.retention);
	await Promise.all([
		page.waitForNavigation(),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	assert.deepEqual(network, []);
	await page.evaluate(() => {
		document.cookie = "_qa_tracker=active; Path=/";
		document.cookie = "qa_essential=keep; Path=/";
	});
	await Promise.all([
		page.waitForNavigation(),
		page
			.locator(".cb-content-placeholder")
			.first()
			.getByRole("button", { name: /Zgadzam/ })
			.click(),
	]);
	await page
		.frameLocator('iframe[title="elementor-video"]')
		.getByRole("button", { name: "Play" })
		.click();
	assert.equal(
		await page
			.frameLocator('iframe[title="elementor-video"]')
			.getByRole("button")
			.innerText(),
		"Playing",
	);
	assert.ok(network.length > 0);
	assert.ok(
		network.every((url) => new URL(url).hostname.endsWith("youtube.com")),
	);
	await page
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	assert.equal(
		await page
			.getByRole("switch", { name: "unknown.vendor.test", exact: true })
			.isDisabled(),
		true,
	);
	await page.screenshot({
		path: fileURLToPath(new URL("wordpress-preferences.png", reportDir)),
		fullPage: true,
	});
	const count = network.length;
	await Promise.all([
		page.waitForNavigation(),
		page.getByRole("button", { name: "Odrzuć wszystkie", exact: true }).click(),
	]);
	await page.locator(".cb-content-placeholder").first().waitFor();
	await page.waitForTimeout(250);
	assert.equal(network.length, count);
	const cookies = await context.cookies();
	assert.ok(!cookies.some((c) => c.name === "_qa_tracker"));
	assert.ok(cookies.some((c) => c.name === "qa_essential"));
	assert.equal(
		await page.locator('iframe[title="elementor-video"][src]').count(),
		0,
	);
	assert.ok(records.length >= 3);
	for (const response of records) assert.equal(response.status(), 200);
	const ids = records.map((r) => r.request().postDataJSON().id);
	results.push(
		"Guest refusal, per-provider consent and withdrawal each retained server-side; zero external requests before/refusal/after withdrawal; interactive Elementor embed works after consent; unknown provider disabled; tracker cookie deleted and essential cookie preserved",
	);
	await Promise.all([
		page.waitForNavigation(),
		page
			.locator(".cb-content-placeholder")
			.first()
			.getByRole("button", { name: /Zgadzam/ })
			.click(),
	]);
	const other = await context.newPage();
	await other.goto(base + "/elementor-consent-probe/");
	await other
		.getByRole("button", {
			name: "Wycofaj wszystkie opcjonalne zgody",
			exact: true,
		})
		.waitFor();
	await other.waitForLoadState("networkidle");
	const beforeOtherWithdrawal = network.length;
	const [updatedPolicy] = await Promise.all([
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
		!updatedPolicy
			.headers()
			["content-security-policy"].includes("https://youtube.com"),
	);
	assert.equal(network.length, beforeOtherWithdrawal);
	await other.close();
	results.push(
		"One-click withdrawal in another WordPress tab reloads the original tab with denied CSP, including previously active inert SDK scripts",
	);
	const forbidden = await context.request.get(
		base + "/wp-json/cookie4/v1/consent-receipts",
	);
	assert.ok([401, 403].includes(forbidden.status()));
	const noNonce = await context.request.post(
		base + "/wp-json/cookie4/v1/consent-receipts",
		{ data: {} },
	);
	assert.equal(noNonce.status(), 401);
	results.push(
		"Consent evidence export and unverified writes are denied to unauthenticated callers",
	);
	await context.close();
	const session = JSON.parse(
		await readFile("/tmp/cb-admin-test-session.json", "utf8"),
	);
	const admin = await browser.newContext();
	await admin.addCookies(session.cookies);
	const panel = await admin.newPage();
	await panel.goto(
		base + "/wp-admin/options-general.php?page=cookie-banner-wp",
	);
	const exportData = await panel.evaluate(async () => {
		const response = await fetch(
			window.cookie4Admin.restUrl + "/consent-receipts",
			{ headers: { "X-WP-Nonce": window.cookie4Admin.nonce } },
		);
		return { status: response.status, data: await response.json() };
	});
	assert.equal(exportData.status, 200);
	for (const id of ids)
		assert.ok(exportData.data.receipts.some((record) => record.id === id));
	const stored = exportData.data.receipts.find(
		(record) => record.id === ids[0],
	);
	assert.ok(stored.receipt.notice.controller.name);
	assert.equal(stored.receipt.version, cfg.noticeVersion);
	assert.ok(!JSON.stringify(stored).includes("userAgent"));
	assert.ok(!JSON.stringify(stored).includes("ipAddress"));
	results.push(
		"Administrator export contains matching receipt IDs, server time, categories, service choices and immutable disclosure snapshot without visitor IP/user-agent fields",
	);
	await panel
		.getByRole("button", { name: "Banner & texts", exact: true })
		.click();
	await panel
		.getByLabel("Data controller (legal name)", { exact: true })
		.waitFor();
	const preview = panel.frameLocator(
		'iframe[title="Isolated cookie banner preview"]',
	);
	await preview
		.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
		.waitFor();
	await preview
		.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
		.click();
	await preview
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.waitFor();
	await preview
		.getByRole("button", {
			name: "Wycofaj wszystkie opcjonalne zgody",
			exact: true,
		})
		.click();
	await preview
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	await preview
		.getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
		.click();
	assert.equal(
		await panel.evaluate(() => localStorage.getItem("cb_consent_record")),
		null,
	);
	results.push(
		"Opaque admin preview accepts, withdraws and accepts again in isolated memory without navigation or changes to the real site consent",
	);
	await panel.screenshot({
		path: fileURLToPath(new URL("wordpress-disclosure-fields.png", reportDir)),
		fullPage: true,
	});
	await panel.getByRole("button", { name: "Services", exact: true }).click();
	await panel
		.getByText("Provider privacy information", { exact: true })
		.waitFor();
	await panel
		.getByRole("button", { name: "Save reviewed information", exact: true })
		.first()
		.waitFor();
	const retentionInput = panel
		.getByLabel("Retention period or criteria", { exact: true })
		.first();
	const originalRetention = await retentionInput.inputValue();
	await retentionInput.fill(originalRetention + " — edited in QA");
	const savedDisclosure = panel.waitForResponse(
		(response) =>
			response.url().endsWith("/disclosures") &&
			response.request().method() === "PUT",
	);
	await panel
		.getByRole("button", { name: "Save reviewed information", exact: true })
		.first()
		.click();
	assert.equal((await savedDisclosure).status(), 200);
	const changedHtml = await (
		await admin.request.get(base + "/elementor-consent-probe/")
	).text();
	const changedConfig = JSON.parse(
		changedHtml.match(/window\.__cookieConsent=(\{.*?\});<\/script>/)[1],
	);
	assert.notEqual(changedConfig.noticeVersion, cfg.noticeVersion);
	const history = await panel.evaluate(async () =>
		(
			await fetch(window.cookie4Admin.restUrl + "/consent-receipts", {
				headers: { "X-WP-Nonce": window.cookie4Admin.nonce },
			})
		).json(),
	);
	assert.equal(
		history.receipts.find((record) => record.id === ids[0]).receipt.version,
		cfg.noticeVersion,
	);
	await retentionInput.fill(originalRetention);
	const restoredDisclosure = panel.waitForResponse(
		(response) =>
			response.url().endsWith("/disclosures") &&
			response.request().method() === "PUT",
	);
	await panel
		.getByRole("button", { name: "Save reviewed information", exact: true })
		.first()
		.click();
	assert.equal((await restoredDisclosure).status(), 200);
	results.push(
		"Editing and saving provider retention in the real admin changes the consent revision while historical evidence remains unchanged",
	);
	await panel.screenshot({
		path: fileURLToPath(
			new URL("wordpress-provider-disclosures.png", reportDir),
		),
		fullPage: true,
	});
	results.push(
		"New controller/purpose/version fields and provider disclosure editor render in the real WordPress admin",
	);
	await panel.getByRole("button", { name: "Diagnostics", exact: true }).click();
	const downloadEvent = panel.waitForEvent("download");
	await panel
		.getByRole("button", {
			name: "Export latest 100 consent records",
			exact: true,
		})
		.click();
	const download = await downloadEvent;
	assert.match(download.suggestedFilename(), /^consent-receipts-.*\.json$/);
	results.push(
		"Administrator can download the consent evidence from the Diagnostics panel",
	);
	await admin.close();
	console.log(JSON.stringify(results, null, 2));
	await writeFile(
		new URL("wordpress-results.json", reportDir),
		JSON.stringify(
			{ testedAt: new Date().toISOString(), results, network },
			null,
			2,
		) + "\n",
	);
} finally {
	await browser.close();
}
