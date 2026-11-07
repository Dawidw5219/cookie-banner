import providers from "../../plugin/includes/service-database.json";

type Provider = (typeof providers)[number];
type ProviderIndex = {
	byId: Map<string, Provider>;
	exactHosts: Map<string, number>;
	wildcardHosts: Map<string, number>;
};

let index: ProviderIndex | undefined;

function getIndex(): ProviderIndex {
	if (index) return index;
	const byId = new Map<string, Provider>();
	const exactHosts = new Map<string, number>();
	const wildcardHosts = new Map<string, number>();
	providers.forEach((provider, order) => {
		byId.set(provider.id, provider);
		for (const domain of provider.domains) {
			const wildcard = domain.startsWith("*.");
			const hosts = wildcard ? wildcardHosts : exactHosts;
			const host = wildcard ? domain.slice(2) : domain;
			// Keep the first provider, matching the original catalog search order.
			if (!hosts.has(host)) hosts.set(host, order);
		}
	});
	index = { byId, exactHosts, wildcardHosts };
	return index;
}

export function getProvider(id: string): Provider | undefined {
	return getIndex().byId.get(id);
}

export function matchProvider(hostname: string): Provider | undefined {
	const { exactHosts, wildcardHosts } = getIndex();
	let order = exactHosts.get(hostname) ?? Infinity;
	let suffix = hostname;
	while (suffix) {
		order = Math.min(order, wildcardHosts.get(suffix) ?? Infinity);
		const dot = suffix.indexOf(".");
		if (dot === -1) break;
		suffix = suffix.slice(dot + 1);
	}
	return providers[order];
}
