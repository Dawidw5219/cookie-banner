import { allServiceGrants } from "@/services";
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
import {
	loadGtm,
	pushConsentDefault,
	pushConsentEvent,
	pushConsentToDataLayer,
} from "./use-gtm";
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
	if (config.mode !== "gtm") {
		injectGrantedScripts(getConsentState(), config.scripts);
		return;
	}
	if (consentInitSent) return;
	consentInitSent = true;

	// GTM processes `default` at Consent Init but `update` only after Container Loaded.
	// So for returning visitors we push a `default` that already reflects their saved state —
	// no `update` is needed on normal page loads, and GA tags on "All Pages" aren't blocked.
	const hasSaved = hasConsented();
	const defaultState = hasSaved
		? getConsentState()
		: { ...DEFAULT_CONSENT_STATE };
	const payload = consentStateToGtmPayload(defaultState);
	pushConsentDefault(payload);

	const shouldLoadGtm = config.loadGtm !== false && !!config.gtmId;
	if (hasSaved) {
		// Always fire cookie_consent_update when consent is known, so GTM tags
		// can use it as their trigger (more reliable than "All Pages" under Consent Mode).
		pushConsentEvent(payload);
		if (
			defaultState.services?.gtm &&
			(defaultState.analytics || defaultState.marketing) &&
			shouldLoadGtm &&
			config.gtmId
		)
			loadGtm(config.gtmId);
	}
	// First-time visitor: GTM stays unloaded until applyConsent() runs on opt-in.
}

export function applyConsent(config: BannerConfig, state: ConsentState): void {
	const previous = getConsentState();
	saveConsentState(state);
	if (config.strictCsp) {
		window.location.reload();
		return;
	}
	const revoked =
		(previous.analytics && !state.analytics) ||
		(previous.marketing && !state.marketing) ||
		Object.entries(previous.services || {}).some(
			([id, granted]) => granted && !state.services?.[id],
		);
	if (revoked) {
		window.dispatchEvent(
			new CustomEvent("cb:consent-update", { detail: state }),
		);
		window.location.reload();
		return;
	}
	window.dispatchEvent(new CustomEvent("cb:consent-update", { detail: state }));
	if (config.mode === "gtm") {
		pushConsentToDataLayer(consentStateToGtmPayload(state));
		if (
			state.services?.gtm &&
			(state.analytics || state.marketing) &&
			config.loadGtm !== false &&
			config.gtmId
		)
			loadGtm(config.gtmId);
	} else {
		injectGrantedScripts(state, config.scripts);
	}
}

export function getAcceptAllState(): ConsentState {
	return { ...buildAcceptAllState(), services: allServiceGrants() };
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

	const suppressed = isOnPolicyPage(
		config.privacyPolicyUrl,
		config.cookiePolicyUrl,
	);
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

	useEffect(() => {
		const update = (event: Event) => {
			const state = (event as CustomEvent<ConsentState>).detail;
			setConsentState(state);
		};
		window.addEventListener("cb:consent-update", update);
		return () => window.removeEventListener("cb:consent-update", update);
	}, []);

	const preferencesInitialState = consentState;

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
		const options: AddEventListenerOptions & { isRocket: boolean } = {
			capture: true,
			isRocket: true,
		};
		document.addEventListener("click", handler, options);
		return () => document.removeEventListener("click", handler, options);
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
