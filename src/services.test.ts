// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { getServices, matchService } from "./services";
afterEach(() => {
	delete window.__cookieConsent;
	localStorage.clear();
	document.body.replaceChildren();
});

it("uses one provider identity for script loading and subsequent collection requests", () => {
	expect(
		matchService("https://www.googletagmanager.com/gtag/js?id=G-TEST")?.id,
	).toBe("ga4");
	expect(
		matchService("https://www.google-analytics.com/g/collect?v=2")?.id,
	).toBe("ga4");
	expect(
		matchService("https://google-analytics.com.evil.example/g/collect")?.id,
	).toBe("external-google-analytics.com.evil.example");
});

it("lists explicit custom services once and ignores invalid developer URL patterns", () => {
	window.__cookieConsent = {
		mode: "standalone",
		lang: "pl",
		services: [
			{
				id: "custom",
				name: "Custom widget",
				description: "Displays a widget",
				urls: ["invalid", "https://widget.example/"],
			},
		],
	};
	document.body.innerHTML = '<div data-cb-service="custom"></div>';
	expect(matchService("https://widget.example/sdk.js")?.id).toBe("custom");
	expect(
		getServices().filter((service) => service.id === "custom"),
	).toHaveLength(1);
});
