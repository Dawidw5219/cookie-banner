import type { TranslationSchema } from "./index";

export const it: TranslationSchema = {
	overlay: {
		title: "Rispettiamo la tua privacy",
		description:
			"Questo sito utilizza cookie e tecnologie di tracciamento simili per migliorare la tua esperienza di navigazione, analizzare il traffico del sito e capire da dove provengono i nostri visitatori. Scegliendo le tue preferenze, ci aiuti a migliorare i nostri servizi rispettando il tuo diritto alla privacy.",
		descriptionPolicyLink: "Per maggiori dettagli, consulta la nostra",
		acceptAll: "Accetta tutti",
		advancedSettings: "Impostazioni avanzate",
		privacyPolicy: "informativa sulla privacy",
		cookiePolicy: "politica sui cookie",
		andOur: "e la nostra",
	},
	preferences: {
		title: "Preferenze dei cookie",
		description:
			"Gestisci le tue preferenze sui cookie qui sotto. I cookie essenziali sono sempre attivi poiché necessari per il funzionamento del sito. Puoi attivare o disattivare le altre categorie in base alle tue preferenze.",
		descriptionPolicyLink: "Per maggiori dettagli, consulta la nostra",
		rejectAll: "Rifiuta tutti",
		save: "Salva",
		acceptAllAndContinue: "Accetta tutti e continua",
		categories: {
			essential: {
				label: "Cookie essenziali",
				description:
					"Strettamente necessari per il funzionamento del sito. Questi cookie abilitano funzioni di base come la sicurezza, la gestione della rete e l'accesso all'account. Non possono essere disattivati.",
			},
			analytics: {
				label: "Cookie analitici",
				description:
					"Ci aiutano a capire come i visitatori navigano e interagiscono con il nostro sito, raccogliendo e segnalando dati di utilizzo anonimi. Questo ci consente di migliorare le prestazioni del sito e l'esperienza utente.",
			},
			marketing: {
				label: "Cookie di marketing",
				description:
					"Utilizzati per fornire annunci personalizzati pertinenti ai tuoi interessi, monitorare le prestazioni delle campagne pubblicitarie e limitare il numero di volte in cui vedi un particolare annuncio su diverse piattaforme.",
			},
		},
	},
	floatingIcon: {
		label: "Preferenze dei cookie",
	},
};
