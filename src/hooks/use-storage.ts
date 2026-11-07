import { resolveTranslation } from "../i18n";
import { restrictOptionalRequestsUntilReload } from "../revocation-policy";
import { cleanupRevokedConsent, wasConsentRevoked } from "../consent-cleanup";
import { hasCompleteDisclosure, hasServiceDisclosure } from "../disclosure";
import { getService } from "../service-catalog";
import type { Service } from "../services";
import { CSP_COOKIE } from "../csp";
import { useState, useCallback } from "preact/hooks";
import type { ConsentCategory, ConsentState, ConsentReceipt } from "@/types";
import {
	CONSENT_CATEGORIES,
	DEFAULT_CONSENT_STATE,
	STORAGE_HAS_CONSENTED,
	STORAGE_COMMIT,
	STORAGE_PREFIX,
} from "@/types";

const volatileStorage = new Map<string, string>();

function getItem(key: string): string | null {
	if (volatileStorage.has(key)) return volatileStorage.get(key)!;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function isConsentStorageChange(event: StorageEvent): boolean {
	return event.key === null || event.key === STORAGE_COMMIT;
}

export function hasConsented(): boolean {
	if (typeof window !== "undefined" && window.__cookieConsent?.auditMode)
		return false;
	try {
		const record = JSON.parse(getItem(RECORD_KEY) || "null");
		const valid =
			record?.version === CONSENT_VERSION &&
			record.noticeKey === consentNoticeKey() &&
			typeof record.at === "number" &&
			record.at <= Date.now() &&
			Date.now() - record.at < MAX_AGE;
		if (!valid && record) {
			if (window.__cookieConsent)
				cleanupRevokedConsent(
					window.__cookieConsent,
					{
						...DEFAULT_CONSENT_STATE,
						...record.categories,
						services: record.services,
					},
					DEFAULT_CONSENT_STATE,
				);
			resetConsent();
		}
		return valid;
	} catch {
		return false;
	}
}

const RECORD_KEY = "cb_consent_record";
export const CONSENT_VERSION = 4;

export function consentNoticeKey(): string {
	const config =
		typeof window === "undefined" ? undefined : window.__cookieConsent;
	return JSON.stringify({
		version: config?.noticeVersion || "1",
		controller: config?.controller,
		purposes: config?.purposes,
		privacyPolicyUrl: config?.privacyPolicyUrl,
		cookiePolicyUrl: config?.cookiePolicyUrl,
		lang: config?.lang,
		customTexts: config?.customTexts,
		services: config?.services,
		serviceDisclosures: config?.serviceDisclosures,
	});
}

const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function getConsentReceipt(): ConsentReceipt | null {
	try {
		return JSON.parse(getItem(RECORD_KEY) || "null");
	} catch {
		return null;
	}
}

export function getConsentState(): ConsentState {
	if (!hasConsented()) return { ...DEFAULT_CONSENT_STATE };
	const record = getConsentReceipt();
	const disclosed = hasCompleteDisclosure(window.__cookieConsent);
	return {
		essential: true,
		analytics: disclosed && record?.categories?.analytics === true,
		marketing: disclosed && record?.categories?.marketing === true,
		services: Object.fromEntries(
			Object.entries(record?.services || {}).map(([id, granted]) => [
				id,
				disclosed && granted === true && hasServiceDisclosure(getService(id)),
			]),
		),
	};
}

function createReceiptId(): string {
	if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 15) | 64;
	bytes[8] = (bytes[8] & 63) | 128;
	const hex = [...bytes]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Store one current receipt. A host may retain evidence through cb:consent-receipt. */
export function saveConsentState(
	state: ConsentState,
	services: Service[] = [],
): void {
	const config = window.__cookieConsent;
	const previous = getConsentState();
	const optional =
		state.analytics ||
		state.marketing ||
		Object.values(state.services || {}).some(Boolean);
	if (optional && !hasCompleteDisclosure(config))
		throw new Error("Incomplete privacy disclosure");
	for (const [id, granted] of Object.entries(state.services || {})) {
		if (granted && !hasServiceDisclosure(getService(id)))
			throw new Error(`Incomplete service disclosure: ${id}`);
	}
	let endpoint: URL | undefined;
	if (config?.receiptEndpoint && !config.preview) {
		try {
			const target = new URL(config.receiptEndpoint, location.href);
			if (target.origin === location.origin) endpoint = target;
		} catch {
			/* Refusal must still work with an invalid endpoint. */
		}
		if (optional && !endpoint)
			throw new Error("Consent receipt endpoint must be same-origin");
	}
	const ids = Object.keys(state.services || {})
		.filter((id) => state.services![id])
		.sort();
	const at = Date.now();
	const csp = encodeURIComponent(
		JSON.stringify({
			version: config?.noticeVersion || "1",
   lang: config?.lang || "en",
			services: ids,
			expires: at + MAX_AGE,
		}),
	);
	if (csp.length > 3000 || ids.length > 100)
		throw new Error("Too many CSP consent services");
	const texts = resolveTranslation(config?.lang || "en", config?.customTexts);
	const receipt: ConsentReceipt = {
		id: createReceiptId(),
		version: CONSENT_VERSION,
		at,
		services: { ...state.services },
		categories: {
			essential: true,
			analytics: state.analytics,
			marketing: state.marketing,
		},
		noticeKey: consentNoticeKey(),
		notice: {
   lang: config?.lang || "en",
   content: texts.content,
			overlay: texts.overlay,
			preferences: texts.preferences,
			services,
		},
	};
	const serializedReceipt = JSON.stringify(receipt);
	// Revoke the server grant before storage events can make another tab reload.
	if (config?.strictCsp && !config.preview)
		document.cookie = `${CSP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	// Never issue a network grant if persistence failed (quota, privacy mode).
	try {
		if (config?.preview) throw new Error("Isolated preview storage");
		localStorage.setItem(RECORD_KEY, serializedReceipt);
		for (const cat of CONSENT_CATEGORIES) {
			localStorage.setItem(
				`${STORAGE_PREFIX}${cat}`,
				state[cat] ? "granted" : "denied",
			);
		}
		localStorage.setItem(STORAGE_HAS_CONSENTED, "1");
	} catch (error) {
		resetConsent();
		if (optional && !config?.preview) throw error;
		volatileStorage.set(RECORD_KEY, serializedReceipt);
		volatileStorage.set(STORAGE_HAS_CONSENTED, "1");
	}
	if (
		!config?.preview &&
		(config?.strictCsp || wasConsentRevoked(previous, state))
	)
		restrictOptionalRequestsUntilReload();
	if (config?.strictCsp && !config.preview)
		document.cookie = `${CSP_COOKIE}=${csp}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
	try {
		localStorage.setItem(STORAGE_COMMIT, receipt.id);
	} catch {
		/* Existing storage events still revoke other tabs. */
	}
	window.dispatchEvent(
		new CustomEvent("cb:consent-receipt", {
			detail: JSON.parse(serializedReceipt),
		}),
	);
	if (endpoint && config) {
		void fetch(endpoint, {
			method: "POST",
			credentials: "same-origin",
			keepalive: true,
			headers: {
				"Content-Type": "application/json",
				"X-WP-Nonce": config.receiptNonce || "",
			},
			body: JSON.stringify({
				id: receipt.id,
				at,
				version: config.noticeVersion,
				categories: receipt.categories,
				services: receipt.services,
			}),
		})
			.then((response) => {
				if (!response.ok) throw new Error("Receipt not retained");
			})
			.catch(() => window.dispatchEvent(new Event("cb:receipt-error")));
	}
}

export function buildAcceptAllState(): ConsentState {
	return { essential: true, analytics: true, marketing: true };
}

export function buildRejectState(): ConsentState {
	return { essential: true, analytics: false, marketing: false };
}

export function resetConsent(): void {
	if (
		typeof window !== "undefined" &&
		!window.__cookieConsent?.preview &&
		getItem(RECORD_KEY)
	)
		restrictOptionalRequestsUntilReload();
	volatileStorage.clear();
	try {
		if (typeof document !== "undefined")
			document.cookie = `${CSP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	} catch {
		/* Opaque previews and blocked cookie storage cannot access cookies. */
	}
	try {
		for (const cat of CONSENT_CATEGORIES) {
			localStorage.removeItem(`${STORAGE_PREFIX}${cat}`);
		}
		localStorage.removeItem(STORAGE_HAS_CONSENTED);
		localStorage.removeItem(RECORD_KEY);
		localStorage.removeItem(STORAGE_COMMIT);
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
