import type { TranslationSchema } from "./index";

export const no: TranslationSchema = {
	overlay: {
		title: "Vi respekterer personvernet ditt",
		description:
			"Valgfrie informasjonskapsler og eksterne tjenester lastes bare med ditt samtykke. Du kan avslå eller endre valget når som helst. Les vår",
		descriptionPolicyLink: "Du finner mer informasjon i",
		acceptAll: "Godta alle",
		advancedSettings: "Avanserte innstillinger",
		privacyPolicy: "personvernerklæringen vår",
		cookiePolicy: "retningslinjene våre for informasjonskapsler",
		andOur: "og",
	},
	preferences: {
		externalServices: "Eksterne tjenester på dette nettstedet",
		externalServicesDescription: "Eget samtykke for hver leverandør. Innlasting kan dele IP-adressen din og nettleserdata.",
		title: "Innstillinger for informasjonskapsler",
		description:
			"Administrer innstillingene for informasjonskapsler nedenfor. Nødvendige informasjonskapsler er alltid aktive fordi nettstedet trenger dem for å fungere. Du kan aktivere eller deaktivere andre kategorier etter egne preferanser.",
		descriptionPolicyLink: "Du finner mer informasjon i",
		rejectAll: "Avvis alle",
		save: "Lagre",
		acceptAllAndContinue: "Godta alle og fortsett",
		categories: {
			essential: {
				label: "Nødvendige informasjonskapsler",
				description:
					"Helt nødvendige for at nettstedet skal fungere. Disse informasjonskapslene muliggjør grunnleggende funksjoner som sikkerhet, nettverksadministrasjon og kontotilgang. De kan ikke deaktiveres.",
			},
			analytics: {
				label: "Analyse-informasjonskapsler",
				description:
					"Hjelper oss med å forstå hvordan besøkende navigerer på og bruker nettstedet vårt, ved å samle inn og rapportere anonyme bruksdata. Dette gjør det mulig å forbedre nettstedets ytelse og brukeropplevelse.",
			},
			marketing: {
				label: "Markedsføringskapsler",
				description:
					"Brukes til å vise personlig tilpassede annonser som er relevante for interessene dine, måle resultatene av annonsekampanjer og begrense hvor ofte du ser en bestemt annonse på tvers av plattformer.",
			},
		},
	},
	floatingIcon: {
		label: "Innstillinger for informasjonskapsler",
	},
};
