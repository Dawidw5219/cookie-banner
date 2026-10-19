/**
 * Default translation strings for each language.
 * Mirrors packages/cookie-banner/src/i18n/ files.
 * Used to pre-fill custom text fields in the admin UI.
 */

export interface TextEntry {
	key: string;
	label: string;
	group: string;
	multiline?: boolean;
}

export const TEXT_SCHEMA: TextEntry[] = [
	// Overlay
	{ key: "overlay.title", label: "Banner title", group: "Banner" },
	{ key: "overlay.description", label: "Banner description", group: "Banner", multiline: true },
	{ key: "overlay.acceptAll", label: "Accept All button", group: "Banner" },
	{ key: "overlay.advancedSettings", label: "Advanced Settings button", group: "Banner" },

	// Preferences
	{ key: "preferences.title", label: "Preferences title", group: "Preferences" },
	{
		key: "preferences.description",
		label: "Preferences description",
		group: "Preferences",
		multiline: true,
	},
	{ key: "preferences.rejectAll", label: "Reject All button", group: "Preferences" },
	{ key: "preferences.save", label: "Save button", group: "Preferences" },
	{
		key: "preferences.acceptAllAndContinue",
		label: "Accept All & Continue button",
		group: "Preferences",
	},

	// Category labels
	{ key: "preferences.categories.essential.label", label: "Essential label", group: "Categories" },
	{
		key: "preferences.categories.essential.description",
		label: "Essential description",
		group: "Categories",
		multiline: true,
	},
	{ key: "preferences.categories.analytics.label", label: "Analytics label", group: "Categories" },
	{
		key: "preferences.categories.analytics.description",
		label: "Analytics description",
		group: "Categories",
		multiline: true,
	},
	{ key: "preferences.categories.marketing.label", label: "Marketing label", group: "Categories" },
	{
		key: "preferences.categories.marketing.description",
		label: "Marketing description",
		group: "Categories",
		multiline: true,
	},

	// Floating icon
	{ key: "floatingIcon.label", label: "Floating icon tooltip", group: "Other" },
];

/** Get a nested value from an object by dot-notation key. */
function getByPath(obj: Record<string, unknown>, path: string): string {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (current == null || typeof current !== "object") return "";
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === "string" ? current : "";
}

