import type { ThemeConfig } from "../types";
import { applyTheme } from "./theme";

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
