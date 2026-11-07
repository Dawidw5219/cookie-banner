import { createContentPlaceholder } from "./content-placeholder";
import { setServiceConsent } from "./service-consent";
import { getConsentState, isConsentStorageChange } from "@/hooks/use-storage";
import { getServices, matchService } from "@/services";
import {
	hasRevocationPolicy,
	restrictOptionalRequestsUntilReload,
} from "./revocation-policy";
import { CSP_COOKIE } from "./csp";
import type { BannerConfig } from "@/types";

// Only inert markup is guaranteed to make no request before consent. A DOM
// observer cannot undo requests made by live src attributes or executed scripts.
export function startContentBlocker(config: BannerConfig): () => void {
	const activeScripts = new Map<HTMLScriptElement, HTMLScriptElement>();
	const placeholders = new Map<HTMLElement, HTMLElement>();
	let stopped = false;
	let scriptQueue = Promise.resolve();
	let serviceSignature = "";
	const sync = (event?: Event) => {
		if (stopped) return;
		if (event?.type === "storage") {
			if (!isConsentStorageChange(event as StorageEvent)) return;
			if ((event as StorageEvent).key === null)
				document.cookie = `${CSP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
			restrictOptionalRequestsUntilReload();
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
				!hasRevocationPolicy() &&
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
				const box = placeholders.get(element);
				const restoreFocus = !!box?.contains(document.activeElement);
				box?.remove();
				placeholders.delete(element);
				element.hidden = false;
				if (
					element.dataset.cbSrc &&
					element.getAttribute("src") !== element.dataset.cbSrc
				)
					element.setAttribute("src", element.dataset.cbSrc);
				if (restoreFocus) {
					if (!element.hasAttribute("tabindex")) element.tabIndex = 0;
					element.focus();
				}
				continue;
			}
			if (element.hasAttribute("src")) element.removeAttribute("src");
			element.hidden = true;
			if (placeholders.has(element)) continue;
			const service = getServices().find((service) => service.id === id);
			const box = createContentPlaceholder(
				service, id, config.lang,
				() => setServiceConsent(id, true),
				element.parentElement,
			);
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
