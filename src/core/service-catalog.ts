import trackers from "../../plugin/includes/tracker-database.json";
import providers from "../../plugin/includes/service-database.json";
import type { Service } from "./services";

// The catalog describes recognized providers; consent UI contains observed services only.
const known = new Map<string, Service>([
	...Object.entries(trackers).map(
		([name, tracker]) =>
			[
				tracker.id,
				{
					id: tracker.id,
					name,
					description: tracker.description,
					privacyUrl: tracker.privacyLink,
				},
			] as [string, Service],
	),
	...providers.map(
		(provider) =>
			[
				provider.id,
				{
					id: provider.id,
					name: provider.name,
					description: provider.category,
					privacyUrl: "",
				},
			] as [string, Service],
	),
]);

export function getService(id: string): Service {
	const config = window.__cookieConsent;
	const custom = config?.services?.find((item) => item.id === id);
	const service = custom ||
		known.get(id) || {
			id,
			name: id.replace(/^external-/, ""),
			description: "",
			privacyUrl: "",
		};
	return {
		...service,
		...config?.serviceDisclosures?.[id],
  // Unreviewed catalog descriptions are not site-specific translated disclosures.
  description: config?.serviceDisclosures?.[id]?.description || custom?.description || "",
		privacyUrl:
			config?.serviceDisclosures?.[id]?.privacyUrl || service.privacyUrl || "",
	};
}
