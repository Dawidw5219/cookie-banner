import type { TranslationSchema } from "./index";

export const de: TranslationSchema = {
	overlay: {
		title: "Wir respektieren Ihre Privatsphäre",
		description:
			"Diese Website verwendet Cookies und ähnliche Tracking-Technologien, um Ihr Surferlebnis zu verbessern, den Website-Verkehr zu analysieren und zu verstehen, woher unsere Besucher kommen. Indem Sie Ihre Präferenzen wählen, helfen Sie uns, unsere Dienste zu verbessern und gleichzeitig Ihr Recht auf Privatsphäre zu respektieren.",
		descriptionPolicyLink: "Weitere Informationen finden Sie in unserer",
		acceptAll: "Alle akzeptieren",
		advancedSettings: "Erweiterte Einstellungen",
		privacyPolicy: "Datenschutzerklärung",
		cookiePolicy: "Cookie-Richtlinie",
		andOur: "und unsere",
	},
	preferences: {
		title: "Cookie-Einstellungen",
		description:
			"Verwalten Sie unten Ihre Cookie-Einstellungen. Essenzielle Cookies sind immer aktiv, da sie für das Funktionieren der Website erforderlich sind. Sie können andere Kategorien nach Ihren Wünschen aktivieren oder deaktivieren.",
		descriptionPolicyLink: "Weitere Informationen finden Sie in unserer",
		rejectAll: "Alle ablehnen",
		save: "Speichern",
		acceptAllAndContinue: "Alle akzeptieren und fortfahren",
		categories: {
			essential: {
				label: "Essenzielle Cookies",
				description:
					"Unbedingt erforderlich für das Funktionieren der Website. Diese Cookies ermöglichen grundlegende Funktionen wie Sicherheit, Netzwerkverwaltung und Kontozugriff. Sie können nicht deaktiviert werden.",
			},
			analytics: {
				label: "Analyse-Cookies",
				description:
					"Helfen uns zu verstehen, wie Besucher auf unserer Website navigieren und mit ihr interagieren, indem anonyme Nutzungsdaten gesammelt und gemeldet werden. Dies ermöglicht es uns, die Leistung der Website und das Benutzererlebnis zu verbessern.",
			},
			marketing: {
				label: "Marketing-Cookies",
				description:
					"Werden verwendet, um personalisierte Werbung zu schalten, die Ihren Interessen entspricht, die Leistung von Werbekampagnen zu verfolgen und die Häufigkeit zu begrenzen, mit der Sie eine bestimmte Anzeige auf verschiedenen Plattformen sehen.",
			},
		},
	},
	floatingIcon: {
		label: "Cookie-Einstellungen",
	},
};
