import type { BannerConfig } from "../types";

export function isPolicyUrl(value?: string): boolean {
	if (!value?.trim()) return false;
	try {
		const url = new URL(value, "https://consent.invalid");
		return (
			["https:", "http:"].includes(url.protocol) &&
			!url.username &&
			!url.password
		);
	} catch {
		return false;
	}
}

export function hasCompleteDisclosure(config?: BannerConfig): boolean {
	return !!(
		config?.controller?.name.trim() &&
		config.purposes?.trim() &&
		config.noticeVersion?.trim() &&
		isPolicyUrl(config.privacyPolicyUrl)
	);
}

export function hasServiceDisclosure(service: {
	name: string;
	description: string;
	privacyUrl: string;
	retention?: string;
}): boolean {
	return !!(
		service.name.trim() &&
		service.description.trim() &&
		service.retention?.trim() &&
		isPolicyUrl(service.privacyUrl)
	);
}
