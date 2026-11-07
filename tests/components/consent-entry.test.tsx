// @vitest-environment jsdom
import { render } from "preact";
import { afterEach, expect, it, vi } from "vitest";
import { ConfigContext } from "../../src/hooks/use-consent";
import { ConsentOverlay } from "../../src/components/consent-overlay";
import { ConsentBar } from "../../src/components/consent-bar";
import { setLang } from "../../src/i18n";
import type { BannerConfig } from "../../src/types";

const root = document.createElement("div");
afterEach(() => {
	render(null, root);
	delete window.__cookieConsent;
});
for (const Component of [ConsentOverlay, ConsentBar]) {
	it.each([undefined, "standard", "equal"] as const)(
		`${Component.name}: actions for %s`,
		(buttonStyle) => {
			setLang("en");
			const config: BannerConfig = {
				mode: "standalone",
				lang: "en",
				noticeVersion: "test",
				controller: { name: "Test" },
				purposes: "Video",
				privacyPolicyUrl: "/privacy",
				buttonStyle,
			};
			window.__cookieConsent = config;
			const reject = vi.fn(),
				settings = vi.fn();
			render(
				<ConfigContext.Provider value={config}>
					<Component
						privacyPolicyUrl="/privacy"
						onAcceptAll={() => {}}
						onRejectAll={reject}
						onOpenPreferences={settings}
					/>
				</ConfigContext.Provider>,
				root,
			);
			const buttons = [...root.querySelectorAll("button")];
			expect(buttons).toHaveLength(buttonStyle === "equal" ? 3 : 2);
			const refusal = buttons.find(
				(button) => button.textContent === "Reject All",
			);
			expect(!!refusal).toBe(buttonStyle === "equal");
			expect(buttons.map((button) => button.textContent)).toEqual(
				buttonStyle === "equal"
					? Component === ConsentOverlay
						? ["Reject All", "Accept All", "Advanced Settings"]
						: ["Advanced Settings", "Reject All", "Accept All"]
					: ["Advanced Settings", "Accept All"],
			);
			if (Component === ConsentOverlay)
				expect(!!root.querySelector(".cb-intro-icon")).toBe(
					buttonStyle === "equal",
				);
			buttons
				.find((button) => button.textContent === "Advanced Settings")!
				.click();
			expect(settings).toHaveBeenCalledOnce();
			refusal?.click();
			expect(reject).toHaveBeenCalledTimes(buttonStyle === "equal" ? 1 : 0);
		},
	);
}
