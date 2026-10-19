import type { ConsentState, ScriptDef, ThemeConfig } from "@/types";

export function isOnPrivacyPage(privacyPolicyUrl?: string): boolean {
	return isOnPage(privacyPolicyUrl);
}

export function isOnPolicyPage(privacyPolicyUrl?: string, cookiePolicyUrl?: string): boolean {
	return isOnPage(privacyPolicyUrl) || isOnPage(cookiePolicyUrl);
}

function isOnPage(url?: string): boolean {
	if (!url) return false;
	try {
		const parsed = new URL(url, window.location.origin);
		return window.location.pathname === parsed.pathname;
	} catch {
		return window.location.pathname === url;
	}
}

const injectedUrls = new Set<string>();

function injectScript(def: ScriptDef): void {
	if (def.src) {
		if (injectedUrls.has(def.src)) return;
		injectedUrls.add(def.src);
		const el = document.createElement("script");
		el.src = def.src;
		if (def.async) el.async = true;
		document.head.appendChild(el);
	}
	if (def.inline) {
		const el = document.createElement("script");
		el.textContent = def.inline;
		document.head.appendChild(el);
	}
}

export function injectGrantedScripts(
	state: ConsentState,
	scripts?: { analytics?: ScriptDef[]; marketing?: ScriptDef[] },
): void {
	if (!scripts) return;
	if (state.analytics && scripts.analytics) {
		for (const script of scripts.analytics) injectScript(script);
	}
	if (state.marketing && scripts.marketing) {
		for (const script of scripts.marketing) injectScript(script);
	}
}

/**
 * Darken a `#rgb`/`#rrggbb` color by `amount` (0–1) for hover shades.
 * Non-hex values (e.g. `oklch(...)`) are returned untouched — better an
 * unchanged hover than a broken color.
 */
export function darkenHexColor(color: string, amount: number): string {
	const hex = color.trim();
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
	if (!match) return color;
	const raw = match[1];
	const full =
		raw.length === 3
			? raw
					.split("")
					.map((c) => c + c)
					.join("")
			: raw;
	const channels = [0, 2, 4].map((i) => {
		const value = Number.parseInt(full.slice(i, i + 2), 16);
		return Math.round(value * (1 - amount))
			.toString(16)
			.padStart(2, "0");
	});
	return `#${channels.join("")}`;
}

export function applyTheme(host: HTMLElement, theme?: ThemeConfig): void {
	if (!theme) return;
	if (theme.primary) {
		host.style.setProperty("--cb-primary", theme.primary);
		// Without this the hover kept the stylesheet default (blue) while the
		// resting state used the configured brand color.
		host.style.setProperty(
			"--cb-primary-hover",
			theme.primaryHover ?? darkenHexColor(theme.primary, 0.18),
		);
	}
	if (theme.primaryHover && !theme.primary) {
		host.style.setProperty("--cb-primary-hover", theme.primaryHover);
	}
	if (theme.background) host.style.setProperty("--cb-bg", theme.background);
	if (theme.text) host.style.setProperty("--cb-text", theme.text);
}

export function createBannerHost(
	cssText: string,
	theme?: ThemeConfig,
): {
	host: HTMLElement;
	root: HTMLElement;
} {
	const host = document.createElement("div");
	host.id = "cookie-consent-host";
	document.body.appendChild(host);
	const shadow = host.attachShadow({ mode: "open" });
	const style = document.createElement("style");
	style.textContent = cssText;
	shadow.appendChild(style);
	applyTheme(host, theme);
	const root = document.createElement("div");
	root.id = "cookie-consent-root";
	shadow.appendChild(root);
	return { host, root };
}
