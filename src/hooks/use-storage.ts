import { CSP_COOKIE } from "../csp";
import { useState, useCallback } from "preact/hooks";
import type { ConsentCategory, ConsentState } from "@/types";
import {
	CONSENT_CATEGORIES,
	DEFAULT_CONSENT_STATE,
	STORAGE_HAS_CONSENTED,
	STORAGE_PREFIX,
} from "@/types";

function getItem(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function setItem(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		/* noop */
	}
}

export function hasConsented(): boolean {
	if (typeof window !== "undefined" && window.__cookieConsent?.auditMode)
		return false;
	try {
		const record = JSON.parse(getItem(RECORD_KEY) || "null");
		return (
			getItem(STORAGE_HAS_CONSENTED) === "1" &&
			record?.version === CONSENT_VERSION &&
			typeof record.at === "number" &&
			record.at <= Date.now() &&
			Date.now() - record.at < MAX_AGE
		);
	} catch {
		return false;
	}
}

const RECORD_KEY = "cb_consent_record";
export const CONSENT_VERSION = 2;
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function getConsentState(): ConsentState {
	if (!hasConsented()) return { ...DEFAULT_CONSENT_STATE };
	const state = { ...DEFAULT_CONSENT_STATE };
	for (const cat of CONSENT_CATEGORIES) {
		const value = getItem(`${STORAGE_PREFIX}${cat}`);
		state[cat] = cat === "essential" ? true : value === "granted";
	}
	try {
		const services = JSON.parse(getItem(RECORD_KEY) || "null")?.services;
		if (services && typeof services === "object" && !Array.isArray(services)) {
			state.services = Object.fromEntries(
				Object.entries(services).map(([id, value]) => [id, value === true]),
			);
		}
	} catch {
		/* Invalid records remain denied. */
	}
	return state;
}

export function saveConsentState(state: ConsentState): void {
	if (typeof window !== "undefined" && window.__cookieConsent?.strictCsp) {
		const ids = Object.entries(state.services || {})
			.filter(([, granted]) => granted)
			.map(([id]) => id)
			.sort();
		const value = encodeURIComponent(JSON.stringify(ids));
		if (value.length > 3000 || ids.length > 100)
			throw new Error("Too many CSP consent services");
		document.cookie = `${CSP_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
	}
	setItem(
		RECORD_KEY,
		JSON.stringify({
			version: CONSENT_VERSION,
			at: Date.now(),
			services: state.services || {},
		}),
	);
	setItem(STORAGE_HAS_CONSENTED, "1");
	for (const cat of CONSENT_CATEGORIES) {
		setItem(`${STORAGE_PREFIX}${cat}`, state[cat] ? "granted" : "denied");
	}
}

export function buildAcceptAllState(): ConsentState {
	return { essential: true, analytics: true, marketing: true };
}

export function buildRejectState(): ConsentState {
	return { essential: true, analytics: false, marketing: false };
}

export function resetConsent(): void {
	if (typeof document !== "undefined")
		document.cookie = `${CSP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	try {
		for (const cat of CONSENT_CATEGORIES) {
			localStorage.removeItem(`${STORAGE_PREFIX}${cat}`);
		}
		localStorage.removeItem(STORAGE_HAS_CONSENTED);
		localStorage.removeItem(RECORD_KEY);
	} catch {
		/* noop */
	}
}

export function getCategoryValue(
	state: ConsentState,
	category: ConsentCategory,
): boolean {
	return state[category];
}

export function useStorage() {
	const [consentState, setConsentStateInternal] =
		useState<ConsentState>(getConsentState);

	const setConsentState = useCallback((state: ConsentState) => {
		saveConsentState(state);
		setConsentStateInternal(state);
	}, []);

	return {
		consentState,
		setConsentState,
		hasConsented: hasConsented(),
		getConsentState,
	};
}
