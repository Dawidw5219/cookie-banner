// @vitest-environment jsdom
import { render } from "preact";
import { afterEach, expect, it, vi } from "vitest";
import { ConfigContext } from "../../src/hooks/use-consent";
import { PreferencesModal } from "../../src/components/preferences-modal";
import { setLang } from "../../src/i18n";
import type { BannerConfig } from "../../src/types";

const root = document.createElement("div");
afterEach(() => {
	render(null, root);
	localStorage.clear();
	delete window.__cookieConsent;
});

it.each([undefined, "standard", "equal"] as const)(
	"keeps the expected header and footer actions for %s",
	(buttonStyle) => {
		setLang("en");
		const config: BannerConfig = {
			mode: "standalone",
			lang: "en",
			noticeVersion: "qa-1",
			buttonStyle,
			controller: { name: "QA company" },
			purposes: "Play a video",
			privacyPolicyUrl: "/privacy",
			services: [
				{
					id: "video",
					name: "QA video",
					description: "A test video",
					privacyUrl: "/privacy",
					retention: "Session",
				},
			],
		};
		window.__cookieConsent = config;
		const reject = vi.fn(),
			save = vi.fn();
		render(
			<ConfigContext.Provider value={config}>
				<PreferencesModal
					privacyPolicyUrl="/privacy"
					initialState={{ essential: true, analytics: false, marketing: false }}
					onSave={save}
					onAcceptAll={() => {}}
					onRejectAll={reject}
				/>
			</ConfigContext.Provider>,
			root,
		);
		const header = root.querySelector(".cb-preferences-header")!;
		const footer = root.querySelector(".cb-preferences-footer")!;
		const buttons = [...footer.querySelectorAll("button")];
		expect(buttons.map((button) => button.textContent)).toEqual(
			buttonStyle === "equal"
				? ["Reject All", "Save", "Accept All & Continue"]
				: ["Save", "Accept All & Continue"],
		);
		expect(header.textContent).not.toContain("QA company");
		expect(header.querySelector(".cb-header-reject") !== null).toBe(
			buttonStyle !== "equal",
		);
		expect(root.querySelector(".cb-notice-details")?.textContent).toContain(
			"QA company",
		);
		expect(root.querySelector(".cb-notice-details")?.hasAttribute("open")).toBe(
			false,
		);
		const cards = [...root.querySelectorAll(".cb-preference-option")];
		expect(cards).toHaveLength(4);
		expect(new Set(cards.map((card) => card.className)).size).toBe(1);
		(header.querySelector("button") || buttons[0]).click();
		expect(reject).toHaveBeenCalledOnce();
		buttons.find((button) => button.textContent === "Save")!.click();
		expect(save).toHaveBeenCalledWith({
			essential: true,
			analytics: false,
			marketing: false,
		});
	},
);
