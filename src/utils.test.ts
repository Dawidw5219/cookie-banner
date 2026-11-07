// @vitest-environment jsdom
import { expect, it } from "vitest";
import { injectGrantedScripts } from "./utils";

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

it("does not suppress the banner for an external policy with the same path", async () => {
	const { isOnPolicyPage } = await import("./utils");
	expect(isOnPolicyPage("https://external-policy.test/")).toBe(false);
	expect(isOnPolicyPage(location.origin + location.pathname)).toBe(true);
});

it("keeps text and consent controls readable with dark or low-contrast configured colors", async () => {
	const { readableTheme } = await import("./utils");
	expect(
		readableTheme({
			background: "#ffffff",
			text: "#ffffff",
			primary: "#ffff00",
		}),
	).toMatchObject({ text: "#000000", primary: "#000000" });
	expect(
		readableTheme({
			background: "#111111",
			text: "#111111",
			primary: "#111111",
		}),
	).toMatchObject({ text: "#ffffff", primary: "#ffffff" });
	expect(
		readableTheme({
			background: "#ffffff",
			text: "#1a1a1a",
			primary: "#2563eb",
		}),
	).toMatchObject({ text: "#1a1a1a", primary: "#2563eb" });
});

it("distinguishes translated plain-permalink pages from the policy page", async () => {
 const {isOnPolicyPage}=await import("./utils");
 const old=location.href;
 history.replaceState({},"","/?page_id=10&lang=de");
 expect(isOnPolicyPage("/?page_id=20&lang=de")).toBe(false);
 expect(isOnPolicyPage("/?page_id=10&lang=fr")).toBe(false);
 expect(isOnPolicyPage("/?page_id=10&lang=de")).toBe(true);
 history.replaceState({},"",old);
});
