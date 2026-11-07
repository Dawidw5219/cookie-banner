// @vitest-environment jsdom
import { consentConfig } from "../fixtures/consent-config";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installAutoBlocker } from "../../src/core/auto-blocker";
import { getRejectAllState } from "../../src/core/consent-state";
import { saveConsentState } from "../../src/core/consent-storage";

let stop: (() => void) | undefined;
beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
	window.__cookieConsent = consentConfig();
});
afterEach(() => {
	stop?.();
	document.body.replaceChildren();
	delete window.__cookieConsent;
});

describe("early compatibility guard", () => {
	it("blocks property assignments and prevents a loader from resetting script type", () => {
		stop = installAutoBlocker(window.__cookieConsent!);
		const script = document.createElement("script");
		script.src = "https://www.youtube.com/iframe_api";
		script.type = "text/javascript";
		document.head.appendChild(script);
		expect(script.hasAttribute("src")).toBe(false);
		expect(script.type).toBe("text/plain");
		expect(script.dataset.cbService).toBe("youtube");
		script.remove();
	});

	it("neutralizes nested raw HTML before it reaches a live document", () => {
		stop = installAutoBlocker(window.__cookieConsent!);
		document.body.innerHTML =
			'<div><iframe src="https://unknown.example/widget"></iframe></div>';
		expect(document.querySelector("iframe[src]")).toBeNull();
		expect(document.querySelector("iframe")?.dataset.cbService).toBe(
			"external-unknown.example",
		);
	});

	it("respects provider choice and leaves technical resources and unrelated domains intact", () => {
		saveConsentState({ ...getRejectAllState(), services: { youtube: true } });
		stop = installAutoBlocker(window.__cookieConsent!);
		const allowed = document.createElement("iframe");
		allowed.src = "https://www.youtube.com/embed/test";
		expect(allowed.hasAttribute("src")).toBe(true);
		const unrelated = document.createElement("script");
		unrelated.src = "https://site.example/app.js?youtube.com/embed/test";
		expect(unrelated.hasAttribute("src")).toBe(true);
	});
});

it("holds Google Fonts stylesheets before a provider grant", () => {
	stop = installAutoBlocker(window.__cookieConsent!);
	const stylesheet = document.createElement("link");
	stylesheet.rel = "stylesheet";
	stylesheet.href = "https://fonts.googleapis.com/css?family=Roboto";
	expect(stylesheet.hasAttribute("href")).toBe(false);
	expect(stylesheet.dataset.cbService).toBe("google-fonts");
});
