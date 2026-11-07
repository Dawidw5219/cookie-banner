import { applyConsent, consentStateToGtmPayload } from "../consent-actions";
export { applyConsent } from "../consent-actions";
import { allServiceGrants } from "@/services";
import { createContext } from "preact";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import type {
	BannerConfig,
	BannerView,
	ConsentCategory,
	ConsentState,
} from "@/types";
import { DEFAULT_CONSENT_STATE } from "@/types";
import { injectGrantedScripts, isOnPolicyPage } from "@/utils";
import { loadGtm, pushConsentDefault, pushConsentEvent } from "./use-gtm";
import {
	buildAcceptAllState,
	buildRejectState,
	getConsentState,
	hasConsented,
} from "./use-storage";

export const ConfigContext = createContext<BannerConfig | null>(null);

let consentInitSent = false;

export function runConsentInit(config: BannerConfig): void {
	if (config.preview) return;
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
	const [error, setError] = useState("");
	const [consentState, setConsentState] =
		useState<ConsentState>(getConsentState);

	const persistConsent = useCallback(
		(state: ConsentState) => {
			applyConsent(config, state);
			setConsentState(state);
			setError("");
		},
		[config],
	);

	const toIdle = useCallback(() => setView("idle"), []);
	const openPreferences = useCallback(() => setView("preferences"), []);
	useEffect(() => {
		window.addEventListener("cb:open-preferences", openPreferences);
		return () =>
			window.removeEventListener("cb:open-preferences", openPreferences);
	}, [openPreferences]);

	const acceptAll = useCallback(() => {
		try {
			persistConsent(getAcceptAllState());
			toIdle();
		} catch {
			setError("saveError");
		}
	}, [persistConsent, toIdle]);

	const rejectAll = useCallback(() => {
		try {
			persistConsent(getRejectAllState());
			toIdle();
		} catch {
			setError("saveError");
		}
	}, [persistConsent, toIdle]);

	const savePreferences = useCallback(
		(state: ConsentState) => {
			try {
				persistConsent(state);
				toIdle();
			} catch {
				setError("saveError");
			}
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
		error,
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
