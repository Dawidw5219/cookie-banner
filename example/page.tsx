import { render } from "preact";
import { blockedContentProps, initializeConsent } from "../src/api/native";
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
const variant = params.get("variant") === "bar" ? "bar" : "modal";
const buttonStyle = params.get("buttons") === "standard" ? "standard" : "equal";
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
    <details className="demo-options">
      <summary>Demo settings</summary>
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
        <button
          onClick={() => {
            resetConsent();
            location.reload();
          }}
        >
          Reset demo consent
        </button>
        <small>Changing a setting restarts the consent demo.</small>
      </div>
    </details>
  );
}

function Article() {
  return (
    <>
      <DemoSettings />
      <main className="article-page">
        <article>
          <header className="article-header">
            <p className="article-topic">Film & animation</p>
            <h1>
              A small film.
              <br />A whole world inside.
            </h1>
            <p className="article-lead">
              A rabbit, a quiet forest, and a little unexpected trouble.
              Sometimes a short film is all you need to step out of the
              everyday.
            </p>
            <p className="article-byline">An example article by App4You</p>
          </header>
          <p>
            There is something lovely about a story that asks for only a few
            minutes of your time. No long introduction, no series to catch up
            on. Just a place, a handful of characters, and the chance to see
            where they take you.
          </p>
          <p>
            <em>Big Buck Bunny</em>, the animated short from the Blender
            Foundation, is one of those films. Its woodland setting begins
            gently enough, before a few mischievous neighbours make life rather
            less peaceful for its oversized rabbit.
          </p>
          <h2>Make a little time for a short story.</h2>
          <p>
            You can watch the film below. The player is provided by YouTube, so
            we leave it disconnected until you choose to load it. If you would
            rather skip it, the rest of the article is still here to read.
          </p>
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
          <h2>A choice should leave room for no.</h2>
          <p>
            A film can add something to a page without being a condition for
            reading it. Saying no to an embedded player should leave the words,
            the links and the rest of the site available.
          </p>
          <p>
            That is what this page demonstrates. You can refuse optional
            services, allow YouTube when you reach the film, or change your mind
            afterwards. The cookie preferences remain available at the bottom of
            the page.
          </p>
        </article>
        <details className="scanner-disclosure">
          <summary>
            Cookie scanner <span>Inspect this page locally</span>
          </summary>
          <Scanner />
        </details>
        <footer className="article-footer">
          <button
            onClick={() =>
              window.dispatchEvent(new Event("cb:open-preferences"))
            }
          >
            Cookie preferences
          </button>
          <a href={policyUrl}>About this demo & privacy</a>
          <a href="https://github.com/Dawidw5219/cookie-banner">Source code</a>
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
