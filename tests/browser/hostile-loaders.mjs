import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({
	executablePath:
		process.env.CHROME_PATH ||
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: true,
});
const base = process.env.CONSENT_TEST_URL || "http://127.0.0.1:5173";
const cases = {
	"script-src-reset": `const s=document.createElement('script');s.src=url;s.type='text/javascript';document.head.append(s);`,
	"iframe-setAttribute": `const f=document.createElement('iframe');f.setAttribute('src',url);document.body.append(f);`,
	"nested-innerHTML": `const d=document.createElement('div');document.body.append(d);d.innerHTML='<iframe src="'+url+'"></iframe>';`,
	insertAdjacentHTML: `document.body.insertAdjacentHTML('beforeend','<iframe src="'+url+'"></iframe>');`,
	"image-srcset": `const i=new Image();i.srcset='https://www.facebook.com/tr?probe=srcset 1x';document.body.append(i);`,
	"iframe-srcdoc": `const f=document.createElement('iframe');f.srcdoc='<iframe src="'+url+'"></iframe>';document.body.append(f);`,
	setAttributeNS: `const f=document.createElement('iframe');document.body.append(f);f.setAttributeNS(null,'src',url);`,
	"range-contextual-fragment": `const r=document.createRange();document.body.append(r.createContextualFragment('<iframe src="'+url+'"></iframe>'));`,
	outerHTML: `const d=document.createElement('div');document.body.append(d);d.outerHTML='<iframe src="'+url+'"></iframe>';`,
	"shadow-innerHTML": `const d=document.createElement('div');document.body.append(d);d.attachShadow({mode:'open'}).innerHTML='<iframe src="'+url+'"></iframe>';`,
	fetch: `await fetch('https://www.google-analytics.com/g/collect').catch(()=>{});`,
	"iframe-realm-fetch": `const f=document.createElement('iframe');document.body.append(f);await f.contentWindow.fetch('https://www.google-analytics.com/g/collect').catch(()=>{});`,
};
const results = [];
try {
	for (const [name, code] of Object.entries(cases)) {
		const context = await browser.newContext();
		const page = await context.newPage();
		const requests = [];
		await page.route("**/*", async (route) => {
			const u = new URL(route.request().url());
			if (u.origin !== new URL(base).origin) {
				requests.push(u.origin + u.pathname);
				await route.fulfill({
					status: 200,
					contentType: "text/html",
					body: "mock",
				});
			} else await route.continue();
		});
		await page.goto(base);
		await page.waitForSelector(".cb-content-placeholder");
		await page
			.getByRole("button", { name: "Odrzuć wszystkie", exact: true })
			.click();
		await page.evaluate(async (code) => {
			const { installAutoBlocker } = await import("/src/core/auto-blocker.ts");
			installAutoBlocker(window.__cookieConsent);
			try {
				await new Function("url", `return (async()=>{${code}})()`)(
					"https://www.youtube.com/embed/privacy-probe",
				);
			} catch (e) {
				window.probeError = String(e);
			}
		}, code);
		await page.waitForTimeout(350);
		results.push({
			name,
			status: (await page.evaluate(() => window.probeError || null)) ? "ERROR" : requests.length ? "BYPASS" : "BLOCKED",
			requests,
			error: await page.evaluate(() => window.probeError || null),
		});
		await context.close();
	}
	const report = {
		scope:
			"Local Chrome dynamic-loader adversarial tests; not target WordPress/cache certification. External requests mocked before network delivery.",
		results,
	};
	await fs.writeFile(
		new URL("../../docs/research/hostile-loaders-results.json", import.meta.url),
		JSON.stringify(report, null, 2) + "\n",
	);
	console.log(JSON.stringify(report, null, 2));
} finally {
	await browser.close();
}
