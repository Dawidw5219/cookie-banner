import { render } from "preact";
import { resolveLocalizedConfig } from "./i18n/locale";
import { installAutoBlocker } from "./core/auto-blocker";
import { startContentBlocker } from "./core/content-blocker";
import { runConsentInit } from "./core/consent-state";
import { applyCustomTexts, setLang } from "./i18n";
import { observeBannerHostRemoval, releaseBannerScrollLock, setBannerHostBlocking } from "./core/scroll-lock";
import { App } from "./components/banner";
import { createBannerHost } from "./core/banner-host";
import cssText from "./style.css?inline";

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
