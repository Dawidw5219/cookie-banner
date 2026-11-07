import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
const sourceRoot = fileURLToPath(new URL("../../src/", import.meta.url));

const base = process.env.CONSENT_TEST_URL || "http://127.0.0.1:5173";
const chrome =
	process.env.CHROME_PATH ||
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath = await fs.access(chrome).then(
	() => chrome,
	() => undefined,
);
const browser = await chromium.launch({ executablePath, headless: true });

// Mock external providers: a test must never transmit visitor data to them.
async function createPage(fixture) {
	const context = await browser.newContext();
	const page = await context.newPage();
	const requests = [];
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== new URL(base).origin) {
			requests.push(url.href);
			await route.fulfill({
				status: 200,
				contentType: "text/html; charset=utf-8",
				body: "<!doctype html><title>Mock provider</title>",
			});
		} else if (fixture && url.pathname === "/__wp-fixture") {
			await route.fulfill({
				contentType: "text/html; charset=utf-8",
				body: fixture,
			});
		} else await route.continue();
	});
	return { page, requests, close: () => context.close() };
}

try {
	const ui = await createPage();
	await ui.page.goto(`${base}/?lang=pl`);
	await ui.page.waitForSelector(".cb-content-placeholder");
	await ui.page.waitForTimeout(250);
	assert.deepEqual(ui.requests, [], "No external request before consent");
	await ui.page
		.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
		.click();
	assert.equal(await ui.page.locator("iframe[src]").count(), 0);
	const firstEmbed = ui.page.waitForResponse((response) =>
		response.url().includes("youtube-nocookie.com"),
	);
	await ui.page
		.locator(".cb-content-placeholder")
		.first()
		.getByRole("button", { name: /Zgadzam się/ })
		.click();
	await ui.page.waitForFunction(
		() => document.querySelectorAll("iframe[src]").length === 1,
	);
	await firstEmbed;
	assert.equal(ui.requests.length, 1);
	assert.match(ui.requests[0], /youtube-nocookie\.com/);
	const restoredEmbed = ui.page.waitForResponse((response) =>
		response.url().includes("youtube-nocookie.com"),
	);
	await ui.page.reload();
	await ui.page.waitForFunction(
		() => document.querySelectorAll("iframe[src]").length === 1,
	);
	await restoredEmbed;
	assert.equal(ui.requests.length, 2);
	await ui.page
		.getByRole("button", { name: "Preferencje plików cookie", exact: true })
		.click();
	assert.equal(
		await ui.page.getByRole("switch").count(),
		4,
		"Only categories and the observed YouTube provider",
	);
	const reloaded = ui.page.waitForNavigation();
	await ui.page
		.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
		.click();
	await reloaded;
	await ui.page.waitForSelector(".cb-content-placeholder");
	await ui.page.waitForTimeout(250);
	assert.equal(
		ui.requests.length,
		2,
		"Withdrawal makes no further provider request",
	);
	await ui.page.evaluate(() => {
		const iframe = document.createElement("iframe");
		iframe.dataset.cbSrc = "https://unknown.example/widget";
		document.body.append(iframe);
	});
	await ui.page.waitForFunction(
		() => document.querySelectorAll(".cb-content-placeholder").length === 2,
	);
	assert.equal(ui.requests.length, 2);
	await ui.close();
	console.log(
		"PASS UI: no requests before consent/refusal; per-provider grant, saved choice, withdrawal and dynamic inert embeds.",
	);

	const guard = await createPage();
	await guard.page.goto(`${base}/?lang=pl`);
	await guard.page.waitForSelector(".cb-content-placeholder");
	await guard.page
		.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
		.click();
	await guard.page.evaluate(async (source) => {
		const { installAutoBlocker } = await import(source);
		installAutoBlocker(window.__cookieConsent);
		const script = document.createElement("script");
		script.src = "https://www.youtube.com/iframe_api";
		script.type = "text/javascript";
		document.head.appendChild(script);
		const iframe = document.createElement("iframe");
		iframe.setAttribute("src", "https://player.vimeo.com/video/123");
		document.body.append(iframe);
		const image = new Image();
		image.src = "https://www.facebook.com/tr?id=123";
		const wrapper = document.createElement("div");
		document.body.append(wrapper);
		wrapper.innerHTML =
			'<iframe src="https://www.youtube.com/embed/123"></iframe><img src="https://www.facebook.com/tr?id=456">';
		wrapper.insertAdjacentHTML(
			"beforeend",
			'<iframe src="https://unknown.example/embed"></iframe>',
		);
		await fetch("https://www.google-analytics.com/g/collect").catch(() => {});
		try {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", "https://www.google-analytics.com/g/collect");
			xhr.send();
		} catch {
			/* Expected denial. */
		}
		navigator.sendBeacon("https://www.google-analytics.com/g/collect", "test");
	}, `/@fs${sourceRoot}core/auto-blocker.ts`);
	await guard.page.waitForTimeout(300);
	assert.deepEqual(
		guard.requests,
		[],
		"Dynamic loaders and network APIs must not reach providers",
	);
	assert.equal(
		await guard.page
			.locator('script[data-cb-service="youtube"]')
			.evaluateAll((nodes) =>
				nodes.every(
					(node) => node.type === "text/plain" && !node.hasAttribute("src"),
				),
			),
		true,
	);
	await guard.page.evaluate(async (source) => {
		const { setServiceConsent } = await import(source);
		setServiceConsent("youtube", true);
	}, `/@fs${sourceRoot}api/native.ts`);
	await guard.page.waitForTimeout(300);
	assert(guard.requests.length >= 1);
	assert(
		guard.requests.every((url) => new URL(url).hostname.includes("youtube")),
	);
	await guard.close();
	console.log(
		"PASS guard: src/type/setAttribute, insertion, raw HTML, fetch, XHR and beacon; only consented provider released.",
	);

	if (process.env.WP_FIXTURE_PATH) {
		const wp = await createPage(
			await fs.readFile(process.env.WP_FIXTURE_PATH, "utf8"),
		);
		const errors = [];
		wp.page.on("pageerror", (error) => errors.push(error.message));
		await wp.page.goto(`${base}/__wp-fixture`);
		await wp.page.waitForSelector(".cb-content-placeholder");
		await wp.page.waitForTimeout(250);
		assert.deepEqual(wp.requests, []);
		assert.deepEqual(errors, []);
		assert.equal(
			await wp.page
				.locator('script[data-cb-service="youtube"][type="text/plain"]')
				.count(),
			1,
		);
		await wp.page
			.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
			.click();
		await wp.page
			.locator(".cb-content-placeholder")
			.first()
			.getByRole("button", { name: /Zgadzam się/ })
			.click();
		await wp.page.waitForTimeout(250);
		assert(wp.requests.length >= 1);
		assert(wp.requests.every((url) => url.includes("youtube")));
		await wp.close();
		console.log(
			"PASS WP fixture: PHP-transformed HTML + production IIFE, early bootstrap and split-string inline loader.",
		);
	} else
		console.log(
			"SKIP WP fixture: set WP_FIXTURE_PATH to output from plugin/tests/php/content-blocker.php.",
		);
} finally {
	await browser.close();
}
