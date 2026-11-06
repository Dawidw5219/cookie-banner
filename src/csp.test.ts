import { describe, expect, it } from "vitest";
import { buildConsentCsp, consentCspHeaders, readCspConsent } from "./csp";
const options = {
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
			"other=1; cb_csp_consent=%5B%22youtube%22%5D",
		);
		expect(headers["Content-Security-Policy"]).toContain(
			"frame-src 'self' https://www.youtube.com",
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
