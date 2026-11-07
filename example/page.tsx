import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  blockedContentProps,
  getConsentReceipt,
  initializeConsent,
} from "../src/api/native";
import { Scanner } from "./scanner";
import { resetConsent } from "../src/core/consent-storage";
import { SUPPORTED_LANGUAGES } from "../src/i18n";
import "./style.css";

const params = new URLSearchParams(location.search);
const lang = SUPPORTED_LANGUAGES.includes(
  params.get("lang") as (typeof SUPPORTED_LANGUAGES)[number],
)
  ? params.get("lang")!
  : "en";
const variant = params.get("variant") === "modal" ? "modal" : "bar";
const policyUrl = `${import.meta.env.BASE_URL}privacy.html`;
const previewUrl = `${location.origin}${import.meta.env.BASE_URL}preview.html`;
const services = [
  {
    id: "youtube",
    name: "Demo video",
    description: "Show a simulated video served by this demo itself.",
    privacyUrl: policyUrl,
    retention: "No tracking or provider cookies; this is local sample content.",
  },
  {
    id: "vimeo",
    name: "Demo widget",
    description: "Show a simulated widget served by this demo itself.",
    privacyUrl: policyUrl,
    retention: "No tracking or provider cookies; this is local sample content.",
  },
];

window.__cookieConsent = {
  mode: "standalone",
  lang,
  variant,
  buttonStyle: params.get("buttons") === "equal" ? "equal" : "standard",
  noticeVersion: "demo-privacy-1",
  controller: { name: "App4You — Cookie Banner demonstration" },
  purposes:
    "Demonstrate individual choices with simulated content. No real third-party providers, analytics or advertising SDKs are loaded.",
  services,
  privacyPolicyUrl: policyUrl,
  theme: { primary: "#2563eb", background: "#ffffff", text: "#1a1a1a" },
};

function changeSetting(name: string, value: string) {
  const url = new URL(location.href);
  url.searchParams.set(name, value);
  location.assign(url);
}


function Demo() {
  const [receipt, setReceipt] = useState(getConsentReceipt());
  useEffect(() => {
    const update = () => setReceipt(getConsentReceipt());
    window.addEventListener("cb:consent-update", update);
    return () => window.removeEventListener("cb:consent-update", update);
  }, []);
  return (
    <>
      <header className="demo-header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          App4You <span>Cookie Banner</span>
        </a>
        <nav>
          <a href="https://github.com/Dawidw5219/cookie-banner#quick-start">
            Quick start
          </a>
          <a href="https://www.npmjs.com/package/@app4you/cookie-banner">npm</a>
          <a href="https://github.com/Dawidw5219/cookie-banner">GitHub</a>
        </nav>
      </header>
      <main className="demo-main">
        <section className="intro">
          <h1>
            A video can wait.
            <br />
            Your choice comes first.
          </h1>
          <p>
            Try the banner with simulated content. Reject everything, then
            enable just one example. No real third-party requests or tracking
            SDKs.
          </p>
        </section>
        <section className="controls" aria-label="Demo settings">
          <label>
            Layout
            <select
              value={variant}
              onChange={(e) => changeSetting("variant", e.currentTarget.value)}
            >
              <option value="bar">Bottom bar</option>
              <option value="modal">Dialog</option>
            </select>
          </label>
          <label>
            Language
            <select
              value={lang}
              onChange={(e) => changeSetting("lang", e.currentTarget.value)}
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Buttons
            <select
              value={window.__cookieConsent?.buttonStyle}
              onChange={(e) => changeSetting("buttons", e.currentTarget.value)}
            >
              <option value="standard">Standard</option>
              <option value="equal">Equal appearance</option>
            </select>
          </label>
          <button
            onClick={() =>
              window.dispatchEvent(new Event("cb:open-preferences"))
            }
          >
            Cookie preferences
          </button>
          <button
            onClick={() => {
              resetConsent();
              location.reload();
            }}
          >
            Reset demo consent
          </button>
        </section>
        <p className="consent-status" role="status">
          {receipt
            ? "Your choices are saved on this device. You can change or withdraw them at any time."
            : "No choice saved. Optional videos stay inactive until you allow their provider."}
        </p>
        <div className="video-grid">
          {[
            {
              id: "youtube",
              name: "Demo video",
              src: `${previewUrl}?provider=youtube`,
            },
            {
              id: "vimeo",
              name: "Demo widget",
              src: `${previewUrl}?provider=vimeo`,
            },
          ].map((video) => (
            <section key={video.id} className="video-card">
              <h2>{video.name}</h2>
              <p>A local simulation. No connection to an external provider.</p>
              <iframe
                {...blockedContentProps(video.id, video.src)}
                title={`${video.name} example video`}
                width="800"
                height="450"
                style={{ width: "100%", border: 0 }}
                allowFullScreen
              />
            </section>
          ))}
        </div>
        <Scanner />
      </main>
      <footer className="demo-footer">
        <span>Self-hosted. Framework independent.</span>
        <a href={`${import.meta.env.BASE_URL}privacy.html`}>
          About this demo & privacy
        </a>
      </footer>
    </>
  );
}

const host = document.getElementById("consent-demo");
if (host) render(<Demo />, host);
initializeConsent(window.__cookieConsent).catch((error) => {
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = `Could not initialize consent: ${error instanceof Error ? error.message : String(error)}`;
  host?.prepend(message);
});
