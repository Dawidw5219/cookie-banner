import type { GTMConsentPayload } from "@/types";
import { GTM_CONSENT_KEYS } from "@/types";

function ensureDataLayer(): void {
	window.dataLayer = window.dataLayer || [];
}

function ensureGtag(): void {
	ensureDataLayer();
	if (typeof window.gtag !== "function") {
		// Must push `arguments` object (not array) for GTM to recognize consent commands
		(window as Window & { gtag: (...a: unknown[]) => void }).gtag =
			function () {
				window.dataLayer = window.dataLayer || [];
				// eslint-disable-next-line prefer-rest-params
				(window.dataLayer as IArguments[]).push(arguments);
			};
	}
}

function pushConsent(
	command: "default" | "update",
	payload: GTMConsentPayload,
): void {
	ensureGtag();
	const g = window.gtag;
	if (g) g("consent", command, payload);
}

function syncMetaConsent(adStorageGranted: boolean): void {
	const fbq = window.fbq;
	if (typeof fbq !== "function") return;
	fbq("consent", adStorageGranted ? "grant" : "revoke");
}

function logConsentChange(
	label: "default" | "update",
	payload: GTMConsentPayload,
): void {
	const out: Record<string, boolean> = {};
	for (const key of GTM_CONSENT_KEYS) {
		out[key] = payload[key] === "granted";
	}
	console.log("[Cookie consent]", label, out);
}

let defaultConsentSent = false;

export function consentDefaultAlreadySent(): boolean {
	ensureDataLayer();
	return (window.dataLayer as unknown[]).some(
		(entry) =>
			entry != null &&
			typeof entry === "object" &&
			(entry as { 0?: unknown; 1?: unknown })[0] === "consent" &&
			(entry as { 0?: unknown; 1?: unknown })[1] === "default",
	);
}

export function pushConsentDefault(payload: GTMConsentPayload): void {
	if (defaultConsentSent) return;
	if (consentDefaultAlreadySent()) {
		defaultConsentSent = true;
		return;
	}
	defaultConsentSent = true;
	pushConsent("default", payload);
	logConsentChange("default", payload);
	syncMetaConsent(payload.ad_storage === "granted");
}

export function pushConsentToDataLayer(payload: GTMConsentPayload): void {
	pushConsent("update", payload);
	logConsentChange("update", payload);
	syncMetaConsent(payload.ad_storage === "granted");
	pushConsentEvent(payload);
}

export function pushConsentEvent(payload: GTMConsentPayload): void {
	ensureDataLayer();
	window.dataLayer!.push({ event: "cookie_consent_update", ...payload });
}

export function loadGtm(gtmId: string): void {
	if (
		document.querySelector(
			`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`,
		)
	)
		return;
	ensureDataLayer();
	const dl = window.dataLayer;
	if (dl) dl.push({ "gtm.start": Date.now(), event: "gtm.js" });
	const script = document.createElement("script");
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
	document.head.appendChild(script);
}

export function consentUpdateAlreadySent(): boolean {
	ensureDataLayer();
	return (window.dataLayer as unknown[]).some(
		(entry) =>
			entry != null &&
			typeof entry === "object" &&
			(entry as Record<string, unknown>).event === "cookie_consent_update",
	);
}

export function useGtm() {
	return {
		pushConsentDefault,
		pushConsentToDataLayer,
		loadGtm,
	};
}
