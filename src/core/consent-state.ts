import type { BannerConfig, ConsentState, ConsentCategory } from "../types";
import { DEFAULT_CONSENT_STATE } from "../types";
import { consentStateToGtmPayload } from "./consent-actions";
import { allServiceGrants } from "./services";
import { injectGrantedScripts } from "./script-loader";
import { loadGtm, pushConsentDefault, pushConsentEvent } from "./gtm";
import { buildAcceptAllState, buildRejectState, getConsentState, hasConsented } from "./consent-storage";

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
