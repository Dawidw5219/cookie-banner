import type { BannerConfig, LocalizedContent } from "./types";

/** Canonical lookup key; preserve regional overrides. */
export function normalizeLocale(locale: string): string {
	const parts = locale.trim().replace(/_/g, "-").toLowerCase().split("-");
	if (["nb", "nn"].includes(parts[0])) parts[0] = "no";
	return parts.join("-");
}

function localeContent(config: BannerConfig, locale: string): LocalizedContent {
	const localized = Object.fromEntries(
		Object.entries(config.localizations || {}).map(([key, value]) => [normalizeLocale(key), value]),
	);
	return mergeTexts(
		(localized[locale.split("-")[0]] || {}) as Record<string, unknown>,
		(localized[locale] || {}) as Record<string, unknown>,
	) as LocalizedContent;
}

/** Merge translated strings and accept either nested objects or dot paths. */
export function mergeTexts(
	base: Record<string, unknown>,
	override: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...base };
	for (const [key, value] of Object.entries(override)) {
		const parts = key.split(".");
		if (parts.some(part => ["__proto__", "constructor", "prototype"].includes(part))) continue;
		if (parts.length > 1) {
			const nested = parts.reverse().reduce<unknown>((child, part) => ({ [part]: child }), value);
			Object.assign(result, mergeTexts(result, nested as Record<string, unknown>));
			continue;
		}
		if (value && typeof value === "object" && !Array.isArray(value)) {
			const existing = result[key];
			const previous = existing && typeof existing === "object" && !Array.isArray(existing)
				? existing as Record<string, unknown> : {};
			result[key] = mergeTexts(previous, value as Record<string, unknown>);
		} else if (typeof value === "string" && value.trim()) result[key] = value;
	}
	return result;
}

/** SSR callers supply the route locale explicitly; clients may use <html lang>. */
export function resolveLocalizedConfig(config: BannerConfig): BannerConfig {
	const requested = config.lang && config.lang !== "auto" ? config.lang
		: (typeof document !== "undefined" && document.documentElement.lang) || "en";
	const lang = normalizeLocale(requested);
	const content = mergeTexts({}, localeContent(config, lang) as Record<string, unknown>) as LocalizedContent;
	const { customTexts, serviceDisclosures, ...fields } = content;
	return {
		...config, ...fields, lang,
  buttonStyle: config.buttonStyle || "standard",
		controller: fields.controller ? { ...config.controller, ...fields.controller } : config.controller,
		customTexts: mergeTexts(config.customTexts || {}, customTexts || {}),
		serviceDisclosures: mergeTexts(config.serviceDisclosures || {}, serviceDisclosures || {}) as BannerConfig["serviceDisclosures"],
	};
}
