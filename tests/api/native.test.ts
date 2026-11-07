import { describe, expect, it } from "vitest";
import {
	blockedContentProps,
	blockedScriptProps,
	hasServiceConsent,
	initializeConsent,
} from "../../src/api/native";

describe("native entry in server rendering", () => {
	it("produces inert HTML props without reading window or document", () => {
		const props = blockedContentProps(
			"youtube",
			"https://www.youtube.com/embed/test",
		);
		expect(props).toEqual({
			"data-cb-service": "youtube",
			"data-cb-src": "https://www.youtube.com/embed/test",
			hidden: true,
		});
		expect(props).not.toHaveProperty("src");
		expect(
			blockedScriptProps("analytics", "https://example.org/sdk.js"),
		).toMatchObject({ type: "text/plain", "data-cb-service": "analytics" });
		expect(hasServiceConsent("youtube")).toBe(false);
	});

	it("rejects initialization on the server instead of importing browser side effects", async () => {
		await expect(
			initializeConsent({ mode: "standalone", lang: "pl" }),
		).rejects.toThrow("after hydration");
	});
});
