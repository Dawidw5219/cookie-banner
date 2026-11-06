export { buildConsentCsp, consentCspHeaders, readCspConsent } from "./csp";
export type { ConsentCspOptions, CspSources } from "./csp";
import type { BannerConfig } from "./types";
export {
	hasServiceConsent,
	setServiceConsent,
	onServiceConsent,
} from "./service-consent";

export type { BannerConfig, ConsentState, ServiceDefinition } from "./types";

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
	window.__cookieConsent = config;
	activeClients += 1;
	try {
		const banner = await import("./app");
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
