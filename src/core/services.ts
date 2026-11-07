import { hasServiceDisclosure } from "./disclosure";
import trackers from "../../plugin/includes/tracker-database.json";
import providers from "../../plugin/includes/service-database.json";
import { getService } from "./service-catalog";
export { getService } from "./service-catalog";
import { getConsentState } from "./consent-storage";

export interface Service {
	id: string;
	name: string;
	description: string;
	privacyUrl: string;
	requiresConsent?: boolean;
	retention?: string;
}

export function matchService(url: string): Service | undefined {
	let parsed: URL;
	try {
		parsed = new URL(url, location.href);
	} catch {
		return;
	}
	if (!["https:", "http:"].includes(parsed.protocol)) return;
	for (const service of window.__cookieConsent?.services || []) {
		if (
			service.urls?.some((prefix) => {
				let target: URL;
				try {
					target = new URL(prefix);
				} catch {
					return false;
				}
				return (
					target.origin === parsed.origin &&
					parsed.pathname.startsWith(target.pathname)
				);
			})
		)
			return { ...service, privacyUrl: service.privacyUrl || "" };
	}
	for (const [name, tracker] of Object.entries(trackers)) {
		if (
			[...tracker.scriptPatterns, ...tracker.networkPatterns].some(
				(pattern) => {
					const target = new URL(`https://${pattern}`);
					return (
						target.hostname.includes(".") &&
						(parsed.hostname === target.hostname ||
							parsed.hostname.endsWith(`.${target.hostname}`)) &&
						parsed.pathname.startsWith(target.pathname)
					);
				},
			)
		)
			return {
				id: tracker.id,
				name,
				description: tracker.description,
				privacyUrl: tracker.privacyLink,
			};
	}
	const provider = providers.find((provider) =>
		provider.domains.some((domain) =>
			domain.startsWith("*.")
				? parsed.hostname === domain.slice(2) ||
					parsed.hostname.endsWith(domain.slice(1))
				: parsed.hostname === domain,
		),
	);
	if (provider)
		return {
			id: provider.id,
			name: provider.name,
			description: provider.category,
			privacyUrl: "",
			requiresConsent: [
				"ad",
				"analytics",
				"marketing",
				"social",
				"video",
				"customer-success",
				"tag-manager",
				"content",
			].includes(provider.category),
		};
	if (parsed.origin !== location.origin)
		return {
			id: `external-${parsed.hostname}`,
			name: parsed.hostname,
			description: "",
			privacyUrl: "",
		};
}

/** Invalid dependency metadata must never unlock a partially granted resource. */
export function getRequiredServices(element: HTMLElement): string[] | null {
	try {
		const ids: unknown = JSON.parse(element.dataset.cbRequired || "[]");
		if (
			!Array.isArray(ids) || ids.length > 100 ||
			!ids.every((id) => typeof id === "string" && /^[a-z0-9_.-]{1,100}$/i.test(id))
		) return null;
		return [...new Set(ids)];
	} catch {
		return null;
	}
}

export function getServices(): Service[] {
	const services = new Map<string, Service>();
	const add = (id: string) => {
		if (!services.has(id)) services.set(id, getService(id));
	};
	for (const service of window.__cookieConsent?.services || []) add(service.id);
	for (const id of window.__cookieConsent?.detectedServices || []) add(id);
	for (const id of Object.keys(getConsentState().services || {})) add(id);
	if (window.__cookieConsent?.gtmId) add("gtm");
	for (const element of document.querySelectorAll<HTMLElement>(
		"[data-cb-service]",
	)) {
		add(element.dataset.cbService!);
		for (const id of getRequiredServices(element) || []) add(id);
	}
	return [...services.values()];
}

export function allServiceGrants(): Record<string, boolean> {
	return Object.fromEntries(
		getServices().map((service) => [service.id, hasServiceDisclosure(service)]),
	);
}
