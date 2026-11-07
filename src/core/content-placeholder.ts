import {
	hasCompleteDisclosure,
	hasServiceDisclosure,
	isPolicyUrl,
} from "./disclosure";
import { resolveTranslation } from "../i18n/index";
import { applyTheme } from "./theme";
import type { Service } from "./services";

/** Local artwork only: even a preview thumbnail must not contact the provider. */
export function createContentPlaceholder(
	service: Service | undefined,
	id: string,
	lang: string,
	allow: () => void,
	container?: HTMLElement | null,
): HTMLElement {
	const config = window.__cookieConsent;
	const disclosed =
		hasCompleteDisclosure(config) && !!service && hasServiceDisclosure(service);
	const copy = resolveTranslation(lang, config?.customTexts);
	const youtube = id === "youtube";
	const named =
		service && !id.startsWith("external-") && !/^unknown\b/i.test(service.name);
	const name = named ? service.name : copy.content.external;
	const box = document.createElement("section");
	box.className = "cb-content-placeholder";
	box.lang = lang;
	box.setAttribute("aria-label", copy.content.blocked);
	box.style.cssText =
		"box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;width:100%;max-width:100%;min-height:280px;padding:32px 24px;text-align:center;border:1px solid var(--cb-content-border,color-mix(in srgb,currentColor 9%,transparent));border-radius:var(--cb-content-radius,18px);background:var(--cb-content-background,linear-gradient(145deg,color-mix(in srgb,var(--cb-content-surface,#fff) 96%,var(--cb-primary,#2563eb)),var(--cb-content-surface,#fff)));box-shadow:0 8px 28px color-mix(in srgb,currentColor 5%,transparent);color:var(--cb-content-color,inherit);font-family:inherit;font-size:13px;font-weight:400;line-height:1.5;";
	applyTheme(box, config?.theme || {});
	// Match the actual page surface, including dark sections, without loading artwork.
	for (let parent = container; parent; parent = parent.parentElement) {
		const background = getComputedStyle(parent).backgroundColor;
		if (background === "transparent" || background === "rgba(0, 0, 0, 0)")
			continue;
		box.style.setProperty("--cb-content-surface", background);
		break;
	}
	let content = box;
	if (youtube) {
		// Stack the video-shaped space and content in one grid cell. Text can
		// grow the frame on small screens instead of overflowing a fixed ratio.
		box.style.display = "grid";
		box.style.gridTemplateColumns = "minmax(0,1fr)";
		box.style.padding = "0";
		box.style.gap = "0";
		const frame = document.createElement("div");
		frame.setAttribute("aria-hidden", "true");
		frame.style.cssText =
			"grid-area:1/1;width:100%;aspect-ratio:16/9;pointer-events:none";
		content = document.createElement("div");
		content.className = "cb-content-placeholder-body";
		content.style.cssText =
			"box-sizing:border-box;grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;width:100%;padding:32px 24px";
		box.append(frame, content);
	}

	const heading = document.createElement("div");
	heading.style.cssText =
		"display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;max-width:100%";
	const icon = document.createElement("span");
	icon.setAttribute("aria-hidden", "true");
	icon.style.cssText = `display:flex;flex:none;width:56px;height:56px;align-items:center;justify-content:center;border-radius:17px;background:color-mix(in srgb,var(--cb-primary,#2563eb) 9%,var(--cb-content-surface,#fff));color:${youtube ? "#ff0033" : "var(--cb-primary,#2563eb)"}`;
	icon.innerHTML = youtube
		? '<svg width="40" height="28" viewBox="0 0 40 28" fill="none" focusable="false"><rect width="40" height="28" rx="8" fill="currentColor"/><path d="m16 8 11 6-11 6V8Z" fill="white"/></svg>'
		: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01M10 12l-3 3 3 3m4-6 3 3-3 3"/></svg>';
	const title = document.createElement("strong");
	title.style.cssText =
		"font-family:inherit;font-size:18px;font-weight:600;line-height:1.4;overflow-wrap:anywhere;color:inherit";
	title.textContent = youtube ? copy.content.videoTitle : name;
	heading.append(icon, title);

	const text = document.createElement("p");
	text.style.cssText =
		"margin:0;max-width:38ch;font-family:inherit;font-size:13px;font-weight:400;line-height:1.5;color:inherit;text-wrap:pretty";
	text.textContent = youtube
		? copy.content.videoDescription
		: copy.content.description;

	const button = document.createElement("button");
	button.type = "button";
	button.textContent = youtube
		? copy.content.allowPlay
		: copy.content.allowShow;
	button.style.cssText =
		"box-sizing:border-box;max-width:100%;min-height:44px;margin:4px 0 0;padding:11px 20px;font-family:inherit;font-size:13px;font-weight:600;line-height:1.4;white-space:normal;cursor:pointer;border:1px solid transparent;border-radius:var(--cb-content-button-radius,10px);background:var(--cb-content-primary,var(--cb-primary,#2563eb));color:var(--cb-content-button-text,var(--cb-on-primary,#fff));box-shadow:0 3px 8px color-mix(in srgb,var(--cb-primary,#2563eb) 16%,transparent);text-transform:none;letter-spacing:normal";
	button.addEventListener(
		"click",
		() => {
			if (disclosed) {
				try {
					allow();
				} catch {
					text.setAttribute("role", "alert");
					text.textContent = copy.disclosure.saveError;
				}
			} else window.dispatchEvent(new Event("cb:open-preferences"));
		},
		{
			isRocket: true,
		} as AddEventListenerOptions,
	);
	if (!disclosed) {
		text.textContent = copy.disclosure.unavailable;
		button.textContent = copy.overlay.advancedSettings;
	}
	content.append(heading, text);

	const details = document.createElement("details");
	details.style.cssText =
		"max-width:48ch;font-family:inherit;font-size:12px;line-height:1.6;color:inherit";
	const summary = document.createElement("summary");
	summary.textContent = copy.content.privacyDetails;
	summary.style.cssText =
		"min-height:24px;line-height:24px;cursor:pointer;text-decoration:underline;text-underline-offset:3px";
	details.append(summary);
	if (disclosed && service) {
		const notice = document.createElement("p");
		notice.style.cssText = "margin:10px 0 6px;font:inherit;color:inherit";
		notice.textContent = `${config!.controller!.name}. ${service.description} ${copy.disclosure.retention}: ${service.retention}.`;
		details.append(notice);
	}
	const policies: [string | undefined, string][] = [
		[config?.privacyPolicyUrl, copy.overlay.privacyPolicy],
		[service?.privacyUrl, copy.content.providerPrivacy],
	];
	for (const [url, label] of policies) {
		if (!isPolicyUrl(url)) continue;
		const link = document.createElement("a");
		link.href = url!;
		link.textContent = label;
		link.style.cssText =
			"display:inline-block;min-height:24px;line-height:24px;margin:4px 6px;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px";
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		details.append(link);
	}
	content.append(button, details);
	// Keep keyboard focus visible even if the host resets button/link outlines.
	for (const control of [button, summary, ...details.querySelectorAll("a")]) {
		control.addEventListener("focus", () => {
			control.style.outline = `2px solid ${getComputedStyle(box).color}`;
			control.style.outlineOffset = "3px";
		});
		control.addEventListener("blur", () => {
			control.style.removeProperty("outline");
			control.style.removeProperty("outline-offset");
		});
	}

	for (const child of content.children)
		(child as HTMLElement).style.flexShrink = "0";
	return box;
}
