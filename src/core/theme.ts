import type { ThemeConfig } from "../types";

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

function luminance(hex: string): number | undefined {
	const match = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(hex);
	if (!match) return;
	const raw =
		match[1].length === 3
			? [...match[1]].map((digit) => digit + digit).join("")
			: match[1];
	const channels = [0, 2, 4].map((index) => {
		const channel = Number.parseInt(raw.slice(index, index + 2), 16) / 255;
		return channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	});
	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function readableTheme(theme: ThemeConfig): ThemeConfig {
	const background = theme.background || "#ffffff";
	const level = luminance(background);
	if (level === undefined) return theme;
	const contrast = (color: string) => {
		const foreground = luminance(color);
		return foreground === undefined
			? Infinity
			: (Math.max(level, foreground) + 0.05) /
					(Math.min(level, foreground) + 0.05);
	};
	const fallback =
		contrast("#000000") > contrast("#ffffff") ? "#000000" : "#ffffff";
	let text = theme.text || "#1a1a1a";
	let primary = theme.primary || "#2563eb";
	if (contrast(text) < 7) text = fallback;
	if (contrast(primary) < 4.5) primary = fallback;
	return {
		...theme,
		background,
		text,
		primary,
		primaryHover: primary === theme.primary ? theme.primaryHover : undefined,
	};
}

export function applyTheme(host: HTMLElement, theme?: ThemeConfig): void {
	if (!theme) return;
	theme = readableTheme(theme);
	const primaryLevel = luminance(theme.primary || "#2563eb");
	host.style.setProperty(
		"--cb-on-primary",
		primaryLevel !== undefined && primaryLevel > 0.179 ? "#000000" : "#ffffff",
	);
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
