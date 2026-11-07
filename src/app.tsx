import { resolveLocalizedConfig } from "./locale";
import { installAutoBlocker } from "./auto-blocker";
import { startContentBlocker } from "@/content-blocker";
import { ConsentDecisionButton, ConsentSettingsButton } from "@/ui/consent-button";
import type { ComponentChildren } from "preact";
import { render } from "preact";
import { hasCompleteDisclosure } from "./disclosure";
import { useEffect, useRef } from "preact/hooks";
import { ConsentOverlay } from "@/components/consent-overlay";
import { PolicyLinks, BannerDescription } from "@/components/policy-links";
import { PreferencesModal } from "@/components/preferences-modal";
import { ConfigContext, runConsentInit, useConsent } from "@/hooks/use-consent";
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
	const panel = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const previous = document.getElementById("cookie-consent-host")?.shadowRoot
			?.activeElement as HTMLElement | null;
		const element = panel.current;
		if (!element) return;
		element.focus();
		const trap = (event: KeyboardEvent) => {
			if (event.key !== "Tab") return;
			const focusable = [
				...element.querySelectorAll<HTMLElement>(
					'button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]',
				),
			];
			const active =
				element.getRootNode() instanceof ShadowRoot
					? (element.getRootNode() as ShadowRoot).activeElement
					: document.activeElement;
			const index = focusable.indexOf(active as HTMLElement);
			if (event.shiftKey && index <= 0) {
				event.preventDefault();
				focusable[focusable.length - 1]?.focus();
			} else if (
				!event.shiftKey &&
				(index === -1 || index === focusable.length - 1)
			) {
				event.preventDefault();
				focusable[0]?.focus();
			}
		};
		element.addEventListener("keydown", trap);
		return () => {
			element.removeEventListener("keydown", trap);
			previous?.focus();
		};
	}, []);
	return (
		<div class="fixed inset-0 z-2147483647 flex items-end sm:items-center justify-center bg-cb-overlay backdrop-blur-sm">
			<div
				ref={panel}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-label={t.overlay.title}
				class={`max-h-[90vh] overflow-y-auto outline-none w-full sm:mx-4 sm:max-w-xl rounded-t-cb sm:rounded-cb bg-cb-bg shadow-2xl ${extra}`.trim()}
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
	onRejectAll,
}: {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	onAcceptAll: () => void;
	onOpenPreferences: () => void;
	onRejectAll: () => void;
}) {
	return (
		<div class="fixed bottom-0 left-0 right-0 z-2147483647">
			<div class="w-full bg-cb-bg shadow-[0_-4px_24px_rgba(0,0,0,0.15)] border-t border-cb-text/10">
				<div class="mx-auto max-w-7xl px-4 sm:px-8 py-3 sm:py-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
					<p class="flex-1 text-xs sm:text-sm leading-relaxed text-cb-text">
						<BannerDescription />
						<PolicyLinks
							privacyPolicyUrl={privacyPolicyUrl}
							cookiePolicyUrl={cookiePolicyUrl}
						/>
					</p>
					<div class="cb-bar-actions shrink-0 w-full lg:w-auto lg:min-w-max">
						<ConsentSettingsButton type="button" onClick={onOpenPreferences}>
							{t.overlay.advancedSettings}
						</ConsentSettingsButton>
							<div class="cb-decisions">
							<ConsentDecisionButton variant="outline" type="button" onClick={onRejectAll}>
								{t.preferences.rejectAll}
							</ConsentDecisionButton>
							<ConsentDecisionButton
								type="button"
								onClick={onAcceptAll}
								disabled={!hasCompleteDisclosure(window.__cookieConsent)}
							>
								{t.overlay.acceptAll}
							</ConsentDecisionButton>
						</div>
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
		consentState,
		error,
		suppressed,
		hasConsented,
		config,
		acceptAll,
		rejectAll,
		savePreferences,
		openPreferences,
		preferencesInitialState,
	} = useConsent();

	const hasOptionalConsent =
		consentState.analytics ||
		consentState.marketing ||
		Object.values(consentState.services || {}).some(Boolean);
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
				<ConsentPanel class="p-6 sm:p-8">
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
				<ConsentPanel class="flex max-h-[90vh] flex-col">
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
			{view === "idle" && hasOptionalConsent && (
				<div class="fixed bottom-4 left-20 right-4 sm:right-auto z-2147483646 max-w-xs">
					<ConsentDecisionButton variant="outline" type="button" onClick={rejectAll}>
						{t.disclosure.withdraw}
					</ConsentDecisionButton>
				</div>
			)}
			{view === "idle" && (
				<FloatingIcon label={t.floatingIcon.label} onClick={openPreferences} />
			)}
		</>
	);
}

if (window.__cookieConsent?.autoBlock)
	installAutoBlocker(window.__cookieConsent);

// Set consent default IMMEDIATELY (before GTM or any other script runs)
if (window.__cookieConsent) {
	runConsentInit(window.__cookieConsent);
}

let stopContentBlocker: (() => void) | undefined;

let mountedBanner:
	| {
			host: HTMLElement;
			root: HTMLElement;
			stopObserving: () => void;
	  }
	| undefined;

export function teardown(): void {
	stopContentBlocker?.();
	stopContentBlocker = undefined;
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

export function init(): void {
	if (document.getElementById("cookie-consent-host")) return;
	if (!window.__cookieConsent) return;
	const config = resolveLocalizedConfig(window.__cookieConsent);
 window.__cookieConsent = config;
	if (!config.preview) stopContentBlocker ||= startContentBlocker(config);
	if (config.auditMode) return;
	setLang(config.lang ?? "en");
	if (config.customTexts) {
		applyCustomTexts(config.customTexts);
	}
	const { host, root } = createBannerHost(cssText, config.theme);
 host.lang = config.lang;
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
	if (event.persisted && window.__cookieConsent?.strictCsp)
		window.location.reload();
	else if (event.persisted) init();
}

window.addEventListener("pagehide", teardown);
window.addEventListener("pageshow", handlePageShow);
