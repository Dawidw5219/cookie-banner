import { createContext } from "preact";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import type {
	BannerConfig,
	BannerView,
	ConsentCategory,
	ConsentState,
	GTMConsentPayload,
} from "@/types";
import {
	CONSENT_CATEGORIES,
	DEFAULT_CONSENT_STATE,
	DEFAULT_GTM_CONSENT_DENIED,
	GTM_CONSENT_MAP,
} from "@/types";
import { injectGrantedScripts, isOnPolicyPage } from "@/utils";
import { loadGtm, pushConsentDefault, pushConsentEvent, pushConsentToDataLayer } from "./use-gtm";
import {
	buildAcceptAllState,
	buildRejectState,
	getConsentState,
	hasConsented,
	saveConsentState,
} from "./use-storage";

export const ConfigContext = createContext<BannerConfig | null>(null);

function consentStateToGtmPayload(state: ConsentState): GTMConsentPayload {
	const payload: GTMConsentPayload = { ...DEFAULT_GTM_CONSENT_DENIED };
	for (const cat of CONSENT_CATEGORIES) {
		const value = state[cat] ? "granted" : "denied";
		for (const param of GTM_CONSENT_MAP[cat]) {
			payload[param] = value;
		}
	}
	return payload;
}

let consentInitSent = false;

export function runConsentInit(config: BannerConfig): void {
	if (config.mode !== "gtm") return;
	if (consentInitSent) return;
	consentInitSent = true;

	// GTM processes `default` at Consent Init but `update` only after Container Loaded.
	// So for returning visitors we push a `default` that already reflects their saved state —
	// no `update` is needed on normal page loads, and GA tags on "All Pages" aren't blocked.
	const hasSaved = hasConsented();
	const grantsWithoutPrompt =
		config.testMode === true || config.autoAcceptAll === true;
	const defaultState = grantsWithoutPrompt
		? buildAcceptAllState()
		: hasSaved
			? getConsentState()
			: { essential: true, analytics: false, marketing: false };
	const payload = consentStateToGtmPayload(defaultState);
	pushConsentDefault(payload);

	const shouldLoadGtm = config.loadGtm !== false && !!config.gtmId;
	if (hasSaved || grantsWithoutPrompt) {
		// Always fire cookie_consent_update when consent is known, so GTM tags
		// can use it as their trigger (more reliable than "All Pages" under Consent Mode).
		pushConsentEvent(payload);
		if (shouldLoadGtm && config.gtmId) loadGtm(config.gtmId);
	}
	// First-time visitor: GTM stays unloaded until applyConsent() runs on opt-in.
}

export function applyAutomaticConsent(config: BannerConfig): ConsentState {
	const state = buildAcceptAllState();
	saveConsentState(state);
	if (config.mode === "standalone") {
		injectGrantedScripts(state, config.scripts);
	}
	return state;
}

export function applyConsent(config: BannerConfig, state: ConsentState): void {
	saveConsentState(state);
	if (config.mode === "gtm") {
		pushConsentToDataLayer(consentStateToGtmPayload(state));
		if (config.loadGtm !== false && config.gtmId) loadGtm(config.gtmId);
	} else {
		injectGrantedScripts(state, config.scripts);
	}
}

export function getAcceptAllState(): ConsentState {
	return buildAcceptAllState();
}

export function getRejectAllState(): ConsentState {
	return buildRejectState();
}

export function setCategory(
	state: ConsentState,
	category: ConsentCategory,
	value: boolean,
): ConsentState {
	const next = { ...state };
	if (category === "essential") return next;
	next[category] = value;
	return next;
}

export function useConsent() {
	const config = useContext(ConfigContext);
	if (!config)
		throw new Error("useConsent must be used within ConfigContext.Provider");

	const suppressed = isOnPolicyPage(config.privacyPolicyUrl, config.cookiePolicyUrl);
	const [view, setView] = useState<BannerView>(() =>
		suppressed ? "idle" : hasConsented() ? "idle" : "overlay",
	);
	const [consentState, setConsentState] =
		useState<ConsentState>(getConsentState);

	const persistConsent = useCallback(
		(state: ConsentState) => {
			setConsentState(state);
			applyConsent(config, state);
		},
		[config],
	);

	const toIdle = useCallback(() => setView("idle"), []);
	const openPreferences = useCallback(() => setView("preferences"), []);

	const acceptAll = useCallback(() => {
		toIdle();
		try {
			persistConsent(getAcceptAllState());
		} catch (_) {}
	}, [persistConsent, toIdle]);

	const rejectAll = useCallback(() => {
		toIdle();
		try {
			persistConsent(getRejectAllState());
		} catch (_) {}
	}, [persistConsent, toIdle]);

	const savePreferences = useCallback(
		(state: ConsentState) => {
			toIdle();
			try {
				persistConsent(state);
			} catch (_) {}
		},
		[persistConsent, toIdle],
	);

	const preferencesInitialState =
		view === "overlay" ? { ...DEFAULT_CONSENT_STATE } : consentState;

	useEffect(() => {
		window.dispatchEvent(
			new CustomEvent("cb:consent-update", { detail: consentState }),
		);
	}, [consentState]);

	// Always delegate clicks on `.open-consent-settings` links (privacy-policy
	// pages embed them in CMS content, often rendered AFTER this hook mounts —
	// delegation on document catches those too). `useCustomSettingsLink` only
	// controls whether the floating reopen icon is hidden, not this handler.
	useEffect(() => {
		const handler = (e: Event) => {
			const target = (e.target as Element).closest(".open-consent-settings");
			if (!target) return;
			e.preventDefault();
			openPreferences();
		};
		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, [openPreferences]);

	return {
		config,
		view,
		consentState,
		suppressed,
		hasConsented: hasConsented(),
		acceptAll,
		rejectAll,
		savePreferences,
		openPreferences,
		preferencesInitialState,
	};
}
