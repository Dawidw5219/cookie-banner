// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startContentBlocker } from "./content-blocker";
import {
	applyConsent,
	getAcceptAllState,
	getRejectAllState,
} from "./hooks/use-consent";
import {
	getConsentState,
	hasConsented,
	saveConsentState,
} from "./hooks/use-storage";

let stop: (() => void) | undefined;
const config = { mode: "standalone", lang: "pl" } as const;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
});
afterEach(() => {
	stop?.();
	document.body.replaceChildren();
});

describe("per-service content consent", () => {
	it("makes no iframe URL live before consent and grants only the chosen provider", async () => {
		document.body.innerHTML =
			'<iframe hidden title="YouTube" data-cb-service="youtube" data-cb-src="https://www.youtube-nocookie.com/embed/test"></iframe><iframe hidden title="Vimeo" data-cb-service="vimeo" data-cb-src="https://player.vimeo.com/video/test"></iframe>';
		stop = startContentBlocker(config);
		expect(document.querySelectorAll("iframe[src]")).toHaveLength(0);
		expect(document.querySelectorAll(".cb-content-placeholder")).toHaveLength(
			2,
		);
		document
			.querySelector<HTMLButtonElement>(".cb-content-placeholder button")!
			.click();
		await settle();
		expect(document.querySelector("iframe[src]")?.getAttribute("title")).toBe(
			"YouTube",
		);
		expect(document.querySelectorAll(".cb-content-placeholder")).toHaveLength(
			1,
		);
		expect(getConsentState()).toMatchObject({
			analytics: false,
			marketing: false,
			services: { youtube: true },
		});
		saveConsentState(getRejectAllState());
		window.dispatchEvent(
			new CustomEvent("cb:consent-update", { detail: getRejectAllState() }),
		);
		expect(document.querySelectorAll("iframe[src]")).toHaveLength(0);
		expect(document.querySelectorAll(".cb-content-placeholder")).toHaveLength(
			2,
		);
	});

	it("protects dynamically inserted inert components and removes orphan placeholders", async () => {
		stop = startContentBlocker(config);
		const component = document.createElement("div");
		component.dataset.cbService = "external-example.org";
		document.body.append(component);
		await settle();
		expect(component.hidden).toBe(true);
		expect(
			document.querySelector(".cb-content-placeholder strong")?.textContent,
		).toBe("example.org");
		component.remove();
		await settle();
		expect(document.querySelector(".cb-content-placeholder")).toBeNull();
	});

	it("loads scripts once, in order, and only for the specific service", async () => {
		document.body.innerHTML =
			'<script type="text/plain" data-cb-service="youtube" data-cb-src="https://www.youtube.com/iframe_api"></script><script type="text/plain" data-cb-service="youtube">window.playerReady = true;</script><script type="text/plain" data-cb-service="vimeo" data-cb-src="https://player.vimeo.com/api/player.js"></script>';
		stop = startContentBlocker(config);
		expect(document.querySelectorAll("script[src]")).toHaveLength(0);
		applyConsent(config, {
			...getRejectAllState(),
			services: { youtube: true },
		});
		await settle();
		const script = document.querySelector("script[src]")!;
		expect(script.getAttribute("src")).toBe(
			"https://www.youtube.com/iframe_api",
		);
		expect(
			document.querySelectorAll('script:not([type="text/plain"])'),
		).toHaveLength(1);
		script.dispatchEvent(new Event("load"));
		await settle();
		expect(
			document.querySelectorAll('script:not([type="text/plain"])'),
		).toHaveLength(2);
		applyConsent(config, {
			...getRejectAllState(),
			services: { youtube: true },
		});
		await settle();
		expect(
			document.querySelectorAll('script:not([type="text/plain"])'),
		).toHaveLength(2);
	});

	it("honours returning visitors and keeps category consent separate from provider consent", () => {
		document.body.innerHTML =
			'<iframe data-cb-service="youtube" data-cb-src="https://www.youtube.com/embed/test"></iframe>';
		saveConsentState({ essential: true, analytics: true, marketing: true });
		stop = startContentBlocker(config);
		expect(document.querySelector("iframe")!.hasAttribute("src")).toBe(false);
		applyConsent(config, getAcceptAllState());
		expect(document.querySelector("iframe")!.hasAttribute("src")).toBe(true);
	});

	it("expires old, invalid and legacy consent without treating it as a new opt-in", () => {
		localStorage.setItem("cb_has_consented", "1");
		expect(hasConsented()).toBe(false);
		saveConsentState(getAcceptAllState());
		expect(hasConsented()).toBe(true);
		const record = JSON.parse(localStorage.getItem("cb_consent_record")!);
		record.at = Date.now() - 181 * 86400000;
		localStorage.setItem("cb_consent_record", JSON.stringify(record));
		expect(getConsentState()).toEqual(getRejectAllState());
		localStorage.setItem("cb_consent_record", "{invalid");
		expect(hasConsented()).toBe(false);
	});
});

it("restores an external script after jQuery removed its temporary type", async () => {
	document.body.innerHTML =
		'<script data-cb-service="youtube" data-cb-src="https://www.youtube.com/iframe_api" data-cb-type="true/text/plain"></script>';
	stop = startContentBlocker(config);
	applyConsent(config, { ...getRejectAllState(), services: { youtube: true } });
	await settle();
	expect(document.querySelector<HTMLScriptElement>("script[src]")?.type).toBe(
		"text/javascript",
	);
});
