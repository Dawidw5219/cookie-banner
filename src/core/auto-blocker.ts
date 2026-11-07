import { getConsentState } from "./consent-storage";
import { matchService } from "./services";
import type { BannerConfig } from "../types";

/** Synchronous guard for common dynamic loaders; not a replacement for inert SSR HTML. */
export function installAutoBlocker(config: BannerConfig): () => void {
	const restore: (() => void)[] = [];
	const setAttribute = Element.prototype.setAttribute;
	const removeAttribute = Element.prototype.removeAttribute;
	function block(element: Element, attribute: string, value: string): boolean {
		if (element.tagName === "IMG" && attribute === "srcset") {
			const candidates = value
				.split(",")
				.map((candidate) => candidate.trim().split(/\s+/)[0]);
			const services = candidates
				.map((url) => ({ url, service: matchService(url) }))
				.filter(
					(item) =>
						item.service &&
						item.service.requiresConsent !== false &&
						!item.service.id.startsWith("external-"),
				);
			const denied = services.find(
				(item) =>
					config.auditMode ||
					getConsentState().services?.[item.service!.id] !== true,
			);
			if (denied) {
				block(element, "src", denied.url);
				setAttribute.call(element, "data-cb-srcset", value);
				setAttribute.call(
					element,
					"data-cb-required",
					JSON.stringify([
						...new Set(services.map((item) => item.service!.id)),
					]),
				);
				removeAttribute.call(element, "srcset");
				return true;
			}
			return false;
		}
		if (element.tagName === "SCRIPT" && attribute === "type") {
			const id = element.getAttribute("data-cb-service");
			if (
				id &&
				(config.auditMode || getConsentState().services?.[id] !== true)
			) {
				if (value !== "text/plain")
					setAttribute.call(element, "data-cb-type", value);
				setAttribute.call(element, "type", "text/plain");
				return true;
			}
		}
		if (!["src", "href"].includes(attribute)) return false;
		if (!["SCRIPT", "IFRAME", "IMG", "LINK"].includes(element.tagName))
			return false;
		if (
			element.tagName === "LINK" &&
			![
				"stylesheet",
				"preconnect",
				"dns-prefetch",
				"preload",
				"modulepreload",
				"prefetch",
			].includes(element.getAttribute("rel") || "")
		)
			return false;
		const service = matchService(value);
		if (
			!service ||
			(service.requiresConsent === false && element.tagName !== "IFRAME")
		)
			return false;
		// Unclassified scripts/CDNs are reported for review, not guessed to be trackers.
		if (service.id.startsWith("external-") && element.tagName !== "IFRAME")
			return false;
		if (
			config.auditMode !== true &&
			getConsentState().services?.[service.id] === true
		)
			return false;
		setAttribute.call(element, "data-cb-service", service.id);
		setAttribute.call(element, "data-cb-src", value);
		removeAttribute.call(element, attribute);
		if (element.tagName === "SCRIPT") {
			const type = element.getAttribute("type");
			if (type !== "text/plain")
				setAttribute.call(element, "data-cb-type", type || "text/javascript");
			setAttribute.call(element, "type", "text/plain");
		} else if (element.tagName !== "LINK")
			setAttribute.call(element, "hidden", "");
		return true;
	}
	function prepare(node: Node) {
		if (!(node instanceof Element || node instanceof DocumentFragment)) return;
		const elements = [
			...node.querySelectorAll("script[src],iframe[src],img[src],link[href]"),
		];
		if (node instanceof Element) elements.unshift(node);
		for (const element of elements) {
			if (
				element.tagName === "SCRIPT" &&
				element.hasAttribute("data-cb-service")
			)
				block(
					element,
					"type",
					element.getAttribute("type") || "text/javascript",
				);
			const attribute = element.tagName === "LINK" ? "href" : "src";
			const value = element.getAttribute(attribute);
			if (value) block(element, attribute, value);
		}
	}
	function patchProperty(prototype: object, property: string) {
		const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
		if (!descriptor?.set || !descriptor.configurable) return;
		Object.defineProperty(prototype, property, {
			...descriptor,
			set(this: Element, value: string) {
				if (!block(this, property, String(value)))
					descriptor.set!.call(this, value);
			},
		});
		restore.push(() => Object.defineProperty(prototype, property, descriptor));
	}
	patchProperty(HTMLScriptElement.prototype, "src");
	patchProperty(HTMLScriptElement.prototype, "type");
	patchProperty(HTMLIFrameElement.prototype, "src");
	patchProperty(HTMLImageElement.prototype, "src");
	patchProperty(HTMLImageElement.prototype, "srcset");
	patchProperty(HTMLLinkElement.prototype, "href");
	const wrappedSetAttribute = function (
		this: Element,
		name: string,
		value: string,
	) {
		if (!block(this, name.toLowerCase(), String(value)))
			setAttribute.call(this, name, value);
	};
	Element.prototype.setAttribute = wrappedSetAttribute;
	restore.push(() => {
		if (Element.prototype.setAttribute === wrappedSetAttribute)
			Element.prototype.setAttribute = setAttribute;
	});
	const setAttributeNS = Element.prototype.setAttributeNS;
	Element.prototype.setAttributeNS = function (namespace, name, value) {
		if (namespace === null && block(this, name.toLowerCase(), String(value)))
			return;
		setAttributeNS.call(this, namespace, name, value);
	};
	restore.push(() => {
		Element.prototype.setAttributeNS = setAttributeNS;
	});
	const appendChild = Node.prototype.appendChild;
	const insertBefore = Node.prototype.insertBefore;
	const replaceChild = Node.prototype.replaceChild;
	Node.prototype.appendChild = function <T extends Node>(node: T): T {
		prepare(node);
		return appendChild.call(this, node) as T;
	};
	Node.prototype.insertBefore = function <T extends Node>(
		node: T,
		reference: Node | null,
	): T {
		prepare(node);
		return insertBefore.call(this, node, reference) as T;
	};
	Node.prototype.replaceChild = function <T extends Node>(
		node: Node,
		old: T,
	): T {
		prepare(node);
		return replaceChild.call(this, node, old) as T;
	};
	restore.push(() => {
		Node.prototype.appendChild = appendChild;
		Node.prototype.insertBefore = insertBefore;
		Node.prototype.replaceChild = replaceChild;
	});
	const innerHTML = Object.getOwnPropertyDescriptor(
		Element.prototype,
		"innerHTML",
	);
	const sanitizeHTML = (html: string) => {
		const template = document.createElement("template");
		innerHTML!.set!.call(template, html);
		prepare(template.content);
		return innerHTML!.get!.call(template) as string;
	};
	if (innerHTML?.set && innerHTML.get && innerHTML.configurable) {
		Object.defineProperty(Element.prototype, "innerHTML", {
			...innerHTML,
			set(this: Element, html: string) {
				const skip = ["SCRIPT", "STYLE", "TEMPLATE", "TEXTAREA"].includes(
					this.tagName,
				);
				innerHTML.set!.call(this, skip ? html : sanitizeHTML(html));
			},
		});
		restore.push(() =>
			Object.defineProperty(Element.prototype, "innerHTML", innerHTML),
		);
		const insertAdjacentHTML = Element.prototype.insertAdjacentHTML;
		Element.prototype.insertAdjacentHTML = function (
			position: InsertPosition,
			html: string,
		) {
			insertAdjacentHTML.call(this, position, sanitizeHTML(html));
		};
		restore.push(() => {
			Element.prototype.insertAdjacentHTML = insertAdjacentHTML;
		});
	}
	if (innerHTML?.set && innerHTML.get) {
		for (const [prototype, name] of [
			[Element.prototype, "outerHTML"],
			[ShadowRoot.prototype, "innerHTML"],
			[HTMLIFrameElement.prototype, "srcdoc"],
		] as const) {
			const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
			if (!descriptor?.set || !descriptor.configurable) continue;
			Object.defineProperty(prototype, name, {
				...descriptor,
				set(html: string) {
					descriptor.set!.call(this, sanitizeHTML(html));
				},
			});
			restore.push(() => Object.defineProperty(prototype, name, descriptor));
		}
		const contextualFragment = Range.prototype.createContextualFragment;
		Range.prototype.createContextualFragment = function (html) {
			return contextualFragment.call(this, sanitizeHTML(html));
		};
		restore.push(() => {
			Range.prototype.createContextualFragment = contextualFragment;
		});
	}
	const deniedRequest = (url: string) => {
		const service = matchService(url);
		if (
			!service ||
			service.id.startsWith("external-") ||
			service.requiresConsent === false ||
			(!config.auditMode && getConsentState().services?.[service.id] === true)
		)
			return false;
		const observed = (config.detectedServices ||= []);
		if (!observed.includes(service.id)) observed.push(service.id);
		window.dispatchEvent(new Event("cb:services-changed"));
		window.dispatchEvent(
			new CustomEvent("cb:request-blocked", {
				detail: { service: service.id },
			}),
		);
		return true;
	};
	const guardedRealms = new WeakSet<Window>();
	function guardRequests(realm: Window & typeof globalThis) {
		if (guardedRealms.has(realm)) return;
		guardedRealms.add(realm);
		const nativeFetch = realm.fetch;
		if (nativeFetch) {
			realm.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
				const url =
					typeof input === "string"
						? input
						: input instanceof URL
							? input.href
							: input.url;
				if (deniedRequest(url))
					return Promise.reject(
						new TypeError("External request requires consent"),
					);
				return nativeFetch.call(this, input, init);
			};
			restore.push(() => {
				realm.fetch = nativeFetch;
			});
		}
		const open = realm.XMLHttpRequest.prototype.open;
		const guardedOpen = function (
			this: XMLHttpRequest,
			method: string,
			url: string | URL,
			...args: unknown[]
		) {
			if (deniedRequest(String(url)))
				throw new DOMException(
					"External request requires consent",
					"SecurityError",
				);
			Reflect.apply(open, this, [method, url, ...args]);
		} as typeof open;
		realm.XMLHttpRequest.prototype.open = guardedOpen;
		restore.push(() => {
			realm.XMLHttpRequest.prototype.open = open;
		});
		const beacon = realm.navigator.sendBeacon;
		if (beacon) {
			realm.navigator.sendBeacon = function (
				url: string | URL,
				data?: BodyInit | null,
			) {
				return deniedRequest(String(url))
					? false
					: beacon.call(this, url, data);
			};
			restore.push(() => {
				realm.navigator.sendBeacon = beacon;
			});
		}
	}
	guardRequests(window);
	const contentWindow = Object.getOwnPropertyDescriptor(
		HTMLIFrameElement.prototype,
		"contentWindow",
	);
	if (contentWindow?.get && contentWindow.configurable) {
		Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
			...contentWindow,
			get() {
				const child = contentWindow.get!.call(this);
				try {
					if (child) guardRequests(child);
				} catch {
					/* Cross-origin frames are isolated by the browser. */
				}
				return child;
			},
		});
		restore.push(() =>
			Object.defineProperty(
				HTMLIFrameElement.prototype,
				"contentWindow",
				contentWindow,
			),
		);
	}
	return () => {
		for (const undo of restore.reverse()) undo();
	};
}
