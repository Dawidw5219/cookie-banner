import { chromium } from "playwright";
import fs from "node:fs/promises";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9402";
const b = await chromium.launch({
	executablePath:
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
try {
	const c = await b.newContext();
	const p = await c.newPage();
	let granted = false;
	const requests = [];
	const blocked = [];
	const errors = [];
	const badScripts = [];
	await p.route("**/*", (r) => {
		const u = new URL(r.request().url());
		if (u.origin === base) return r.continue();
		requests.push({ url: u.origin + u.pathname, granted });
		if (!granted) {
			blocked.push(u.origin + u.pathname);
			return r.abort();
		}
		return r.continue();
	});
	p.on("pageerror", (e) => errors.push(e.message));
	p.on("response", async (r) => {
		if (r.request().resourceType() === "script" && r.url().startsWith(base)) {
			const body = await r.text().catch(() => "");
			if (body.trimStart().startsWith("<"))
				badScripts.push({
					url: r.url(),
					status: r.status(),
					start: body.slice(0, 100),
				});
		}
	});
	await p.goto(base + "/elementor-consent-probe/", {
		waitUntil: "domcontentloaded",
		timeout: 60000,
	});
	await p.mouse.move(300, 300);
	await p.mouse.wheel(0, 100);
	await p.waitForTimeout(1000);
	const placeholders = await p.locator(".cb-content-placeholder").count();
	granted = true;
	await Promise.all([
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
	await p.waitForLoadState("domcontentloaded");
	await p.mouse.move(400, 400);
	await p.mouse.wheel(0, 100);
	await p.locator(".elementor-element-testnativevideo").click({ force: true });
	await p.waitForTimeout(500);
	let playerError = null;
	try {
		await p.waitForFunction(
			() => typeof window.YT?.Player === "function",
			null,
			{ timeout: 8000 },
		);
	} catch (e) {
		playerError = e.message;
	}
	let playback = { status: "not-tested" };
	let playClickError = null;
	try {
		await p
			.locator(".elementor-element-testnativevideo iframe")
			.waitFor({ state: "attached", timeout: 10000 });
		const frame = p.frameLocator(".elementor-element-testnativevideo iframe");
		await frame
			.getByRole("button", { name: /Play/i })
			.first()
			.click({ timeout: 5000 })
			.catch((e) => {
				playClickError = e.message;
			});
		await p.screenshot({ path: "/tmp/cb-youtube-player.png" });
		const video = frame.locator("video");
		await video.waitFor({ state: "attached", timeout: 10000 });
		playback = await video.evaluate(async (v) => {
			v.muted = true;
			// The real YouTube play button initializes the media source asynchronously.
			const deadline = Date.now() + 15000;
			while (v.readyState < 2 && Date.now() < deadline)
				await new Promise((r) => setTimeout(r, 200));
			if (v.readyState < 2)
				return { status: "timeout", readyState: v.readyState };
			if (v.paused) await v.play();
			const start = v.currentTime;
			await new Promise((r) => setTimeout(r, 2000));
			const result = {
				status: !v.paused && v.currentTime > start ? "playing" : "stalled",
				readyState: v.readyState,
				startTime: start,
				endTime: v.currentTime,
			};
			v.pause();
			return result;
		});
	} catch (e) {
		playback = { status: "unavailable", reason: e.message };
	}
	const report = {
		playClickError,
		playback,
		playerText: await p
			.frameLocator(".elementor-element-testnativevideo iframe")
			.locator("body")
			.innerText({ timeout: 1000 })
			.then((text) => text.slice(0, 600))
			.catch(() => null),
		base,
		blockedBeforeConsent: blocked,
		placeholders,
		requests,
		errors,
		playerError,
		playerApiReady: await p.evaluate(
			() => typeof window.YT?.Player === "function",
		),
		diagnostics: await p.evaluate(() => ({
			elementor: typeof window.elementorFrontend,
			ready: document.readyState,
			native: document.querySelector(".elementor-element-testnativevideo")
				?.outerHTML,
			apiScripts: [...document.scripts]
				.filter((s) => (s.src || s.dataset.cbSrc || "").includes("youtube"))
				.map((s) => s.outerHTML),
			state: localStorage.getItem("cb_consent_record"),
			badScripts: undefined,
		})),
		badScripts,
		nativeIframes: await p
			.locator(".elementor-element-testnativevideo iframe")
			.count(),
	};
	await fs.writeFile(
		new URL(
			"../docs/research/elementor-" +
				(process.env.PLAYER_TEST_NAME
					? process.env.PLAYER_TEST_NAME + "-"
					: "") +
				"live-player-results.json",
			import.meta.url,
		),
		JSON.stringify(report, null, 2) + "\n",
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await b.close();
}