// Inline default translations for each language (subset of banner i18n).
const DEFAULTS: Record<string, Record<string, unknown>> = {
	en: {
		overlay: {
			title: "We value your privacy",
			description: "We use cookies to personalize content and ads based on your interests. By browsing our site, you consent to their use and accept our",
			acceptAll: "Accept All",
			advancedSettings: "Advanced Settings",
		},
		preferences: {
			title: "Cookie Preferences",
			description: "Manage your cookie preferences below. Essential cookies are always active as they are necessary for the website to function.",
			rejectAll: "Reject All",
			save: "Save",
			acceptAllAndContinue: "Accept All & Continue",
			categories: {
				essential: { label: "Essential Cookies", description: "Strictly necessary for the website to function." },
				analytics: { label: "Analytics Cookies", description: "Help us understand how visitors navigate our website." },
				marketing: { label: "Marketing Cookies", description: "Used to deliver personalized advertisements." },
			},
		},
		floatingIcon: { label: "Cookie preferences" },
	},
	pl: {
		overlay: {
			title: "Szanujemy Twoją prywatność",
			description: "Korzystamy z plików cookies, aby dostosować treści i reklamy do Twoich zainteresowań. Przeglądając naszą stronę, wyrażasz zgodę na ich użycie oraz akceptujesz naszą",
			acceptAll: "Zaakceptuj wszystkie",
			advancedSettings: "Ustawienia zaawansowane",
		},
		preferences: {
			title: "Preferencje plików cookie!",
			description: "Zarządzaj swoimi preferencjami dotyczącymi plików cookie poniżej. Niezbędne pliki cookie są zawsze aktywne.",
			rejectAll: "Odrzuć wszystkie",
			save: "Zapisz",
			acceptAllAndContinue: "Zaakceptuj wszystkie i kontynuuj",
			categories: {
				essential: { label: "Niezbędne pliki cookie", description: "Ściśle niezbędne do działania strony." },
				analytics: { label: "Analityczne pliki cookie", description: "Pomagają zrozumieć, jak użytkownicy poruszają się po stronie." },
				marketing: { label: "Marketingowe pliki cookie", description: "Służą do wyświetlania spersonalizowanych reklam." },
			},
		},
		floatingIcon: { label: "Preferencje cookie" },
	},
	de: {
		overlay: {
			title: "Wir respektieren Ihre Privatsphäre",
			description: "Wir verwenden Cookies, um Inhalte und Anzeigen zu personalisieren. Durch das Surfen auf unserer Website stimmen Sie deren Verwendung zu und akzeptieren unsere",
			acceptAll: "Alle akzeptieren",
			advancedSettings: "Erweiterte Einstellungen",
		},
		preferences: {
			title: "Cookie-Einstellungen",
			description: "Verwalten Sie Ihre Cookie-Einstellungen. Erforderliche Cookies sind immer aktiv.",
			rejectAll: "Alle ablehnen",
			save: "Speichern",
			acceptAllAndContinue: "Alle akzeptieren & fortfahren",
			categories: {
				essential: { label: "Erforderliche Cookies", description: "Für die Funktion der Website unbedingt erforderlich." },
				analytics: { label: "Analyse-Cookies", description: "Helfen uns zu verstehen, wie Besucher unsere Website nutzen." },
				marketing: { label: "Marketing-Cookies", description: "Werden zur Bereitstellung personalisierter Werbung verwendet." },
			},
		},
		floatingIcon: { label: "Cookie-Einstellungen" },
	},
	fr: {
		overlay: {
			title: "Nous respectons votre vie privée",
			description: "Nous utilisons des cookies pour personnaliser le contenu et les publicités. En parcourant notre site, vous consentez à leur utilisation et acceptez notre",
			acceptAll: "Tout accepter",
			advancedSettings: "Paramètres avancés",
		},
		preferences: {
			title: "Préférences cookies",
			description: "Gérez vos préférences cookies ci-dessous. Les cookies essentiels sont toujours actifs.",
			rejectAll: "Tout refuser",
			save: "Enregistrer",
			acceptAllAndContinue: "Tout accepter et continuer",
			categories: {
				essential: { label: "Cookies essentiels", description: "Strictement nécessaires au fonctionnement du site." },
				analytics: { label: "Cookies analytiques", description: "Nous aident à comprendre comment les visiteurs utilisent le site." },
				marketing: { label: "Cookies marketing", description: "Utilisés pour diffuser des publicités personnalisées." },
			},
		},
		floatingIcon: { label: "Préférences cookies" },
	},
	es: {
		overlay: {
			title: "Valoramos su privacidad",
			description: "Utilizamos cookies para personalizar contenido y anuncios. Al navegar por nuestro sitio, acepta su uso y nuestra",
			acceptAll: "Aceptar todo",
			advancedSettings: "Configuración avanzada",
		},
		preferences: {
			title: "Preferencias de cookies",
			description: "Gestione sus preferencias de cookies. Las cookies esenciales están siempre activas.",
			rejectAll: "Rechazar todo",
			save: "Guardar",
			acceptAllAndContinue: "Aceptar todo y continuar",
			categories: {
				essential: { label: "Cookies esenciales", description: "Estrictamente necesarias para el funcionamiento del sitio." },
				analytics: { label: "Cookies analíticas", description: "Nos ayudan a entender cómo los visitantes usan el sitio." },
				marketing: { label: "Cookies de marketing", description: "Se utilizan para mostrar anuncios personalizados." },
			},
		},
		floatingIcon: { label: "Preferencias de cookies" },
	},
	it: {
		overlay: {
			title: "Rispettiamo la tua privacy",
			description: "Utilizziamo cookie per personalizzare contenuti e annunci. Navigando nel nostro sito, acconsenti al loro utilizzo e accetti la nostra",
			acceptAll: "Accetta tutto",
			advancedSettings: "Impostazioni avanzate",
		},
		preferences: {
			title: "Preferenze cookie",
			description: "Gestisci le tue preferenze cookie. I cookie essenziali sono sempre attivi.",
			rejectAll: "Rifiuta tutto",
			save: "Salva",
			acceptAllAndContinue: "Accetta tutto e continua",
			categories: {
				essential: { label: "Cookie essenziali", description: "Strettamente necessari per il funzionamento del sito." },
				analytics: { label: "Cookie analitici", description: "Ci aiutano a capire come i visitatori utilizzano il sito." },
				marketing: { label: "Cookie di marketing", description: "Utilizzati per fornire annunci personalizzati." },
			},
		},
		floatingIcon: { label: "Preferenze cookie" },
	},
};

/** Get default text for a given language and key path. */
export function getDefaultText(lang: string, key: string): string {
	const langData = DEFAULTS[lang] || DEFAULTS.en;
	return getByPath(langData, key);
}

/** Get all defaults for a language as flat key-value pairs. */
export function getLanguageDefaults(lang: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const entry of TEXT_SCHEMA) {
		result[entry.key] = getDefaultText(lang, entry.key);
	}
	return result;
}
