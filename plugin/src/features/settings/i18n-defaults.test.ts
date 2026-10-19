import { describe, expect, it } from "vitest";
import { getLanguageDefaults, TEXT_SCHEMA } from "./i18n-defaults";

describe("WordPress admin Nordic translation defaults", () => {
	it.each(["nl", "da", "no", "sv"])(
		"provides every editable field for %s",
		(language) => {
			const defaults = getLanguageDefaults(language);

			expect(Object.keys(defaults)).toHaveLength(TEXT_SCHEMA.length);
			for (const entry of TEXT_SCHEMA) {
				expect(defaults[entry.key], entry.key).not.toBe("");
			}
			expect(defaults["overlay.title"]).not.toBe("We value your privacy");
		},
	);
});
