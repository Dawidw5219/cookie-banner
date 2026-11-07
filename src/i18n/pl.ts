import type { TranslationSchema } from "./index";

export const pl: TranslationSchema = {
	policy: {
		name: "Nazwa",
		provider: "Dostawca",
		purpose: "Cel",
		retention: "Przechowywanie",
		category: "Kategoria",
		functional: "Funkcjonalne",
		security: "Bezpieczeństwo",
		personalization: "Personalizacja",
		other: "Pozostałe",
		empty: "Nie wykryto jeszcze plików cookie.",
		uncategorized: "Nie znaleziono sklasyfikowanych plików cookie.",
		functionalDescription: "Sprawdź, czy każdy element jest ściśle niezbędny do żądanej usługi.",
		session: "Sesja",
	},
	content: {
		blocked: "Zablokowana treść zewnętrzna",
		external: "Treść zewnętrzna",
		videoTitle: "Obejrzyj film z YouTube",
		videoDescription: "Odtworzenie połączy Cię z YouTube i udostępni dostawcy Twój adres IP oraz dane przeglądarki.",
		description: "Wyświetlenie treści udostępni dostawcy Twój adres IP i dane przeglądarki.",
		allowPlay: "Zgadzam się — odtwórz",
		allowShow: "Zgadzam się — pokaż",
		privacyDetails: "Informacje o prywatności",
		providerPrivacy: "Prywatność dostawcy",
	},
	disclosure: {
		unavailable: "Treści opcjonalne pozostają wyłączone do czasu uzupełnienia informacji o prywatności. Możesz korzystać ze strony bez zgody.",
		retention: "Przechowywanie danych",
		withdraw: "Wycofaj wszystkie opcjonalne zgody",
		saveError: "Nie udało się zapisać wyboru. Opcjonalne przetwarzanie pozostaje zablokowane.",
	},
	close: "Zamknij",
	overlay: {
		title: "Szanujemy Twoją prywatność",
		description:
			"Opcjonalne cookies i usługi zewnętrzne uruchamiamy dopiero po Twojej zgodzie. Możesz odmówić lub zmienić wybór w dowolnym momencie.",
		descriptionPolicyLink: "Zobacz naszą",
		acceptAll: "Zaakceptuj wszystkie",
		advancedSettings: "Ustawienia zaawansowane",
		privacyPolicy: "politykę prywatności",
		cookiePolicy: "politykę cookies",
		andOur: "oraz naszą",
	},
	preferences: {
		externalServices: "Usługi zewnętrzne wykryte na tej witrynie",
		externalServicesDescription: "Osobna zgoda na każdego dostawcę. Włączenie może przekazać mu Twój adres IP i dane przeglądarki.",
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
					"Pomagają nam zrozumieć, w jaki sposób odwiedzający poruszają się po naszej stronie i wchodzą z nią w interakcję, zbierając i raportując dane o użytkowaniu. Pozwala nam to poprawić wydajność strony i doświadczenie użytkownika.",
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
