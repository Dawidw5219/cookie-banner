import type { TranslationSchema } from "./index";

export const sv: TranslationSchema = {
	policy: {
		name: "Namn",
		provider: "Leverantör",
		purpose: "Ändamål",
		retention: "Lagringstid",
		category: "Kategori",
		functional: "Funktionella",
		security: "Säkerhet",
		personalization: "Anpassning",
		other: "Övriga",
		empty: "Inga cookies har upptäckts ännu.",
		uncategorized: "Inga kategoriserade cookies hittades.",
		functionalDescription: "Kontrollera om varje del är absolut nödvändig för den begärda tjänsten.",
		session: "Session",
	},
	content: {
		blocked: "Blockerat externt innehåll",
		external: "Externt innehåll",
		videoTitle: "Se den här YouTube-videon",
		videoDescription: "Uppspelning ansluter till YouTube och delar din IP-adress och webbläsardata.",
		description: "Visning delar din IP-adress och webbläsardata med leverantören.",
		allowPlay: "Tillåt och spela",
		allowShow: "Tillåt och visa",
		privacyDetails: "Integritetsinformation",
		providerPrivacy: "Leverantörens integritetspolicy",
	},
	disclosure: {
		unavailable: "Valfritt innehåll är avstängt tills integritetsinformationen är fullständig. Du kan fortsätta utan att godkänna.",
		retention: "Lagring",
		withdraw: "Återkalla alla valfria samtycken",
		saveError: "Valet kunde inte sparas. Valfri behandling förblir blockerad.",
	},
	close: "Stäng",
	overlay: {
		title: "Vi respekterar din integritet",
		description:
			"Valfria cookies och externa tjänster laddas bara med ditt samtycke. Du kan avvisa eller ändra ditt val när som helst.",
		descriptionPolicyLink: "Mer information finns i vår",
		acceptAll: "Godkänn alla",
		acceptAllAndContinue: "Godkänn alla och fortsätt",
		advancedSettings: "Avancerade inställningar",
		privacyPolicy: "integritetspolicy",
		cookiePolicy: "cookiepolicy",
		andOur: "och vår",
	},
	preferences: {
		externalServices: "Externa tjänster på denna webbplats",
		externalServicesDescription: "Separat samtycke för varje leverantör. Laddning kan dela din IP-adress och webbläsardata.",
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
					"Hjälper oss att förstå hur besökare navigerar på och interagerar med vår webbplats genom att samla in och rapportera användningsdata. Det gör att vi kan förbättra webbplatsens prestanda och användarupplevelse.",
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
