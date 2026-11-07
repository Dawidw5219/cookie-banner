import { resolveTranslation } from "../../../../src/i18n";
/**
 * Default translation strings for each language.
 * Mirrors packages/cookie-banner/src/i18n/ files.
 * Used to pre-fill custom text fields in the admin UI.
 */

export interface TextEntry {
	key: string;
	label: string;
	group: string;
	multiline?: boolean;
}

export const TEXT_SCHEMA: TextEntry[] = [
	// Overlay
	{ key: "overlay.title", label: "Banner title", group: "Banner" },
	{ key: "overlay.description", label: "Banner description", group: "Banner", multiline: true },
	{ key: "overlay.acceptAll", label: "Accept All button", group: "Banner" },
	{ key: "overlay.advancedSettings", label: "Advanced Settings button", group: "Banner" },

	// Preferences
	{ key: "preferences.title", label: "Preferences title", group: "Preferences" },
	{
		key: "preferences.description",
		label: "Preferences description",
		group: "Preferences",
		multiline: true,
	},
	{ key: "preferences.rejectAll", label: "Reject All button", group: "Preferences" },
	{ key: "preferences.save", label: "Save button", group: "Preferences" },
	{
		key: "preferences.acceptAllAndContinue",
		label: "Accept All & Continue button",
		group: "Preferences",
	},

	// Category labels
	{ key: "preferences.categories.essential.label", label: "Essential label", group: "Categories" },
	{
		key: "preferences.categories.essential.description",
		label: "Essential description",
		group: "Categories",
		multiline: true,
	},
	{ key: "preferences.categories.analytics.label", label: "Analytics label", group: "Categories" },
	{
		key: "preferences.categories.analytics.description",
		label: "Analytics description",
		group: "Categories",
		multiline: true,
	},
	{ key: "preferences.categories.marketing.label", label: "Marketing label", group: "Categories" },
	{
		key: "preferences.categories.marketing.description",
		label: "Marketing description",
		group: "Categories",
		multiline: true,
	},

	// Floating icon
	{ key: "floatingIcon.label", label: "Floating icon tooltip", group: "Other" },
];

// Include every runtime string, so blocker/privacy controls cannot drift from the editor.
function addRuntimeFields(value: Record<string, unknown>, prefix = "") {
 for (const [key, item] of Object.entries(value)) {
  const path = prefix ? `${prefix}.${key}` : key;
  if (typeof item === "string" && !TEXT_SCHEMA.some(entry => entry.key === path)) {
   TEXT_SCHEMA.push({ key: path, label: path, group: path.split(".")[0], multiline: /description|unavailable/.test(path) });
  } else if (item && typeof item === "object") addRuntimeFields(item as Record<string, unknown>, path);
 }
}
addRuntimeFields(resolveTranslation("en"));

/** Get a nested value from an object by dot-notation key. */
function getByPath(obj: Record<string, unknown>, path: string): string {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (current == null || typeof current !== "object") return "";
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === "string" ? current : "";
}

/** Get default text for a given language and key path. */
export function getDefaultText(lang: string, key: string): string {
	const langData = resolveTranslation(lang);
	return getByPath(langData, key);
}

/** Get all defaults for a language as flat key-value pairs. */
export function getLanguageDefaults(lang: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const entry of TEXT_SCHEMA) {
		result[entry.key] = getDefaultText(lang, entry.key);
	}
	return result;
}
