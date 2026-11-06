import type { Service } from "./services";

/** Local artwork only: even a preview thumbnail must not contact the provider. */
export function createContentPlaceholder(
	service: Service | undefined,
	id: string,
	lang: string,
	allow: () => void,
): HTMLElement {
	const pl = lang === "pl";
	const youtube = id === "youtube";
	const named =
		service && !id.startsWith("external-") && !/^unknown\b/i.test(service.name);
	const name = named
		? service.name
		: pl
			? "Treść zewnętrzna"
			: "External content";
	const box = document.createElement("section");
	box.className = "cb-content-placeholder";
	box.setAttribute(
		"aria-label",
		pl ? "Zablokowana treść zewnętrzna" : "Blocked external content",
	);
	box.style.cssText =
		"box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;max-width:100%;min-height:180px;padding:20px;text-align:center;border:1px solid var(--cb-content-border,color-mix(in srgb,currentColor 16%,transparent));border-radius:var(--cb-content-radius,10px);background:var(--cb-content-background,color-mix(in srgb,currentColor 3%,transparent));color:var(--cb-content-color,inherit);font-family:inherit;font-size:13px;font-weight:400;line-height:1.5;";
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
			"box-sizing:border-box;grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;padding:20px";
		box.append(frame, content);
	}

	const heading = document.createElement("div");
	heading.style.cssText =
		"display:flex;align-items:center;justify-content:center;gap:9px;max-width:100%";
	const icon = document.createElement("span");
	icon.setAttribute("aria-hidden", "true");
	icon.style.cssText = `display:flex;flex:none;width:${youtube ? 40 : 28}px;height:28px;align-items:center;justify-content:center;${youtube ? "color:#ff0033" : "opacity:.65"}`;
	icon.innerHTML = youtube
		? '<svg width="40" height="28" viewBox="0 0 40 28" fill="none" focusable="false"><rect width="40" height="28" rx="8" fill="currentColor"/><path d="m16 8 11 6-11 6V8Z" fill="white"/></svg>'
		: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" focusable="false"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01M10 12l-3 3 3 3m4-6 3 3-3 3"/></svg>';
	const title = document.createElement("strong");
	title.style.cssText =
		"font-family:inherit;font-size:15px;font-weight:600;line-height:1.4;overflow-wrap:anywhere;color:inherit";
	title.textContent = name;
	heading.append(icon, title);

	const text = document.createElement("p");
	text.style.cssText =
		"margin:0;max-width:42ch;font-family:inherit;font-size:13px;font-weight:400;line-height:1.5;color:inherit;text-wrap:pretty";
	text.textContent = pl
		? youtube
			? "Odtworzenie filmu wymaga zgody na połączenie z YouTube i przekazanie adresu IP oraz danych przeglądarki."
			: "Wyświetlenie treści wymaga zgody na przekazanie dostawcy adresu IP i danych przeglądarki."
		: youtube
			? "Playing this video requires consent to connect to YouTube and share your IP address and browser data."
			: "Displaying this content requires consent to share your IP address and browser data with the provider.";

	const button = document.createElement("button");
	button.type = "button";
	button.textContent = pl
		? youtube
			? "Zgadzam się — odtwórz"
			: "Zgadzam się — pokaż"
		: youtube
			? "Allow and play"
			: "Allow and show";
	button.style.cssText =
		"box-sizing:border-box;max-width:100%;min-height:36px;margin:0;padding:7px 14px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.4;white-space:normal;cursor:pointer;border:1px solid var(--cb-content-border,color-mix(in srgb,currentColor 35%,transparent));border-radius:var(--cb-content-radius,6px);background:var(--cb-content-primary,transparent);color:var(--cb-content-button-text,inherit);box-shadow:none;text-transform:none;letter-spacing:normal";
	button.addEventListener("click", allow, {
		isRocket: true,
	} as AddEventListenerOptions);
	content.append(heading, text, button);
	if (service?.privacyUrl) {
		const link = document.createElement("a");
		link.href = service.privacyUrl;
		link.textContent = pl ? "Polityka prywatności" : "Privacy policy";
		link.style.cssText =
			"font-family:inherit;font-size:11px;line-height:1.4;color:inherit;text-decoration:underline;text-underline-offset:2px";
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		content.append(link);
	}
	for (const child of content.children)
		(child as HTMLElement).style.flexShrink = "0";
	return box;
}
