// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function waitFor(check: () => boolean): Promise<void> {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		if (check()) return;
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	throw new Error("Timed out waiting for banner lifecycle update");
}

describe("cookie banner app teardown", () => {
	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
		history.replaceState(null, "", "/");
		document.body.replaceChildren();
		document.body.style.overflow = "auto";
		window.__cookieConsent = {
			mode: "standalone",
			variant: "modal",
			lang: "en",
			useCustomSettingsLink: true,
		};
	});

	afterEach(() => {
		delete window.__cookieConsent;
		document.body.replaceChildren();
		document.body.style.overflow = "";
	});

	it("unmounts the host and releases its lock through controlled teardown", async () => {
		const { teardown } = await import("./app");
		await waitFor(() => document.body.style.overflow === "hidden");

		teardown();
		teardown();

		expect(document.getElementById("cookie-consent-host")).toBeNull();
		expect(document.body.style.overflow).toBe("auto");
	});

	it("runs the same teardown when the mounted host is removed directly", async () => {
		await import("./app");
		await waitFor(() => document.body.style.overflow === "hidden");
		const host = document.getElementById("cookie-consent-host");

		host?.remove();
		await waitFor(() => document.body.style.overflow === "auto");

		expect(document.getElementById("cookie-consent-host")).toBeNull();
		expect(host?.style.position).toBe("");
		expect(host?.style.pointerEvents).toBe("");
	});

	it("remounts the overlay and reacquires its lock after a BFCache restore", async () => {
		await import("./app");
		await waitFor(() => document.body.style.overflow === "hidden");
		const initialHost = document.getElementById("cookie-consent-host");

		window.dispatchEvent(
			new PageTransitionEvent("pagehide", { persisted: true }),
		);

		expect(document.getElementById("cookie-consent-host")).toBeNull();
		expect(document.body.style.overflow).toBe("auto");

		window.dispatchEvent(
			new PageTransitionEvent("pageshow", { persisted: true }),
		);
		await waitFor(() => document.body.style.overflow === "hidden");

		const restoredHost = document.getElementById("cookie-consent-host");
		expect(restoredHost).not.toBeNull();
		expect(restoredHost).not.toBe(initialHost);
		expect(restoredHost?.style.position).toBe("fixed");
	});

	it("does not lock the page when preferences remain suppressed and invisible", async () => {
		history.replaceState(null, "", "/privacy-policy");
		window.__cookieConsent = {
			mode: "standalone",
			variant: "modal",
			lang: "en",
			useCustomSettingsLink: true,
			privacyPolicyUrl: "/privacy-policy",
		};
		const settingsLink = document.createElement("a");
		settingsLink.className = "open-consent-settings";
		document.body.appendChild(settingsLink);

		await import("./app");
		await waitFor(
			() => document.getElementById("cookie-consent-host") !== null,
		);
		settingsLink.click();
		await new Promise((resolve) => setTimeout(resolve, 0));

		const host = document.getElementById("cookie-consent-host");
		const root = host?.shadowRoot?.getElementById("cookie-consent-root");
		expect(root?.childElementCount).toBe(0);
		expect(host?.style.position).toBe("");
		expect(document.body.style.overflow).toBe("auto");
	});

	it("auto-accepts every category without mounting banner UI", async () => {
		window.__cookieConsent = {
			mode: "standalone",
			variant: "modal",
			lang: "en",
			autoAcceptAll: true,
		};

		await import("./app");

		expect(localStorage.getItem("cb_has_consented")).toBe("1");
		expect(localStorage.getItem("cb_consent_essential")).toBe("granted");
		expect(localStorage.getItem("cb_consent_analytics")).toBe("granted");
		expect(localStorage.getItem("cb_consent_marketing")).toBe("granted");
		expect(document.getElementById("cookie-consent-host")).toBeNull();
		expect(document.body.style.overflow).toBe("auto");
	});

	it("grants every Consent Mode signal in auto-accept mode", async () => {
		window.dataLayer = [];
		delete window.gtag;
		window.__cookieConsent = {
			mode: "gtm",
			lang: "en",
			autoAcceptAll: true,
		};

		await import("./app");

		const consentDefault = window.dataLayer?.find(
			(entry) =>
				entry != null &&
				typeof entry === "object" &&
				(entry as { 0?: unknown })[0] === "consent",
		) as { 1?: unknown; 2?: Record<string, string> } | undefined;

		expect(consentDefault?.[1]).toBe("default");
		expect(consentDefault?.[2]).toEqual({
			ad_storage: "granted",
			analytics_storage: "granted",
			ad_user_data: "granted",
			ad_personalization: "granted",
			functionality_storage: "granted",
			security_storage: "granted",
			personalization_storage: "granted",
		});
		expect(document.getElementById("cookie-consent-host")).toBeNull();
	});
});
