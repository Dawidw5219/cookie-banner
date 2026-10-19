import type { ComponentChildren } from "preact";
import { render } from "preact";
import { useEffect } from "preact/hooks";
import { ConsentOverlay } from "@/components/consent-overlay";
import { PolicyLinks } from "@/components/policy-links";
import { PreferencesModal } from "@/components/preferences-modal";
import {
	applyAutomaticConsent,
	ConfigContext,
	getAcceptAllState,
	runConsentInit,
	useConsent,
} from "@/hooks/use-consent";
import { applyCustomTexts, setLang, t } from "@/i18n";
import {
	observeBannerHostRemoval,
	releaseBannerScrollLock,
	setBannerHostBlocking,
	syncBannerScrollLock,
} from "@/scroll-lock";
import type { BannerConfig } from "@/types";
import { FloatingIcon } from "@/ui/floating-icon";
import { createBannerHost } from "@/utils";
import cssText from "./style.css?inline";

function ConsentPanel({
	children,
	class: extra = "",
}: {
	children: ComponentChildren;
	class?: string;
}) {
	return (
		<div class="fixed inset-0 z-2147483647 flex items-end sm:items-center justify-center bg-cb-overlay backdrop-blur-sm">
			<div
				class={`w-full sm:mx-4 sm:max-w-xl rounded-t-cb sm:rounded-cb bg-cb-bg shadow-2xl ${extra}`.trim()}
			>
				{children}
			</div>
		</div>
	);
}

function ConsentBar({
	privacyPolicyUrl,
	cookiePolicyUrl,
	onAcceptAll,
	onOpenPreferences,
}: {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	onAcceptAll: () => void;
	onOpenPreferences: () => void;
}) {
	return (
		<div class="fixed bottom-0 left-0 right-0 z-2147483647">
			<div class="w-full bg-cb-bg shadow-[0_-4px_24px_rgba(0,0,0,0.15)] border-t border-cb-text/10">
				<div class="mx-auto max-w-7xl px-3 sm:px-8 py-2.5 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
					<p class="flex-1 text-[11px] sm:text-sm leading-tight sm:leading-relaxed text-cb-text/70">
						{t.overlay.description}
						<PolicyLinks
							privacyPolicyUrl={privacyPolicyUrl}
							cookiePolicyUrl={cookiePolicyUrl}
						/>
					</p>
					<div class="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0 sm:w-auto sm:min-w-80">
						<button
							type="button"
							onClick={onOpenPreferences}
							style={{ border: "1px solid var(--cb-primary)" }}
							class="cursor-pointer rounded-md bg-cb-bg px-3 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-sm font-semibold text-cb-primary transition-colors hover:bg-cb-primary/5 focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none whitespace-nowrap"
						>
							{t.overlay.advancedSettings}
						</button>
						<button
							type="button"
							onClick={onAcceptAll}
							class="cursor-pointer rounded-md bg-cb-primary px-3 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-sm font-semibold text-white transition-colors hover:bg-cb-primary-hover focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none whitespace-nowrap"
						>
							{t.overlay.acceptAll}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function App({ config }: { config: BannerConfig }) {
	return (
		<ConfigContext.Provider value={config}>
			<AppContent />
		</ConfigContext.Provider>
	);
}

function AppContent() {
	const {
		view,
		suppressed,
		hasConsented,
		config,
		acceptAll,
		rejectAll,
		savePreferences,
		openPreferences,
		preferencesInitialState,
	} = useConsent();

	const isBar = config.variant === "bar";
	const isVisible = !suppressed || hasConsented;
	const blocksPage =
		isVisible && (view === "overlay" || view === "preferences") && !isBar;

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
			{view === "overlay" && !isBar && (
				<ConsentPanel class="p-6 sm:p-8">
					<ConsentOverlay
						privacyPolicyUrl={config.privacyPolicyUrl}
						cookiePolicyUrl={config.cookiePolicyUrl}
						onAcceptAll={acceptAll}
						onOpenPreferences={openPreferences}
					/>
				</ConsentPanel>
			)}
			{view === "overlay" && isBar && (
				<ConsentBar
					privacyPolicyUrl={config.privacyPolicyUrl}
					cookiePolicyUrl={config.cookiePolicyUrl}
					onAcceptAll={acceptAll}
					onOpenPreferences={openPreferences}
				/>
			)}
			{view === "preferences" && (
				<ConsentPanel class="flex max-h-[90vh] sm:max-h-none flex-col">
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
			{view === "idle" && !config.useCustomSettingsLink && (
				<FloatingIcon label={t.floatingIcon.label} onClick={openPreferences} />
			)}
		</>
	);
}

// Set consent default IMMEDIATELY (before GTM or any other script runs)
if (window.__cookieConsent) {
	if (window.__cookieConsent.autoAcceptAll) {
		applyAutomaticConsent(window.__cookieConsent);
	}
	runConsentInit(window.__cookieConsent);
}

let mountedBanner:
	| {
			host: HTMLElement;
			root: HTMLElement;
			stopObserving: () => void;
	  }
	| undefined;

export function teardown(): void {
	if (!mountedBanner) {
		releaseBannerScrollLock();
		return;
	}

	const { host, root, stopObserving } = mountedBanner;
	mountedBanner = undefined;
	stopObserving();
	render(null, root);
	setBannerHostBlocking(host, false);
	releaseBannerScrollLock();
	host.removeAttribute("style");
	host.remove();
}

function init(): void {
	if (document.getElementById("cookie-consent-host")) return;
	if (!window.__cookieConsent) return;
	const config: BannerConfig = window.__cookieConsent;
	if (config.autoAcceptAll) {
		window.dispatchEvent(
			new CustomEvent("cb:consent-update", {
				detail: getAcceptAllState(),
			}),
		);
		return;
	}
	setLang(config.lang ?? "en");
	if (config.customTexts) {
		applyCustomTexts(config.customTexts);
	}
	const { host, root } = createBannerHost(cssText, config.theme);
	const stopObserving = observeBannerHostRemoval(host, teardown);
	mountedBanner = { host, root, stopObserving };
	render(<App config={config} />, root);
}
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}

function handlePageShow(event: PageTransitionEvent): void {
	if (event.persisted) init();
}

window.addEventListener("pagehide", teardown);
window.addEventListener("pageshow", handlePageShow);
