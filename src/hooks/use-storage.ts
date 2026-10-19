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
	return getItem(STORAGE_HAS_CONSENTED) === "1";
}

export function getConsentState(): ConsentState {
	if (!hasConsented()) return { ...DEFAULT_CONSENT_STATE };
	const state = { ...DEFAULT_CONSENT_STATE };
	for (const cat of CONSENT_CATEGORIES) {
		const value = getItem(`${STORAGE_PREFIX}${cat}`);
		state[cat] = cat === "essential" ? true : value === "granted";
	}
	return state;
}

export function saveConsentState(state: ConsentState): void {
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
	try {
		for (const cat of CONSENT_CATEGORIES) {
			localStorage.removeItem(`${STORAGE_PREFIX}${cat}`);
		}
		localStorage.removeItem(STORAGE_HAS_CONSENTED);
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
