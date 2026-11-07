export function isOnPrivacyPage(privacyPolicyUrl?: string): boolean {
	return isOnPage(privacyPolicyUrl);
}

export function isOnPolicyPage(
	privacyPolicyUrl?: string,
	cookiePolicyUrl?: string,
): boolean {
	return isOnPage(privacyPolicyUrl) || isOnPage(cookiePolicyUrl);
}

function isOnPage(url?: string): boolean {
	if (!url) return false;
	try {
		const parsed = new URL(url, window.location.origin);
		const current = new URL(window.location.href);
		return (
			parsed.origin === current.origin && parsed.pathname === current.pathname &&
			["page_id", "p", "pagename"].every(key => parsed.searchParams.get(key) === current.searchParams.get(key)) &&
			(!parsed.searchParams.has("lang") || parsed.searchParams.get("lang") === current.searchParams.get("lang"))
		);
	} catch {
		return window.location.pathname === url;
	}
}
