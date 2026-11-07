// @vitest-environment jsdom
import { expect, it } from "vitest";

it("keeps text and consent controls readable with dark or low-contrast configured colors", async () => {
	const { readableTheme } = await import("../../src/core/theme");
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
