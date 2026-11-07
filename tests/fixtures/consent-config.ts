import type { BannerConfig } from "../../src/types";

/** Explicit legal test data, never a production default or bypass. */
export function consentConfig(overrides: Partial<BannerConfig> = {}): BannerConfig {
	return {
		mode: "standalone", lang: "pl", noticeVersion: "test-notice-1",
		controller: { name: "Test controller" }, purposes: "Test analytics and optional embedded video",
		privacyPolicyUrl: "/privacy",
		serviceDisclosures: Object.fromEntries(["youtube", "vimeo", "gtm", "ga4"].map((id) => [id, {
			description: `Explicit test purpose for ${id}`, privacyUrl: "https://example.com/privacy", retention: "Session",
		}])),
		...overrides,
	};
}
