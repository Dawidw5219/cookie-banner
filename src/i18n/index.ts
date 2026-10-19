import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { pl } from "./pl";

export type TranslationSchema = typeof en;

const translations: Record<string, TranslationSchema> = {
	en,
	pl,
	fr,
	de,
	es,
	it,
};

export let t: TranslationSchema = en;

export function setLang(lang: string): void {
	t = translations[lang] ?? en;
}

function deepMerge<T extends Record<string, unknown>>(base: T, overrides: Record<string, unknown>): T {
	const result = { ...base } as Record<string, unknown>;
	for (const key of Object.keys(overrides)) {
		const val = overrides[key];
		if (val && typeof val === "object" && !Array.isArray(val) && typeof result[key] === "object") {
			result[key] = deepMerge(result[key] as Record<string, unknown>, val as Record<string, unknown>);
		} else if (typeof val === "string" && val !== "") {
			result[key] = val;
		}
	}
	return result as T;
}

export function applyCustomTexts(overrides: Record<string, unknown>): void {
	t = deepMerge(t, overrides);
}
