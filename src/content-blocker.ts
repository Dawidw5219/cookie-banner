import { setServiceConsent } from "./service-consent";
import { getConsentState } from "@/hooks/use-storage";
import { getServices, matchService } from "@/services";
import type { BannerConfig } from "@/types";

// Only inert markup is guaranteed to make no request before consent. A DOM
// observer cannot undo requests made by live src attributes or executed scripts.
export function startContentBlocker(config: BannerConfig): () => void {
	const activeScripts = new Map<HTMLScriptElement, HTMLScriptElement>();
	const placeholders = new Map<HTMLElement, HTMLElement>();
	let stopped = false;
	let scriptQueue = Promise.resolve();
	let serviceSignature = "";
	const pl = config.lang === "pl";
	const sync = (event?: Event) => {
		if (stopped) return;
		if (
			config.strictCsp &&
			event?.type === "storage" &&
			((event as StorageEvent).key === null ||
				(event as StorageEvent).key?.startsWith("cb_"))
		) {
			window.location.reload();
			return;
		}
		for (const element of document.querySelectorAll<HTMLElement>(
			"[data-cb-src]:not([data-cb-service])",
		)) {
			const service = matchService(element.dataset.cbSrc!);
			if (service) element.dataset.cbService = service.id;
		}
		const signature = getServices()
			.map((service) => service.id)
			.sort()
			.join("|");
		if (signature !== serviceSignature) {
			serviceSignature = signature;
			window.dispatchEvent(new Event("cb:services-changed"));
		}
		const state = getConsentState();
		for (const [element, box] of placeholders) {
			if (!element.isConnected) {
				box.remove();
				placeholders.delete(element);
			}
		}
		for (const element of document.querySelectorAll<HTMLElement>(
			"[data-cb-service]",
		)) {
			const id = element.dataset.cbService!;
			const required: string[] = JSON.parse(element.dataset.cbRequired || "[]");
			const granted =
				state.services?.[id] === true &&
				required.every((service) => state.services?.[service] === true);
			if (element instanceof HTMLScriptElement) {
				if (
					granted &&
					!activeScripts.has(element) &&
					element.dataset.cbExecuted !== "true" &&
					(element.type === "text/plain" ||
						(!element.type &&
							!!element.dataset.cbSrc &&
							!element.hasAttribute("src")))
				) {
					const script = document.createElement("script");
					for (const attr of element.attributes) {
						if (
							![
								"type",
								"src",
								"data-cb-src",
								"data-cb-type",
								"data-cb-service",
								"data-cb-executed",
							].includes(attr.name)
						)
							script.setAttribute(attr.name, attr.value);
					}
					const originalType = (
						element.dataset.cbType || "text/javascript"
					).replace(/^(?:true|false)\//, "");
					script.type =
						originalType === "text/plain" ? "text/javascript" : originalType;
					script.async = element.hasAttribute("async");
					if (element.dataset.cbSrc) script.src = element.dataset.cbSrc;
					script.textContent = element.textContent;
					activeScripts.set(element, script);
					scriptQueue = scriptQueue.then(
						() =>
							new Promise<void>((resolve) => {
								if (
									stopped ||
									!element.isConnected ||
									getConsentState().services?.[id] !== true
								) {
									activeScripts.delete(element);
									resolve();
									return;
								}
								if (script.src || script.type === "module") {
									script.addEventListener("load", () => resolve(), {
										once: true,
									});
									script.addEventListener("error", () => resolve(), {
										once: true,
									});
								}
								element.dataset.cbExecuted = "true";
								element.after(script);
								if (!script.src && script.type !== "module") resolve();
							}),
					);
				} else if (!granted && activeScripts.has(element)) {
					// Removing a script cannot undo its side effects. Reload after withdrawal.
					activeScripts.get(element)!.remove();
					activeScripts.delete(element);
					if (event?.type === "storage") window.location.reload();
				}
				continue;
			}
			if (
				element instanceof HTMLLinkElement ||
				element instanceof HTMLImageElement
			) {
				const attribute = element instanceof HTMLLinkElement ? "href" : "src";
				if (granted && element.dataset.cbSrc)
					element.setAttribute(attribute, element.dataset.cbSrc);
				else element.removeAttribute(attribute);
				if (
					granted &&
					element instanceof HTMLImageElement &&
					element.dataset.cbSrcset
				)
					element.srcset = element.dataset.cbSrcset;
				else if (element instanceof HTMLImageElement)
					element.removeAttribute("srcset");
				element.hidden = !granted;
				continue;
			}
			if (granted) {
				placeholders.get(element)?.remove();
				placeholders.delete(element);
				element.hidden = false;
				if (
					element.dataset.cbSrc &&
					element.getAttribute("src") !== element.dataset.cbSrc
				)
					element.setAttribute("src", element.dataset.cbSrc);
				continue;
			}
			if (element.hasAttribute("src")) element.removeAttribute("src");
			element.hidden = true;
			if (placeholders.has(element)) continue;
			const service = getServices().find((service) => service.id === id);
			const box = document.createElement("section");
			box.className = "cb-content-placeholder";
			box.setAttribute(
				"aria-label",
				pl ? "Zablokowana treść zewnętrzna" : "Blocked external content",
			);
			box.style.cssText = `box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;padding:clamp(1.5rem,5vw,3rem);min-height:180px;border:1px solid var(--cb-content-border,#d1d5db);border-radius:var(--cb-content-radius,12px);background:var(--cb-content-background,${config.theme?.background || "#f5f5f5"});color:var(--cb-content-color,${config.theme?.text || "inherit"});font:inherit;`;
			if (element instanceof HTMLIFrameElement)
				box.style.minHeight = "clamp(240px, 35vw, 450px)";
			const title = document.createElement("strong");
			title.textContent = service?.name || id;
			const text = document.createElement("p");
			text.style.cssText = "margin:0;max-width:48ch;line-height:1.6";
			text.textContent = pl
				? "Ta treść wymaga Twojej zgody. Jej włączenie udostępni dostawcy Twój adres IP i dane przeglądarki. Możesz cofnąć zgodę w ustawieniach prywatności."
				: "This content requires your consent. Enabling it shares your IP address and browser data with the provider. You can withdraw consent in privacy settings.";
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = pl
				? `Zgadzam się — włącz ${title.textContent}`
				: `Allow ${title.textContent}`;
			button.style.cssText = `font:inherit;cursor:pointer;padding:.75em 1.25em;border-radius:var(--cb-content-radius,8px);border:1px solid currentColor;background:var(--cb-content-primary,${config.theme?.primary || "#2563eb"});color:var(--cb-content-button-text,#fff)`;
			button.addEventListener(
				"click",
				() => {
					setServiceConsent(id, true);
				},
				{ isRocket: true } as AddEventListenerOptions,
			);
			box.append(title, text);
			if (service?.privacyUrl) {
				const link = document.createElement("a");
				link.href = service.privacyUrl;
				link.textContent = pl
					? "Polityka prywatności dostawcy"
					: "Provider privacy policy";
				link.target = "_blank";
				link.rel = "noopener noreferrer";
				box.append(link);
			}
			box.append(button);
			for (const child of box.children)
				(child as HTMLElement).style.flexShrink = "0";
			placeholders.set(element, box);
			element.after(box);
		}
	};
	const observer = new MutationObserver(() => sync());
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["data-cb-src", "data-cb-service"],
	});
	const restorePolicy = (event: PageTransitionEvent) => {
		if (config.strictCsp && event.persisted) window.location.reload();
	};
	window.addEventListener("pageshow", restorePolicy);
	window.addEventListener("cb:consent-update", sync);
	window.addEventListener("storage", sync);
	sync();
	return () => {
		stopped = true;
		observer.disconnect();
		window.removeEventListener("cb:consent-update", sync);
		window.removeEventListener("storage", sync);
		window.removeEventListener("pageshow", restorePolicy);
		for (const box of placeholders.values()) box.remove();
	};
}
