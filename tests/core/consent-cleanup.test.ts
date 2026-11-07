// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { cleanupRevokedConsent } from "../../src/core/consent-cleanup";
import {
	getConsentState,
	hasConsented,
	resetConsent,
	saveConsentState,
} from "../../src/core/consent-storage";
import { consentConfig } from "../fixtures/consent-config";

beforeEach(() => {
	resetConsent();
	document.head.replaceChildren();
	document.documentElement.removeAttribute("data-cb-revoked");
	localStorage.clear();
	sessionStorage.clear();
	window.__cookieConsent = consentConfig();
});
it("deletes explicitly declared tracker identifiers and preserves essential storage", () => {
	document.cookie = "_test_tracker=present; Path=/";
	document.cookie = "site_session=essential; Path=/";
	localStorage.setItem("tracker-id", "123");
	localStorage.setItem("cart", "keep");
	sessionStorage.setItem("tracker-session", "123");
	const config = consentConfig({
		serviceDisclosures: {
			youtube: {
				description: "Video",
				retention: "Session",
				privacyUrl: "https://example.com/privacy",
				cleanup: {
					cookies: ["_test_tracker"],
					localStorage: ["tracker-id"],
					sessionStorage: ["tracker-session"],
				},
			},
		},
	});
	cleanupRevokedConsent(
		config,
		{
			essential: true,
			analytics: false,
			marketing: false,
			services: { youtube: true },
		},
		{ essential: true, analytics: false, marketing: false },
	);
	expect(document.cookie).not.toContain("_test_tracker");
	expect(document.cookie).toContain("site_session=essential");
	expect(localStorage.getItem("tracker-id")).toBeNull();
	expect(localStorage.getItem("cart")).toBe("keep");
	expect(sessionStorage.getItem("tracker-session")).toBeNull();
});
it("does not issue a CSP grant when persistence fails, but refusal remains usable", () => {
	window.__cookieConsent!.strictCsp = true;
	const write = vi
		.spyOn(Storage.prototype, "setItem")
		.mockImplementation(() => {
			throw new Error("Quota");
		});
	expect(() =>
		saveConsentState({ essential: true, analytics: true, marketing: false }),
	).toThrow("Quota");
	expect(document.cookie).not.toContain("cb_csp_consent=");
	expect(hasConsented()).toBe(false);
	saveConsentState({ essential: true, analytics: false, marketing: false });
	expect(hasConsented()).toBe(true);
	expect(getConsentState().analytics).toBe(false);
	write.mockRestore();
});

it("stores a refusal when randomUUID is unavailable on an insecure origin", () => {
	const original = globalThis.crypto;
	vi.stubGlobal("crypto", {
		getRandomValues: original.getRandomValues.bind(original),
	});
	try {
		saveConsentState({ essential: true, analytics: false, marketing: false });
		expect(JSON.parse(localStorage.getItem("cb_consent_record")!).id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	} finally {
		vi.unstubAllGlobals();
	}
});
