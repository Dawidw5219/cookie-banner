// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { consentConfig } from "../fixtures/consent-config";

let releases: (() => void)[] = [];

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
	document.body.replaceChildren();
	delete window.__cookieConsent;
});

afterEach(() => {
	for (const release of releases.reverse()) release();
	releases = [];
	delete window.__cookieConsent;
	document.body.replaceChildren();
});

it("enables and disables automatic blocking across native reinitialization", async () => {
	const originalSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
	const { initializeConsent } = await import("../../src/api/native");
	releases.push(await initializeConsent(consentConfig({ autoBlock: false })));
	releases.push(await initializeConsent(consentConfig({ autoBlock: true })));
	const blocked = document.createElement("script");
	blocked.src = "https://www.youtube.com/iframe_api";
	expect(blocked.hasAttribute("src")).toBe(false);
	expect(blocked.dataset.cbService).toBe("youtube");
	releases.push(await initializeConsent(consentConfig({ autoBlock: false })));
	expect(Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src")).toEqual(originalSrc);
});

it("uses the current audit configuration and restores browser methods on final cleanup", async () => {
	const originalFetch = window.fetch;
	const originalAttribute = Element.prototype.setAttribute;
	const { initializeConsent } = await import("../../src/api/native");
	releases.push(await initializeConsent(consentConfig({ autoBlock: true, auditMode: true })));
	releases.push(await initializeConsent(consentConfig({ autoBlock: true, auditMode: false })));
	const { saveConsentState } = await import("../../src/core/consent-storage");
	saveConsentState({ essential: true, analytics: false, marketing: false, services: { youtube: true } });
	const allowed = document.createElement("iframe");
	allowed.src = "https://www.youtube.com/embed/test";
	expect(allowed.hasAttribute("src")).toBe(true);
	for (const release of releases) release();
	releases = [];
	expect(window.fetch).toBe(originalFetch);
	expect(Element.prototype.setAttribute).toBe(originalAttribute);
});
