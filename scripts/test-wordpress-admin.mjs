import { chromium, request } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
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
const checks = [];
let context;
try {
	const anonymous = await request.newContext();
	for (const path of ["services", "diagnostics"]) {
		const response = await anonymous.get(base + "/wp-json/cookie4/v1/" + path);
		assert.ok(
			[401, 403].includes(response.status()),
			"Anonymous admin API access: " + path,
		);
	}
	const denied = await anonymous.put(base + "/wp-json/cookie4/v1/services", {
		data: { services: [] },
	});
	assert.ok([401, 403].includes(denied.status()));
	const deniedPurge = await anonymous.post(
		base + "/wp-json/cookie4/v1/maintenance/purge-cache",
	);
	assert.ok([401, 403].includes(deniedPurge.status()));
	await anonymous.dispose();
	checks.push("Anonymous read/write admin APIs denied");
	context = await browser.newContext({
		viewport: { width: 1440, height: 1050 },
	});
	await context.addCookies(session.cookies);
	const page = await context.newPage();
	const errors = [];
	page.on("pageerror", (error) => errors.push(error.message));
	await page.route("**/*", (route) =>
		new URL(route.request().url()).origin === base
			? route.continue()
			: route.abort(),
	);
	await page.goto(
		base + "/wp-admin/options-general.php?page=cookie-banner-wp",
		{ waitUntil: "domcontentloaded" },
	);
	await page
		.getByRole("heading", { name: "Setup checklist", exact: true })
		.waitFor();
	const nonce = await page.evaluate(() => window.cookie4Admin.nonce);
	const headers = { "X-WP-Nonce": nonce };
	await fs.mkdir("docs/screenshots/admin", { recursive: true });
	await page.waitForFunction(
		() =>
			![...document.querySelectorAll("#cookie-banner-admin p")].some(
				(p) => p.textContent === "—",
			),
	);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({
		path: "docs/screenshots/admin/overview.png",
		fullPage: true,
	});
	checks.push("Real WordPress overview and setup checklist render");
	await page.evaluate(() =>
		localStorage.setItem("cb_preview_probe", "preserved"),
	);
	await page
		.getByRole("button", { name: "Banner & texts", exact: true })
		.click();
	const privacy = page
		.locator('#cookie-banner-admin input[type="url"]')
		.first();
	const oldPrivacy = await privacy.inputValue();
	await page
		.frameLocator('iframe[title="Isolated cookie banner preview"]')
		.locator("#cookie-consent-host")
		.waitFor({ state: "attached" });
	assert.equal(
		await page.evaluate(() => localStorage.getItem("cb_preview_probe")),
		"preserved",
	);
	await page.evaluate(() => localStorage.removeItem("cb_preview_probe"));
	checks.push("Sandboxed local preview preserves real consent storage");
	await privacy.fill("https://example.com/privacy-draft");
	await page.getByRole("button", { name: "Services", exact: true }).click();
	await page
		.getByRole("heading", { name: "Add an integration", exact: true })
		.waitFor();
	await page
		.getByLabel("Service name", { exact: true })
		.fill("QA booking calendar");
	await page
		.getByLabel("Service ID", { exact: true })
		.fill("qa-booking-calendar");
	await page
		.getByLabel("What is this service used for?", { exact: true })
		.fill(
			"Allow visitors to book an appointment through an external calendar.",
		);
	await page
		.getByLabel("HTTPS URL prefixes — one per line", { exact: true })
		.fill("https://unknown.vendor.test/embed");
	await page
		.getByRole("button", { name: "Banner & texts", exact: true })
		.click();
	assert.equal(await privacy.inputValue(), "https://example.com/privacy-draft");
	await privacy.fill(oldPrivacy);
	let releaseSave;
	const saveGate = new Promise((resolve) => {
		releaseSave = resolve;
	});
	const holdSave = async (route) => {
		if (route.request().method() === "PUT") await saveGate;
		await route.continue();
	};
	const settingsPattern = "**/wp-json/cookie4/v1/settings";
	await page.route(settingsPattern, holdSave);
	const inFlight = page.waitForResponse(
		(r) => r.request().method() === "PUT" && r.url().endsWith("/settings"),
	);
	await page
		.getByRole("button", { name: "Save banner settings", exact: true })
		.click();
	await privacy.fill("https://example.com/still-unsaved");
	releaseSave();
	assert.equal((await inFlight).status(), 200);
	await page.unroute(settingsPattern, holdSave);
	await page
		.getByRole("button", { name: "Save banner settings", exact: true })
		.waitFor();
	assert.equal(await privacy.inputValue(), "https://example.com/still-unsaved");
	checks.push("Edits made during a save remain dirty and are not lost");
	await privacy.fill(oldPrivacy);
	const [settingsSaved] = await Promise.all([
		page.waitForResponse(
			(r) => r.request().method() === "PUT" && r.url().endsWith("/settings"),
		),
		page
			.getByRole("button", { name: "Save banner settings", exact: true })
			.click(),
	]);
	assert.equal(settingsSaved.status(), 200);
	await page
		.getByRole("button", { name: "Save banner settings", exact: true })
		.waitFor({ state: "hidden" });
	await page.getByRole("button", { name: "Services", exact: true }).click();
	assert.equal(
		await page.getByLabel("Service name", { exact: true }).inputValue(),
		"QA booking calendar",
	);
	checks.push("Banner and integration drafts survive navigation");
	await page.getByRole("button", { name: "Add service", exact: true }).click();
	await page.locator("h3").filter({ hasText: "QA booking calendar" }).waitFor();
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({
		path: "docs/screenshots/admin/services.png",
		fullPage: true,
	});
	let response = await context.request.get(
		base + "/wp-json/cookie4/v1/services",
		{ headers },
	);
	let saved = (await response.json()).services;
	const custom = saved.find((service) => service.id === "qa-booking-calendar");
	assert.ok(custom);
	checks.push("UI saves a custom service through nonce-protected REST");
	const visitor = await browser.newContext();
	const frontend = await visitor.newPage();
	const network = [];
	await frontend.route("**/*", (route) => {
		if (new URL(route.request().url()).origin === base) return route.continue();
		network.push(route.request().url());
		return route.fulfill({
			contentType: "text/html",
			body: "<p>Custom service restored</p>",
		});
	});
	await frontend.goto(base + "/elementor-consent-probe/?cb_unknown=1");
	await frontend.waitForTimeout(300);
	assert.deepEqual(network, []);
	const before = await frontend
		.locator(".cb-content-placeholder")
		.allTextContents();
	assert.ok(before.some((text) => text.includes("QA booking calendar")));
	await Promise.all([
		frontend.waitForResponse((r) => r.request().isNavigationRequest()),
		frontend
			.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
			.click(),
	]);
	await frontend.waitForLoadState("domcontentloaded");
	const [granted] = await Promise.all([
		frontend.waitForResponse(
			(r) =>
				r.request().isNavigationRequest() &&
				r.headers()["content-security-policy"]?.includes("unknown.vendor.test"),
		),
		frontend
			.locator(
				'iframe[title="unknown-vendor"] + .cb-content-placeholder button',
			)
			.click(),
	]);
	await frontend.waitForLoadState("domcontentloaded");
	await frontend.waitForTimeout(300);
	assert.ok(
		granted
			.headers()
			["content-security-policy"].includes("unknown.vendor.test"),
	);
	assert.deepEqual(network, ["https://unknown.vendor.test/embed"]);
	await visitor.close();
	checks.push(
		"Custom service shares frontend registry: no request before consent; only its frame released after consent",
	);
	const changed = saved.map((service) =>
		service.id === custom.id
			? { ...service, description: "Different purpose" }
			: service,
	);
	response = await context.request.put(base + "/wp-json/cookie4/v1/services", {
		headers,
		data: { services: changed },
	});
	assert.equal(response.status(), 400);
	response = await context.request.put(base + "/wp-json/cookie4/v1/services", {
		headers,
		data: {
			services: [
				...saved,
				{
					...custom,
					id: "qa-injection",
					urls: ["https://evil.test;script-src *"],
				},
			],
		},
	});
	assert.equal(response.status(), 400);
	response = await context.request.put(base + "/wp-json/cookie4/v1/services", {
		headers,
		data: { services: saved.filter((service) => service.id !== custom.id) },
	});
	assert.equal(response.status(), 200);
	response = await context.request.put(base + "/wp-json/cookie4/v1/services", {
		headers,
		data: { services: changed },
	});
	assert.equal(response.status(), 400, "Retired ID reused for a new purpose");
	checks.push(
		"Atomic validation rejects CSP injection and prevents reusing old consent even after removing a service",
	);
	await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
	await page
		.getByRole("heading", { name: "Protection & compatibility", exact: true })
		.waitFor();
	await page
		.getByRole("button", { name: "Check frontend headers", exact: true })
		.click();
	await page.getByText("✓ Default-deny CSP", { exact: true }).waitFor();
	await page.getByText("✓ HTML no-store", { exact: true }).waitFor();
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.screenshot({
		path: "docs/screenshots/admin/diagnostics.png",
		fullPage: true,
	});
	checks.push("Diagnostics reads actual frontend CSP and cache headers");
	await page.setViewportSize({ width: 390, height: 844 });
	await page
		.getByRole("button", { name: "Banner & texts", exact: true })
		.click();
	assert.equal(
		await page.evaluate(
			() => document.documentElement.scrollWidth > innerWidth + 1,
		),
		false,
	);
	assert.deepEqual(errors, []);
	checks.push("Admin shell fits mobile viewport; no JavaScript errors");
	await fs.writeFile(
		"docs/research/wordpress-admin-results.json",
		JSON.stringify({ base, checks }, null, 2) + "\n",
	);
	console.log(checks.map((item) => "PASS " + item).join("\n"));
} finally {
	if (context) {
		// Restore only this isolated fixture's original active service list.
		const page = context.pages()[0];
		if (page && !page.isClosed()) {
			const nonce = await page
				.evaluate(() => window.cookie4Admin?.nonce)
				.catch(() => null);
			if (nonce)
				await context.request.put(base + "/wp-json/cookie4/v1/services", {
					headers: { "X-WP-Nonce": nonce },
					data: { services: session.services },
				});
		}
	}
	await browser.close();
}
