// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { render } from "preact";
import { setLang, t } from "../i18n";
import { ConsentOverlay } from "./consent-overlay";

const container = document.createElement("div");
document.body.append(container);
const handlers = { onAcceptAll() {}, onRejectAll() {}, onOpenPreferences() {} };
afterEach(() => { render(null, container); setLang("en"); });

describe("policy links in the banner description", () => {
	it.each(["en", "pl", "de", "fr", "es", "it", "nl", "da", "no", "sv"])("keeps %s complete without links and introduces configured policies once", (lang) => {
		setLang(lang);
		render(<ConsentOverlay {...handlers} />, container);
		expect(container.querySelector("p")?.textContent).toBe(t.overlay.description);
		expect(t.overlay.description.endsWith(".")).toBe(true);
		expect(container.querySelectorAll("a")).toHaveLength(0);
		expect(t.overlay.descriptionPolicyLink).not.toBe("");
		render(<ConsentOverlay {...handlers} privacyPolicyUrl="/privacy" cookiePolicyUrl="/cookies" />, container);
		const paragraph = container.querySelector("p")!;
		expect(paragraph.querySelectorAll("a")).toHaveLength(2);
		expect(paragraph.textContent?.split(t.overlay.descriptionPolicyLink)).toHaveLength(2);
		expect(paragraph.querySelector("a")?.getAttribute("href")).toBe("/privacy");
	});
});
