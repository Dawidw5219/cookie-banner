import { hasRevocationPolicy } from "./revocation-policy";
import type { BannerConfig, ConsentState, GTMConsentPayload } from "./types";
import {
	CONSENT_CATEGORIES,
	DEFAULT_GTM_CONSENT_DENIED,
	GTM_CONSENT_MAP,
} from "./types";
import { getConsentState, saveConsentState } from "./hooks/use-storage";
import { getServices } from "./services";
import { injectGrantedScripts } from "./utils";
import { loadGtm, pushConsentToDataLayer } from "./hooks/use-gtm";
import { cleanupRevokedConsent, wasConsentRevoked } from "./consent-cleanup";

export function consentStateToGtmPayload(
	state: ConsentState,
): GTMConsentPayload {
	const payload: GTMConsentPayload = { ...DEFAULT_GTM_CONSENT_DENIED };
	for (const cat of CONSENT_CATEGORIES) {
		const value = state[cat] ? "granted" : "denied";
		for (const param of GTM_CONSENT_MAP[cat]) {
			payload[param] = value;
		}
	}
	return payload;
}

export function applyConsent(config: BannerConfig, state: ConsentState): void {
	const previous = getConsentState();
	const revoked = wasConsentRevoked(previous, state);
	saveConsentState(state, getServices());
	if (config.preview) {
		window.dispatchEvent(
			new CustomEvent("cb:consent-update", { detail: state }),
		);
		return;
	}
	cleanupRevokedConsent(config, previous, state);
	// Subscribers tear down embeds before navigation, including strict-CSP changes.
	window.dispatchEvent(new CustomEvent("cb:consent-update", { detail: state }));
	if (revoked && config.mode === "gtm") {
		try {
			pushConsentToDataLayer(consentStateToGtmPayload(state));
		} catch {
			/* A failing provider cannot prevent withdrawal. */
		}
	}
	if (config.strictCsp || revoked || hasRevocationPolicy()) {
		window.location.reload();
		return;
	}
	if (config.mode === "gtm") {
		pushConsentToDataLayer(consentStateToGtmPayload(state));
		if (
			state.services?.gtm &&
			(state.analytics || state.marketing) &&
			config.loadGtm !== false &&
			config.gtmId
		)
			loadGtm(config.gtmId);
	} else injectGrantedScripts(state, config.scripts);
}
