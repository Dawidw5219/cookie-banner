import { expect, it } from "vitest";
import providers from "../../plugin/includes/service-database.json";
import { getProvider, matchProvider } from "../../src/core/provider-catalog";

it("preserves the first matching provider for every catalog domain, subdomain and spoofed suffix", () => {
	const originalMatch = (hostname: string) => providers.find((provider) =>
		provider.domains.some((domain) => domain.startsWith("*.")
			? hostname === domain.slice(2) || hostname.endsWith(domain.slice(1))
			: hostname === domain),
	);
	for (const provider of providers) {
		for (const domain of provider.domains) {
			const host = domain.replace(/^\*\./, "");
			for (const candidate of [host, `child.${host}`, `${host}.not-the-provider.invalid`]) {
				expect(matchProvider(candidate)?.id, candidate).toBe(originalMatch(candidate)?.id);
			}
		}
	}
});

it("retains metadata for every provider identity", () => {
	const original = new Map(providers.map((provider) => [provider.id, provider]));
	for (const [id, provider] of original) expect(getProvider(id)).toEqual(provider);
	expect(getProvider("not-in-the-catalog")).toBeUndefined();
});
