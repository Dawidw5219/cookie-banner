// @vitest-environment jsdom
import { expect, it } from "vitest";
import { injectGrantedScripts } from "../../src/core/script-loader";

it("does not let a category grant bypass the separate provider choice", () => {
	const scripts = {
		analytics: [
			{ service: "qa-analytics", src: "https://analytics.test/sdk.js" },
		],
	};
	injectGrantedScripts(
		{ essential: true, analytics: true, marketing: false },
		scripts,
	);
	expect(
		document.querySelector('script[src="https://analytics.test/sdk.js"]'),
	).toBeNull();
	injectGrantedScripts(
		{
			essential: true,
			analytics: false,
			marketing: false,
			services: { "qa-analytics": true },
		},
		scripts,
	);
	expect(
		document.querySelector('script[src="https://analytics.test/sdk.js"]'),
	).toBeNull();
	injectGrantedScripts(
		{
			essential: true,
			analytics: true,
			marketing: false,
			services: { "qa-analytics": true },
		},
		scripts,
	);
	expect(
		document.querySelectorAll('script[src="https://analytics.test/sdk.js"]'),
	).toHaveLength(1);
});
