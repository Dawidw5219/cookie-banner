import { createContext } from "preact";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import type { BannerConfig, BannerView, ConsentState } from "../types";
import { applyConsent } from "../core/consent-actions";
import { getAcceptAllState, getRejectAllState } from "../core/consent-state";
import { getConsentState, hasConsented } from "../core/consent-storage";
import { isOnPolicyPage } from "../core/policy-page";

export const ConfigContext = createContext<BannerConfig | null>(null);

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
		dismiss: toIdle,
		preferencesInitialState,
	};
}
