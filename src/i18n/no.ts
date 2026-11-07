import type { TranslationSchema } from "./index";

export const no: TranslationSchema = {
	policy: {
		name: "Navn",
		provider: "Leverandør",
		purpose: "Formål",
		retention: "Lagringstid",
		category: "Kategori",
		functional: "Funksjonelle",
		security: "Sikkerhet",
		personalization: "Personalisering",
		other: "Andre",
		empty: "Ingen informasjonskapsler er oppdaget ennå.",
		uncategorized: "Ingen kategoriserte informasjonskapsler funnet.",
		functionalDescription: "Kontroller om hvert element er strengt nødvendig for den forespurte tjenesten.",
		session: "Økt",
	},
	content: {
		blocked: "Blokkert eksternt innhold",
		external: "Eksternt innhold",
		videoTitle: "Se denne YouTube-videoen",
		videoDescription: "Avspilling kobler til YouTube og deler IP-adressen din og nettleserdata.",
		description: "Visning deler IP-adressen din og nettleserdata med leverandøren.",
		allowPlay: "Tillat og spill av",
		allowShow: "Tillat og vis",
		privacyDetails: "Personverninformasjon",
		providerPrivacy: "Leverandørens personvern",
	},
	disclosure: {
		unavailable: "Valgfritt innhold er deaktivert til personverninformasjonen er komplett. Du kan fortsette uten å godta.",
		retention: "Lagring",
		withdraw: "Trekk tilbake alle valgfrie samtykker",
		saveError: "Valget kunne ikke lagres. Valgfri behandling forblir blokkert.",
	},
	overlay: {
		title: "Vi respekterer personvernet ditt",
		description:
			"Valgfrie informasjonskapsler og eksterne tjenester lastes bare med ditt samtykke. Du kan avslå eller endre valget når som helst.",
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
					"Hjelper oss med å forstå hvordan besøkende navigerer på og bruker nettstedet vårt, ved å samle inn og rapportere bruksdata. Dette gjør det mulig å forbedre nettstedets ytelse og brukeropplevelse.",
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
