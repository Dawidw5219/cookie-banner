import type { BannerConfig, ConsentCleanup, ConsentState } from "../types";

function clearIdentifiers(cleanup?: ConsentCleanup): void {
	if (!cleanup) return;
	const paths = new Set(["/", location.pathname]);
	const parts = location.pathname.split("/").filter(Boolean);
	for (let i = 1; i <= parts.length; i++) {
		paths.add("/" + parts.slice(0, i).join("/"));
		paths.add("/" + parts.slice(0, i).join("/") + "/");
	}
	const domains = [""];
	const labels = location.hostname.split(".");
	for (let i = 0; i < labels.length - 1; i++)
		domains.push(labels.slice(i).join("."));
	for (const name of cleanup.cookies || []) {
		if (!/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(name) || name.startsWith("cb_"))
			continue;
		for (const path of paths)
			for (const domain of domains) {
				document.cookie = `${name}=; Max-Age=0; Path=${path}${domain ? `; Domain=${domain}` : ""}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
			}
	}
	for (const [storage, keys] of [
		["localStorage", cleanup.localStorage],
		["sessionStorage", cleanup.sessionStorage],
	] as const) {
		for (const key of keys || []) {
			if (key.startsWith("cb_")) continue;
			try {
				window[storage].removeItem(key);
			} catch {
				/* Storage may be disabled. */
			}
		}
	}
}

export function wasConsentRevoked(
	previous: ConsentState,
	next: ConsentState,
): boolean {
	return (
		(previous.analytics && !next.analytics) ||
		(previous.marketing && !next.marketing) ||
		Object.entries(previous.services || {}).some(
			([id, granted]) => granted && !next.services?.[id],
		)
	);
}

/** Only explicitly configured first-party identifiers; never clear essential site data. */
export function cleanupRevokedConsent(
	config: BannerConfig,
	previous: ConsentState,
	next: ConsentState,
): void {
	for (const category of ["analytics", "marketing"] as const) {
		if (previous[category] && !next[category])
			clearIdentifiers(config.categoryCleanup?.[category]);
	}
	for (const [id, granted] of Object.entries(previous.services || {})) {
		if (!granted || next.services?.[id]) continue;
		clearIdentifiers(
			config.services?.find((service) => service.id === id)?.cleanup,
		);
		clearIdentifiers(config.serviceDisclosures?.[id]?.cleanup);
	}
}
