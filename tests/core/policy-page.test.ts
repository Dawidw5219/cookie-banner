// @vitest-environment jsdom
import { expect, it } from "vitest";

it("does not suppress the banner for an external policy with the same path", async () => {
	const { isOnPolicyPage } = await import("../../src/core/policy-page");
	expect(isOnPolicyPage("https://external-policy.test/")).toBe(false);
	expect(isOnPolicyPage(location.origin + location.pathname)).toBe(true);
});

it("distinguishes translated plain-permalink pages from the policy page", async () => {
 const {isOnPolicyPage}=await import("../../src/core/policy-page");
 const old=location.href;
 history.replaceState({},"","/?page_id=10&lang=de");
 expect(isOnPolicyPage("/?page_id=20&lang=de")).toBe(false);
 expect(isOnPolicyPage("/?page_id=10&lang=fr")).toBe(false);
 expect(isOnPolicyPage("/?page_id=10&lang=de")).toBe(true);
 history.replaceState({},"",old);
});
