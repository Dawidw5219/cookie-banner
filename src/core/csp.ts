import { normalizeLocale } from "../i18n/locale";
/** Server-safe policy builder. Supply the result as an HTTP response header. */
export const CSP_COOKIE = "cb_csp_consent";
export type CspSources = Partial<
	Record<
		| "script-src"
		| "style-src"
		| "img-src"
		| "font-src"
		| "connect-src"
		| "frame-src"
		| "media-src"
		| "worker-src",
		string[]
	>
>;
export interface ConsentCspOptions {
	services: Record<string, CspSources>;
 /** Required for multilingual SSR: current route locale, matching BannerConfig.lang. */
 lang?: string;
	/** Match BannerConfig.noticeVersion; stale grants must not unlock destinations. */
	noticeVersion?: string;
	/** Only for applications/optimizers that require string evaluation. Network rules are unchanged. */
	allowEval?: boolean;
	/** Required by blob-based delayed-script loaders such as LiteSpeed. */
	allowBlobScripts?: boolean;
	/** Explicit essential destinations, independent of optional consent. */
	essential?: CspSources;
}

function source(value: string): string {
	if (!/^https:\/\/(?:\*\.)?[a-z0-9.-]+(?::[0-9]+)?$/i.test(value))
		throw new Error(`CSP requires an HTTPS origin, received: ${value}`);
	return value;
}

export function readCspConsent(
	cookieHeader = "",
	noticeVersion = "1",
 lang?: string,
): string[] {
	try {
		const value = cookieHeader
			.split(";")
			.map((v) => v.trim())
			.find((v) => v.startsWith(`${CSP_COOKIE}=`));
		if (value && value.length > 4096) return [];
		const saved: unknown = JSON.parse(
			decodeURIComponent(value?.slice(CSP_COOKIE.length + 1) || "[]"),
		);
		const receipt = saved as {
			version?: string;
   lang?: string;
			services?: unknown;
			expires?: number;
		};
		const ids =
			receipt?.version === noticeVersion &&
   (!lang || (typeof receipt.lang === "string" && normalizeLocale(receipt.lang) === normalizeLocale(lang))) &&
			typeof receipt.expires === "number" &&
			receipt.expires > Date.now()
				? receipt.services
				: [];
		return Array.isArray(ids) &&
			ids.length <= 100 &&
			ids.every(
				(id) => typeof id === "string" && /^[a-z0-9_.-]{1,100}$/i.test(id),
			)
			? [...new Set(ids)]
			: [];
	} catch {
		return [];
	}
}

export function buildConsentCsp(
	options: ConsentCspOptions,
	granted: readonly string[] = [],
): string {
	const directives: Record<string, Set<string>> = {
		"default-src": new Set(["'none'"]),
		"base-uri": new Set(["'self'"]),
		"object-src": new Set(["'none'"]),
		"form-action": new Set(["'self'"]),
		"frame-ancestors": new Set(["'self'"]),
	};
	for (const key of [
		"script-src",
		"style-src",
		"img-src",
		"font-src",
		"connect-src",
		"frame-src",
		"media-src",
		"worker-src",
	])
		directives[key] = new Set(
			key === "worker-src" || key === "frame-src" ? [] : ["'self'"],
		);
	// WordPress/Elementor and existing inline app bootstraps remain functional.
	// This policy restricts network destinations; it is not an XSS nonce policy.
	directives["script-src"].add("'unsafe-inline'");
	if (options.allowEval) directives["script-src"].add("'unsafe-eval'");
	if (options.allowBlobScripts) directives["script-src"].add("blob:");
	directives["style-src"].add("'unsafe-inline'");
	directives["img-src"].add("data:");
	directives["font-src"].add("data:");
	for (const sources of [
		options.essential,
		...granted.map((id) =>
			Object.prototype.hasOwnProperty.call(options.services, id)
				? options.services[id]
				: undefined,
		),
	]) {
		for (const [key, values] of Object.entries(sources || {})) {
			if (
				!Object.prototype.hasOwnProperty.call(directives, key) ||
				!key.endsWith("-src") ||
				key === "default-src"
			)
				throw new Error(`Unsupported CSP directive: ${key}`);
			for (const value of values || []) directives[key].add(source(value));
		}
	}
	return Object.entries(directives)
		.map(
			([key, values]) =>
				`${key} ${values.size ? [...values].join(" ") : "'none'"}`,
		)
		.join("; ");
}

/** Consent-dependent HTML must never be reused for another visitor. */
export function consentCspHeaders(
	options: ConsentCspOptions,
	cookieHeader = "",
) {
	return {
		"Content-Security-Policy": buildConsentCsp(
			options,
			options.noticeVersion
				? readCspConsent(cookieHeader, options.noticeVersion, options.lang)
				: [],
		),
		"Cache-Control": "private, no-store, max-age=0",
		Vary: "Cookie",
		"X-DNS-Prefetch-Control": "off",
	};
}
