// @vitest-environment jsdom
import { consentConfig } from "../fixtures/consent-config";
import { beforeEach, describe, expect, it } from "vitest";
import { getConsentState, hasConsented, saveConsentState } from "../../src/core/consent-storage";

describe("versioned consent receipts", () => {
	beforeEach(() => {
		localStorage.clear();
		document.head.replaceChildren();
		document.documentElement.removeAttribute("data-cb-revoked");
		window.__cookieConsent = consentConfig({
			controller: { name: "Example Sp. z o.o." },
		});
	});
	it("records the presented notice, scope and time without visitor fingerprinting", () => {
		const receipts: unknown[] = [];
		window.addEventListener(
			"cb:consent-receipt",
			(e) => receipts.push((e as CustomEvent).detail),
			{ once: true },
		);
		saveConsentState({
			essential: true,
			analytics: false,
			marketing: false,
			services: { youtube: true },
		});
		const receipt = JSON.parse(localStorage.getItem("cb_consent_record")!);
		expect(receipt.categories.analytics).toBe(false);
		expect(receipt.services.youtube).toBe(true);
		expect(receipt.notice.overlay.description).toBeTruthy();
		expect(JSON.parse(receipt.noticeKey).controller.name).toBe(
			"Example Sp. z o.o.",
		);
		expect(receipts).toHaveLength(1);
		expect(hasConsented()).toBe(true);
	});
	it("denies old grants after the notice or purpose changes", () => {
		saveConsentState({ essential: true, analytics: true, marketing: false });
		window.__cookieConsent!.purposes = "Now a different purpose";
		expect(hasConsented()).toBe(false);
		expect(getConsentState().analytics).toBe(false);
	});
	it("requires a fresh choice after old-format or expired records", () => {
		localStorage.setItem("cb_has_consented", "1");
		localStorage.setItem(
			"cb_consent_record",
			JSON.stringify({ version: 2, at: Date.now() }),
		);
		expect(hasConsented()).toBe(false);
	});
});
it("refuses optional grants with incomplete site or provider information", () => {
	window.__cookieConsent!.controller = undefined;
	expect(() =>
		saveConsentState({ essential: true, analytics: true, marketing: false }),
	).toThrow("Incomplete privacy");
	expect(hasConsented()).toBe(false);
	window.__cookieConsent = consentConfig();
	expect(() =>
		saveConsentState({
			essential: true,
			analytics: false,
			marketing: false,
			services: { "external-unknown.test": true },
		}),
	).toThrow("Incomplete service");
});

it("does not grant consent to a provider without a recipient name", () => {
	window.__cookieConsent = consentConfig({
		services: [
			{
				id: "unnamed",
				name: "",
				description: "Video playback",
				privacyUrl: "https://example.com/privacy",
				retention: "Session",
			},
		],
	});
	expect(() =>
		saveConsentState({
			essential: true,
			analytics: false,
			marketing: false,
			services: { unnamed: true },
		}),
	).toThrow("Incomplete service disclosure");
});

it("notifies service subscribers only after the complete cross-tab transaction", async () => {
	const { onServiceConsent } = await import("../../src/core/service-consent");
	localStorage.clear();
	document.head.replaceChildren();
	document.documentElement.removeAttribute("data-cb-revoked");
	window.__cookieConsent = consentConfig();
	saveConsentState({
		essential: true,
		analytics: false,
		marketing: false,
		services: { youtube: true },
	});
	const observed: boolean[] = [];
	const stop = onServiceConsent("youtube", (value) => observed.push(value));
	try {
		const record = JSON.parse(localStorage.getItem("cb_consent_record")!);
		record.services.youtube = false;
		localStorage.setItem("cb_consent_record", JSON.stringify(record));
		window.dispatchEvent(
			new StorageEvent("storage", { key: "cb_consent_record" }),
		);
		expect(observed).toEqual([true]);
		window.dispatchEvent(
			new StorageEvent("storage", { key: "cb_consent_commit" }),
		);
		expect(observed).toEqual([true, false]);
	} finally {
		stop();
	}
});
