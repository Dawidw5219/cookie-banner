import type { TranslationSchema } from "./index";

export const pl: TranslationSchema = {
	overlay: {
		title: "Szanujemy Twoją prywatność",
		description:
			"Korzystamy z plików cookies, aby dostosować treści i reklamy do Twoich zainteresowań. Przeglądając naszą stronę, wyrażasz zgodę na ich użycie oraz akceptujesz naszą",
		descriptionPolicyLink: "",
		acceptAll: "Zaakceptuj wszystkie",
		advancedSettings: "Ustawienia zaawansowane",
		privacyPolicy: "politykę prywatności",
		cookiePolicy: "politykę cookies",
		andOur: "oraz naszą",
	},
	preferences: {
		title: "Preferencje plików cookie",
		description:
			"Zarządzaj swoimi preferencjami dotyczącymi plików cookie poniżej. Niezbędne pliki cookie są zawsze aktywne, ponieważ są konieczne do prawidłowego działania strony. Możesz włączyć lub wyłączyć pozostałe kategorie według swoich preferencji.",
		descriptionPolicyLink: "Więcej informacji znajdziesz w naszej",
		rejectAll: "Odrzuć wszystkie",
		save: "Zapisz ustawienia",
		acceptAllAndContinue: "Zaakceptuj wszystkie",
		categories: {
			essential: {
				label: "Niezbędne pliki cookie",
				description:
					"Ściśle niezbędne do działania strony. Te pliki cookie umożliwiają podstawowe funkcje, takie jak bezpieczeństwo, zarządzanie siecią i dostęp do konta. Nie mogą zostać wyłączone.",
			},
			analytics: {
				label: "Analityczne pliki cookie",
				description:
					"Pomagają nam zrozumieć, w jaki sposób odwiedzający poruszają się po naszej stronie i wchodzą z nią w interakcję, zbierając i raportując anonimowe dane o użytkowaniu. Pozwala nam to poprawić wydajność strony i doświadczenie użytkownika.",
			},
			marketing: {
				label: "Marketingowe pliki cookie",
				description:
					"Służą do wyświetlania spersonalizowanych reklam odpowiednich do Twoich zainteresowań, śledzenia skuteczności kampanii reklamowych i ograniczania liczby wyświetleń danej reklamy na różnych platformach.",
			},
		},
	},
	floatingIcon: {
		label: "Preferencje plików cookie",
	},
};
