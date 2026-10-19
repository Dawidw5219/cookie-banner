import type { TranslationSchema } from "./index";

export const sv: TranslationSchema = {
	overlay: {
		title: "Vi respekterar din integritet",
		description:
			"Den här webbplatsen använder cookies och liknande spårningsteknik för att förbättra din webbupplevelse, analysera trafiken på webbplatsen och förstå var våra besökare kommer ifrån. Genom att välja dina inställningar hjälper du oss att förbättra våra tjänster samtidigt som vi respekterar din rätt till integritet.",
		descriptionPolicyLink: "Mer information finns i vår",
		acceptAll: "Godkänn alla",
		advancedSettings: "Avancerade inställningar",
		privacyPolicy: "integritetspolicy",
		cookiePolicy: "cookiepolicy",
		andOur: "och vår",
	},
	preferences: {
		title: "Cookieinställningar",
		description:
			"Hantera dina cookieinställningar nedan. Nödvändiga cookies är alltid aktiva eftersom de krävs för att webbplatsen ska fungera. Du kan aktivera eller inaktivera andra kategorier utifrån dina önskemål.",
		descriptionPolicyLink: "Mer information finns i vår",
		rejectAll: "Avvisa alla",
		save: "Spara",
		acceptAllAndContinue: "Godkänn alla och fortsätt",
		categories: {
			essential: {
				label: "Nödvändiga cookies",
				description:
					"Strikt nödvändiga för att webbplatsen ska fungera. Dessa cookies möjliggör grundläggande funktioner som säkerhet, nätverkshantering och kontoåtkomst. De kan inte inaktiveras.",
			},
			analytics: {
				label: "Analyscookies",
				description:
					"Hjälper oss att förstå hur besökare navigerar på och interagerar med vår webbplats genom att samla in och rapportera anonym användningsdata. Det gör att vi kan förbättra webbplatsens prestanda och användarupplevelse.",
			},
			marketing: {
				label: "Marknadsföringscookies",
				description:
					"Används för att visa personliga annonser som är relevanta för dina intressen, mäta annonskampanjers resultat och begränsa hur ofta du ser en viss annons på olika plattformar.",
			},
		},
	},
	floatingIcon: {
		label: "Cookieinställningar",
	},
};
