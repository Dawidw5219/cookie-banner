import { render } from "preact";
import { blockedContentProps, initializeConsent } from "./native";

const host = document.getElementById("consent-demo");
if (host)
	render(
		<section
			style={{ maxWidth: "800px", margin: "3rem auto", padding: "1rem" }}
		>
			<h2>Treści zewnętrzne — zgoda na dostawcę</h2>
			<p>
				Każda usługa ma osobną zgodę. Odmowa nie blokuje pozostałej zawartości
				strony.
			</p>
			<iframe
				{...blockedContentProps(
					"youtube",
					"https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
				)}
				title="Przykładowy film YouTube"
				width="800"
				height="450"
				style={{ width: "100%", border: 0 }}
				allowFullScreen
			/>
			<iframe
				{...blockedContentProps(
					"vimeo",
					"https://player.vimeo.com/video/76979871",
				)}
				title="Przykładowy film Vimeo"
				width="800"
				height="450"
				style={{ width: "100%", border: 0 }}
				allowFullScreen
			/>
		</section>,
		host,
	);
if (window.__cookieConsent) initializeConsent(window.__cookieConsent);
