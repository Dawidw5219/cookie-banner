import type { TranslationSchema } from "./index";

export const da: TranslationSchema = {
	overlay: {
		title: "Vi respekterer dit privatliv",
		description:
			"Valgfrie cookies og eksterne tjenester indlæses kun med dit samtykke. Du kan afvise eller ændre dit valg når som helst. Læs vores",
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
					"Hjælper os med at forstå, hvordan besøgende navigerer på og interagerer med vores websted, ved at indsamle og rapportere anonyme brugsdata. Det gør det muligt at forbedre webstedets ydeevne og brugeroplevelse.",
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
