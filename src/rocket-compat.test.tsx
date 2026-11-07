// @vitest-environment jsdom
import { consentConfig } from "./test/consent-config";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

let teardown: (() => void) | undefined;
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const button = (text: string) => {
  const host = document.getElementById("cookie-consent-host");
  const found = [...host!.shadowRoot!.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
};

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.body.replaceChildren();
  window.__cookieConsent = consentConfig({
    mode: "standalone",
    variant: "modal",
    lang: "en",
    useCustomSettingsLink: true,
  });
  // WP Rocket queues user-event listeners until all delayed scripts finish.
  const original = EventTarget.prototype.addEventListener;
  vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(
    function (this: EventTarget, type, listener, options) {
      if (
        type === "click" &&
        !(
          typeof options === "object" &&
          (options as AddEventListenerOptions & { isRocket?: boolean }).isRocket
        )
      )
        return;
      original.call(this, type, listener, options);
    },
  );
});
afterEach(() => {
  teardown?.();
  vi.restoreAllMocks();
  delete window.__cookieConsent;
});

it.each(["modal", "bar"] as const)(
  "accepts immediately in %s while Rocket delays scripts",
  async (variant) => {
    window.__cookieConsent!.variant = variant;
    ({ teardown } = await import("./app"));
    button("Accept All").click();
    await settle();
    expect(localStorage.getItem("cb_has_consented")).toBe("1");
    expect(localStorage.getItem("cb_consent_analytics")).toBe("granted");
    expect(
      document
        .getElementById("cookie-consent-host")!
        .shadowRoot!.querySelector("button[aria-label=\"Cookie preferences\"]"),
    ).not.toBeNull();
  },
);

it("opens preferences, changes a category and saves before delayed scripts finish", async () => {
  ({ teardown } = await import("./app"));
  button("Advanced Settings").click();
  await settle();
  const analytics = document
    .getElementById("cookie-consent-host")!
    .shadowRoot!.querySelector<HTMLButtonElement>("#cb-toggle-analytics")!;
  expect(analytics).not.toBeNull();
  analytics.click();
  await settle();
  button("Save").click();
  await settle();
  expect(localStorage.getItem("cb_consent_analytics")).toBe("granted");
  expect(localStorage.getItem("cb_consent_marketing")).toBe("denied");
});

it("rejects optional categories before delayed scripts finish", async () => {
  ({ teardown } = await import("./app"));
  button("Advanced Settings").click();
  await settle();
  button("Reject All").click();
  await settle();
  expect(localStorage.getItem("cb_has_consented")).toBe("1");
  expect(localStorage.getItem("cb_consent_analytics")).toBe("denied");
  expect(localStorage.getItem("cb_consent_marketing")).toBe("denied");
});

it("reopens preferences from a policy link while scripts remain delayed", async () => {
  localStorage.setItem("cb_has_consented", "1");
  const link = document.createElement("a");
  link.href = "#";
  link.className = "open-consent-settings";
  link.textContent = "Manage privacy settings";
  document.body.append(link);
  ({ teardown } = await import("./app"));
  await new Promise((resolve) => setTimeout(resolve, 150));
  link.click();
  await settle();
  expect(button("Reject All")).toBeDefined();
});
