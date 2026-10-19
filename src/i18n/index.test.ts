import { afterEach, describe, expect, it } from "vitest";
import { setLang, t } from "./index";

describe("Nordic cookie banner translations", () => {
	afterEach(() => setLang("en"));

	it.each([
		["nl", "Wij respecteren uw privacy", "Alles accepteren"],
		["da", "Vi respekterer dit privatliv", "Accepter alle"],
		["no", "Vi respekterer personvernet ditt", "Godta alle"],
		["sv", "Vi respekterar din integritet", "Godkänn alla"],
	])("selects the %s translation", (lang, title, acceptAll) => {
		setLang(lang);

		expect(t.overlay.title).toBe(title);
		expect(t.overlay.acceptAll).toBe(acceptAll);
		expect(t.preferences.categories.essential.description).not.toBe("");
		expect(t.floatingIcon.label).not.toBe("Cookie preferences");
	});
});
