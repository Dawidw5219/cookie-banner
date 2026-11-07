import { describe, expect, it } from "vitest";
import { buildConsentCsp, consentCspHeaders, readCspConsent } from "./csp";
const options = {
	noticeVersion: "1",
	services: {
		youtube: {
			"frame-src": ["https://www.youtube.com"],
			"script-src": ["https://www.youtube.com"],
		},
	},
};
describe("server CSP", () => {
	it("keeps optimizer compatibility local and opt-in", () => {
		expect(buildConsentCsp(options)).not.toMatch(/unsafe-eval|blob:/);
		const policy = buildConsentCsp({
			...options,
			allowEval: true,
			allowBlobScripts: true,
		});
		expect(policy).toContain("'unsafe-eval' blob:");
		expect(policy).toContain("connect-src 'self'");
		expect(policy).not.toContain("https:");
	});
	it("denies unknown destinations before consent and ignores unknown cookie IDs", () => {
		expect(buildConsentCsp(options)).toContain("connect-src 'self'");
		expect(buildConsentCsp(options, ["unknown", "__proto__"])).not.toContain(
			"https:",
		);
	});
	it("grants only the configured directive and emits private no-store", () => {
		const headers = consentCspHeaders(
			options,
			`other=1; cb_csp_consent=${encodeURIComponent(JSON.stringify({ version: "1", services: ["youtube"], expires: Date.now() + 10000 }))}`,
		);
		expect(headers["Content-Security-Policy"]).toContain(
			"frame-src https://www.youtube.com",
		);
		expect(headers["Content-Security-Policy"]).toContain("connect-src 'self';");
		expect(headers["Cache-Control"]).toContain("no-store");
		expect(headers.Vary).toBe("Cookie");
	});
	it("fails closed on malformed cookies and rejects directive injection", () => {
		for (const value of ["{", "%", "%7B%22youtube%22%3Atrue%7D", "%5Btrue%5D"])
			expect(readCspConsent("cb_csp_consent=" + value)).toEqual([]);
		expect(() =>
			buildConsentCsp({
				services: {},
				essential: { "connect-src": ["https://example.com; script-src *"] },
			}),
		).toThrow();
	});
});

it("rejects stale and expired consent before constructing response headers", () => {
	const encode = (version: string, expires: number) =>
		`cb_csp_consent=${encodeURIComponent(JSON.stringify({ version, services: ["youtube"], expires }))}`;
	expect(readCspConsent(encode("old", Date.now() + 10000), "new")).toEqual([]);
	expect(readCspConsent(encode("new", Date.now() - 1), "new")).toEqual([]);
	expect(readCspConsent(encode("new", Date.now() + 10000), "new")).toEqual([
		"youtube",
	]);
	expect(readCspConsent("cb_csp_consent=%5B%22youtube%22%5D", "new")).toEqual(
		[],
	);
});

it("blocks unsupervised local frames and workers that could otherwise escape the document network policy", () => {
 const policy = buildConsentCsp(options);
 expect(policy).toContain("frame-src 'none'");
 expect(policy).toContain("worker-src 'none'");
});

it("binds multilingual SSR network grants to the requested page language", () => {
 const cookie="cb_csp_consent="+encodeURIComponent(JSON.stringify({version:"v1",lang:"de-DE",services:["youtube"],expires:Date.now()+10000}));
 expect(readCspConsent(cookie,"v1","de_DE")).toEqual(["youtube"]);
 expect(readCspConsent(cookie,"v1","fr")).toEqual([]);
 expect(readCspConsent("cb_csp_consent="+encodeURIComponent(JSON.stringify({version:"v1",services:["youtube"],expires:Date.now()+10000})),"v1","de")).toEqual([]);
});
