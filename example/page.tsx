import { render } from "preact";
import { blockedContentProps, initializeConsent } from "../src/api/native";
import { resetConsent } from "../src/core/consent-storage";
import { SUPPORTED_LANGUAGES } from "../src/i18n";
import "./style.css";

const params = new URLSearchParams(location.search);
const lang = SUPPORTED_LANGUAGES.includes(
  params.get("lang") as (typeof SUPPORTED_LANGUAGES)[number],
)
  ? params.get("lang")!
  : "en";
const variant = params.get("variant") === "bar" ? "bar" : "modal";
const buttonStyle = params.get("buttons") === "equal" ? "equal" : "standard";
const policyUrl = `${import.meta.env.BASE_URL}privacy.html`;

window.__cookieConsent = {
  mode: "standalone",
  lang,
  variant,
  buttonStyle,
  noticeVersion: "demo-privacy-2",
  controller: { name: "App4You" },
  purposes:
    "Play the YouTube film embedded in this article after your consent.",
  services: [
    {
      id: "youtube",
      name: "YouTube",
      description:
        "Play the Big Buck Bunny film using YouTube’s embedded player. Loading it connects your browser to Google / YouTube.",
      privacyUrl: "https://policies.google.com/privacy",
      retention:
        "According to Google’s data retention policy and your YouTube account settings.",
    },
  ],
  privacyPolicyUrl: policyUrl,
  theme: { primary: "#2563eb", background: "#ffffff", text: "#1a1a1a" },
};

function changeSetting(name: string, value: string) {
  const url = new URL(location.href);
  url.searchParams.set(name, value);
  resetConsent();
  location.assign(url);
}

function DemoSettings() {
  return (
    <aside className="demo-options" aria-label="Demo settings">
      <div className="settings-heading">
        <h2>Demo settings</h2>
        <button
          onClick={() => {
            resetConsent();
            location.reload();
          }}
        >
          Reset consent
        </button>
      </div>
      <div className="settings-panel">
        <label>
          Layout
          <select
            aria-label="Layout"
            value={variant}
            onChange={(e) => changeSetting("variant", e.currentTarget.value)}
          >
            <option value="modal">Dialog</option>
            <option value="bar">Bottom bar</option>
          </select>
        </label>
        <label>
          Decision buttons
          <select
            aria-label="Decision buttons"
            value={buttonStyle}
            onChange={(e) => changeSetting("buttons", e.currentTarget.value)}
          >
            <option value="equal">Equal appearance</option>
            <option value="standard">Standard</option>
          </select>
        </label>
        <label>
          Language
          <select
            aria-label="Language"
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
      </div>
    </aside>
  );
}

function Article() {
  return (
    <>
      <DemoSettings />
      <main className="article-page">
        <article>
          <header className="article-header">
            <h1>Big Buck Bunny</h1>
            <p className="article-lead">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </header>
          <figure className="article-film">
            <iframe
              {...blockedContentProps(
                "youtube",
                "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
              )}
              title="Big Buck Bunny — Blender Foundation short film"
              width="800"
              height="450"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
            <figcaption>
              Big Buck Bunny · Blender Foundation.{" "}
              <a
                href="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on YouTube
              </a>
            </figcaption>
          </figure>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
            vitae justo eget magna fermentum iaculis. Aenean euismod elementum
            nisi, quis eleifend quam adipiscing vitae.
          </p>
          <h2>Lorem ipsum dolor sit amet</h2>
          <p>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
        </article>
        <footer className="article-footer">
          <button
            onClick={() =>
              window.dispatchEvent(new Event("cb:open-preferences"))
            }
          >
            Cookie preferences
          </button>
        </footer>
      </main>
    </>
  );
}

const host = document.getElementById("consent-demo");
if (host) render(<Article />, host);
initializeConsent(window.__cookieConsent).catch((error) => {
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = `Could not initialize consent: ${error instanceof Error ? error.message : String(error)}`;
  host?.prepend(message);
});
