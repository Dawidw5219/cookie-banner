import { buildConsentCsp } from "./csp";

/** Tightening is immediate and intentionally irreversible until a new document loads. */
const marker = "data-cb-revoked";

export function hasRevocationPolicy(): boolean {
	return (
		typeof document !== "undefined" &&
		document.documentElement.hasAttribute(marker)
	);
}

export function restrictOptionalRequestsUntilReload(): void {
	if (
		typeof document === "undefined" ||
		!document.head ||
		hasRevocationPolicy()
	)
		return;
	const meta = document.createElement("meta");
	meta.id = "cb-revocation-policy";
	meta.httpEquiv = "Content-Security-Policy";
	// frame-ancestors is HTTP-only; reuse the canonical deny policy for all other directives.
	meta.content = buildConsentCsp({ services: {} })
		.split("; ")
		.filter((directive) => !directive.startsWith("frame-ancestors "))
		.join("; ");
	document.head.prepend(meta);
	document.documentElement.setAttribute(marker, "true");
}
