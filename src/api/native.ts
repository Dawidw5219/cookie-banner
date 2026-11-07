import { getServices } from "../core/services";
import type { ServiceDefinition } from "../types";
import { resolveLocalizedConfig } from "../i18n/locale";
export { resolveLocalizedConfig } from "../i18n/locale";
export { buildConsentCsp, consentCspHeaders, readCspConsent } from "../core/csp";
export type { ConsentCspOptions, CspSources } from "../core/csp";
import {
	getConsentReceipt as readConsentReceipt,
	resetConsent,
} from "../core/consent-storage";
import type { BannerConfig, ConsentReceipt } from "../types";
export {
	hasServiceConsent,
	setServiceConsent,
	onServiceConsent,
} from "../core/service-consent";

export type {
	BannerConfig,
 LocalizedContent,
	ConsentState,
	ServiceDefinition,
	ConsentCleanup,
} from "../types";

/** Safe in server components/SSR: never supplies a live src. */
export function blockedContentProps(service: string, src?: string) {
	return { "data-cb-service": service, "data-cb-src": src, hidden: true };
}

/** Use a native <script>, not a framework's eager script loader. */
export function blockedScriptProps(service: string, src?: string) {
	return {
		...blockedContentProps(service, src),
		type: "text/plain",
		"data-cb-type": "text/javascript",
	};
}

let activeClients = 0;

/** Call in a client effect. Importing this entry on the server is safe. */
export async function initializeConsent(
	config: BannerConfig,
): Promise<() => void> {
	if (typeof window === "undefined")
		throw new Error("Initialize consent in the browser, after hydration.");
	config = resolveLocalizedConfig(config);
	const previous = window.__cookieConsent;
	const changed = !!previous && JSON.stringify(previous) !== JSON.stringify(config);
	if (
		previous?.strictCsp &&
		config.strictCsp &&
		(previous.noticeVersion !== config.noticeVersion || previous.lang !== config.lang)
	) {
		resetConsent();
		window.__cookieConsent = config;
		window.location.reload();
		return () => {};
	}
	window.__cookieConsent = config;
	activeClients += 1;
	try {
		const banner = await import("../app");
		if (changed) banner.teardown();
		banner.init();
		let released = false;
		return () => {
			if (released) return;
			released = true;
			if (--activeClients === 0) banner.teardown();
		};
	} catch (error) {
		activeClients -= 1;
		throw error;
	}
}

export const getConsentReceipt: () => ConsentReceipt | null =
	readConsentReceipt;
export type { ConsentReceipt } from "../types";

/** Current observed services, using the same registry as the consent UI and blocker. */
export function getDetectedServices(): ServiceDefinition[] {
 return typeof window === "undefined" ? [] : getServices();
}
