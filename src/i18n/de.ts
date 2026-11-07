import type { TranslationSchema } from "./index";

export const de: TranslationSchema = {
	policy: {
		name: "Name",
		provider: "Anbieter",
		purpose: "Zweck",
		retention: "Speicherdauer",
		category: "Kategorie",
		functional: "Funktional",
		security: "Sicherheit",
		personalization: "Personalisierung",
		other: "Sonstige",
		empty: "Es wurden noch keine Cookies erkannt.",
		uncategorized: "Keine kategorisierten Cookies gefunden.",
		functionalDescription: "Prüfen Sie, ob jedes Element für den angeforderten Dienst unbedingt erforderlich ist.",
		session: "Sitzung",
	},
	content: {
		blocked: "Blockierter externer Inhalt",
		external: "Externer Inhalt",
		videoTitle: "YouTube-Video ansehen",
		videoDescription: "Die Wiedergabe verbindet Sie mit YouTube und übermittelt Ihre IP-Adresse und Browserdaten.",
		description: "Beim Anzeigen werden Ihre IP-Adresse und Browserdaten an den Anbieter übermittelt.",
		allowPlay: "Zustimmen und abspielen",
		allowShow: "Zustimmen und anzeigen",
		privacyDetails: "Datenschutzhinweise",
		providerPrivacy: "Datenschutz des Anbieters",
	},
	disclosure: {
		unavailable: "Optionale Inhalte bleiben deaktiviert, bis die Datenschutzhinweise vollständig sind. Sie können ohne Zustimmung fortfahren.",
		retention: "Speicherdauer",
		withdraw: "Alle optionalen Einwilligungen widerrufen",
		saveError: "Die Auswahl konnte nicht gespeichert werden. Optionale Verarbeitung bleibt gesperrt.",
	},
	close: "Schließen",
	overlay: {
		title: "Wir respektieren Ihre Privatsphäre",
		description:
			"Optionale Cookies und externe Dienste werden erst nach Ihrer Einwilligung geladen. Sie können ablehnen oder Ihre Auswahl jederzeit ändern.",
		descriptionPolicyLink: "Weitere Informationen finden Sie in unserer",
		acceptAll: "Alle akzeptieren",
		acceptAllAndContinue: "Alle akzeptieren und fortfahren",
		advancedSettings: "Erweiterte Einstellungen",
		privacyPolicy: "Datenschutzerklärung",
		cookiePolicy: "Cookie-Richtlinie",
		andOur: "und unsere",
	},
	preferences: {
		externalServices: "Auf dieser Website erkannte externe Dienste",
		externalServicesDescription: "Separate Einwilligung für jeden Anbieter. Beim Laden können Ihre IP-Adresse und Browserdaten übermittelt werden.",
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
					"Helfen uns zu verstehen, wie Besucher auf unserer Website navigieren und mit ihr interagieren, indem Nutzungsdaten gesammelt und gemeldet werden. Dies ermöglicht es uns, die Leistung der Website und das Benutzererlebnis zu verbessern.",
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
