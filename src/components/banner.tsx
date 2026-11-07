import { useEffect } from "preact/hooks";
import type { BannerConfig } from "../types";
import { t } from "../i18n";
import { ConfigContext, useConsent } from "../hooks/use-consent";
import { releaseBannerScrollLock, setBannerHostBlocking, syncBannerScrollLock } from "../core/scroll-lock";
import { FloatingIcon } from "../ui/floating-icon";
import { ConsentPanel } from "./consent-panel";
import { ConsentBar } from "./consent-bar";
import { ConsentOverlay } from "./consent-overlay";
import { PreferencesModal } from "./preferences-modal";

export function App({ config }: { config: BannerConfig }) {
	return (
		<ConfigContext.Provider value={config}>
			<AppContent />
		</ConfigContext.Provider>
	);
}

function AppContent() {
	const {
		view,
		error,
		suppressed,
		hasConsented,
		config,
		acceptAll,
		rejectAll,
		savePreferences,
		openPreferences,
		preferencesInitialState,
		dismiss,
	} = useConsent();

	const isBar = config.variant === "bar";
	const isVisible = !suppressed || hasConsented;
	const blocksPage =
		isVisible &&
		(view === "overlay" || view === "preferences") &&
		(view === "preferences" || !isBar);

	useEffect(() => {
		const host = document.getElementById("cookie-consent-host");
		if (!host) return;
		syncBannerScrollLock(host, blocksPage);
		return () => {
			setBannerHostBlocking(host, false);
			releaseBannerScrollLock();
		};
	}, [blocksPage]);

	if (!isVisible) return null;

	return (
		<>
			{error && (
				<p
					role="alert"
					class="fixed top-4 left-4 right-4 z-2147483647 rounded-md border bg-cb-bg p-4 text-cb-text"
				>
					{t.disclosure.saveError}
				</p>
			)}
			{view === "overlay" && !isBar && (
				<ConsentPanel
					label={t.overlay.title}
                    showClose={config.buttonStyle === "equal"}
					onDismiss={dismiss}
					class="p-6 sm:p-8"
				>
					<ConsentOverlay
						privacyPolicyUrl={config.privacyPolicyUrl}
						cookiePolicyUrl={config.cookiePolicyUrl}
						onAcceptAll={acceptAll}
						onRejectAll={rejectAll}
						onOpenPreferences={openPreferences}
					/>
				</ConsentPanel>
			)}
			{view === "overlay" && isBar && (
				<ConsentBar
					privacyPolicyUrl={config.privacyPolicyUrl}
					cookiePolicyUrl={config.cookiePolicyUrl}
					onAcceptAll={acceptAll}
					onRejectAll={rejectAll}
					onOpenPreferences={openPreferences}
				/>
			)}
			{view === "preferences" && (
				<ConsentPanel
					label={t.preferences.title}
					showClose={config.buttonStyle === "equal"}
					onDismiss={dismiss}
					class="flex max-h-[90vh] flex-col"
				>
					<PreferencesModal
						privacyPolicyUrl={config.privacyPolicyUrl}
						cookiePolicyUrl={config.cookiePolicyUrl}
						initialState={preferencesInitialState}
						onSave={savePreferences}
						onAcceptAll={acceptAll}
						onRejectAll={rejectAll}
					/>
				</ConsentPanel>
			)}
			{view === "idle" && (
				<FloatingIcon label={t.floatingIcon.label} onClick={openPreferences} />
			)}
		</>
	);
}
