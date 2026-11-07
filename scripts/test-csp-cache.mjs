import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = process.env.WORDPRESS_TEST_URL || "http://127.0.0.1:9403";
const rows = [];
const initialHtml = await (await fetch(base + "/elementor-consent-probe/")).text();
const config = JSON.parse(initialHtml.match(/window\.__cookieConsent=(\{.*?\});<\/script>/)[1]);
const grantCookie = "cb_csp_consent=" + encodeURIComponent(JSON.stringify({version: config.noticeVersion, services: ["youtube"], expires: Date.now() + 60000}));
for (let i = 0; i < 12; i++) {
	const granted = i % 2 === 1;
	const response = await fetch(base + "/elementor-consent-probe/", {
		headers: { cookie: granted ? grantCookie : "" },
	});
	assert.equal(response.status, 200);
	assert.notEqual(response.headers.get("x-litespeed-cache"), "hit");
	const csp = response.headers.get("content-security-policy");
	assert.equal(csp.includes("https://youtube.com"), granted);
	assert.match(response.headers.get("cache-control"), /no-store/);
	assert.equal(response.headers.get("x-litespeed-cache-control"), "no-cache");
	const html = await response.text();
	assert.ok(
		html.indexOf('http-equiv="Content-Security-Policy"') <
			html.indexOf('id="cookie4-consent-config"'),
	);
	assert.equal(
		html
			.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)/)[1]
			.includes("https://youtube.com"),
		granted,
	);
	rows.push({
		granted,
		status: response.status,
		csp,
		cacheControl: response.headers.get("cache-control"),
		liteSpeedCache: response.headers.get("x-litespeed-cache"),
	});
}
const report = JSON.stringify({ base, rows }, null, 2) + "\n";
await writeFile(
	new URL(
		"../docs/research/" +
			(process.env.OPTIMIZER_NAME || "wordpress") +
			"-csp-cache-results.json",
		import.meta.url,
	),
	report,
);
console.log(
	"PASS 12 alternating consent/no-consent responses: matching header/meta, no-store, no cache hits",
);
