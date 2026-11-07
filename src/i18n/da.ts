import type { TranslationSchema } from "./index";

export const da: TranslationSchema = {
	policy: {
		name: "Navn",
		provider: "Udbyder",
		purpose: "Formål",
		retention: "Opbevaring",
		category: "Kategori",
		functional: "Funktionelle",
		security: "Sikkerhed",
		personalization: "Personalisering",
		other: "Andre",
		empty: "Der er endnu ikke registreret cookies.",
		uncategorized: "Ingen kategoriserede cookies fundet.",
		functionalDescription: "Kontrollér, om hvert element er strengt nødvendigt for den ønskede tjeneste.",
		session: "Session",
	},
	content: {
		blocked: "Blokeret eksternt indhold",
		external: "Eksternt indhold",
		videoTitle: "Se denne YouTube-video",
		videoDescription: "Afspilning opretter forbindelse til YouTube og deler din IP-adresse og browserdata.",
		description: "Visning deler din IP-adresse og browserdata med udbyderen.",
		allowPlay: "Tillad og afspil",
		allowShow: "Tillad og vis",
		privacyDetails: "Oplysninger om privatliv",
		providerPrivacy: "Udbyderens privatlivspolitik",
	},
	disclosure: {
		unavailable: "Valgfrit indhold er deaktiveret, indtil privatlivsoplysningerne er komplette. Du kan fortsætte uden at acceptere.",
		retention: "Opbevaring",
		withdraw: "Træk alle valgfrie samtykker tilbage",
		saveError: "Valget kunne ikke gemmes. Valgfri behandling forbliver blokeret.",
	},
	overlay: {
		title: "Vi respekterer dit privatliv",
		description:
			"Valgfrie cookies og eksterne tjenester indlæses kun med dit samtykke. Du kan afvise eller ændre dit valg når som helst.",
		descriptionPolicyLink: "Du kan finde flere oplysninger i vores",
		acceptAll: "Accepter alle",
		advancedSettings: "Avancerede indstillinger",
		privacyPolicy: "privatlivspolitik",
		cookiePolicy: "cookiepolitik",
		andOur: "og vores",
	},
	preferences: {
		externalServices: "Eksterne tjenester på dette websted",
		externalServicesDescription: "Separat samtykke til hver udbyder. Indlæsning kan dele din IP-adresse og browserdata.",
		title: "Cookieindstillinger",
		description:
			"Administrer dine cookieindstillinger nedenfor. Nødvendige cookies er altid aktive, fordi de er nødvendige for, at webstedet kan fungere. Du kan aktivere eller deaktivere andre kategorier efter dine præferencer.",
		descriptionPolicyLink: "Du kan finde flere oplysninger i vores",
		rejectAll: "Afvis alle",
		save: "Gem",
		acceptAllAndContinue: "Accepter alle og fortsæt",
		categories: {
			essential: {
				label: "Nødvendige cookies",
				description:
					"Strengt nødvendige for, at webstedet kan fungere. Disse cookies muliggør grundlæggende funktioner som sikkerhed, netværksadministration og kontoadgang. De kan ikke deaktiveres.",
			},
			analytics: {
				label: "Analysecookies",
				description:
					"Hjælper os med at forstå, hvordan besøgende navigerer på og interagerer med vores websted, ved at indsamle og rapportere brugsdata. Det gør det muligt at forbedre webstedets ydeevne og brugeroplevelse.",
			},
			marketing: {
				label: "Marketingcookies",
				description:
					"Bruges til at vise personlige annoncer, der er relevante for dine interesser, måle annoncekampagners resultater og begrænse, hvor ofte du ser en bestemt annonce på tværs af platforme.",
			},
		},
	},
	floatingIcon: {
		label: "Cookieindstillinger",
	},
};
