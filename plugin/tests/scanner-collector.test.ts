// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import scanner from "../assets/cookie-scanner-frontend.js?raw";

afterEach(() => {
	localStorage.clear();
	sessionStorage.clear();
	document.body.replaceChildren();
	vi.restoreAllMocks();
});

it("reports cookie and storage names without reading or transmitting stored values", async () => {
	document.cookie = "scanner_probe=secret-cookie-token";
	localStorage.setItem("auth_token", "secret-local-token");
	sessionStorage.setItem("session_token", "secret-session-token");
	const getItem = vi.spyOn(Storage.prototype, "getItem");
	const requests: unknown[] = [];
	const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
		if (init?.body) requests.push(JSON.parse(String(init.body)));
		return { ok: true, json: async () => ({ cookies: [] }) };
	});
	const observer = { observe() {}, disconnect() {} };
	const runtime = {
		window: {
			__cookieScanConfig: { restUrl: "/wp-json/cookie4/v1/scan", nonce: "test" },
			location, addEventListener() {},
		},
		document, location, localStorage, sessionStorage, fetch, URL,
		performance: { getEntriesByType: () => [] },
		MutationObserver: function () { return observer; },
		setInterval() {}, setTimeout() {}, console,
	};
	new Function(...Object.keys(runtime), scanner)(...Object.values(runtime));
	await vi.waitFor(() => expect(requests.length).toBeGreaterThan(0));
	expect(getItem).not.toHaveBeenCalled();
	const payload = JSON.stringify(requests);
	expect(payload).toContain("scanner_probe");
	expect(payload).toContain("auth_token");
	expect(payload).toContain("session_token");
	expect(payload).not.toContain("secret-");
	expect(payload).not.toContain('"value"');
	document.cookie = "scanner_probe=; Max-Age=0; Path=/";
});
