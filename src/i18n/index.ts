import { normalizeLocale, mergeTexts } from "./locale";
import { da } from "./da";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { nl } from "./nl";
import { no } from "./no";
import { pl } from "./pl";
import { sv } from "./sv";

export type TranslationSchema = typeof en;

type StringPaths<T> = {
	[K in keyof T & string]: T[K] extends string ? K : `${K}.${StringPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = StringPaths<TranslationSchema>;

const translations: Record<string, TranslationSchema> = {
	en,
	pl,
	fr,
	de,
	es,
	it,
	nl,
	da,
	no,
	sv,
};

export const SUPPORTED_LANGUAGES = Object.keys(translations);

export let t: TranslationSchema = en;

export function resolveTranslation(lang: string, overrides?: Record<string, unknown>): TranslationSchema {
	const base = translations[normalizeLocale(lang).split("-")[0]] ?? en;
	return overrides ? mergeTexts(base, overrides) as TranslationSchema : base;
}

export function setLang(lang: string): void {
	t = translations[normalizeLocale(lang).split("-")[0]] ?? en;
}

export function applyCustomTexts(overrides: Record<string, unknown>): void {
	t = mergeTexts(t, overrides) as TranslationSchema;
}
