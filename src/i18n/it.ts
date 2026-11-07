import type { TranslationSchema } from "./index";

export const it: TranslationSchema = {
	policy: {
		name: "Nome",
		provider: "Fornitore",
		purpose: "Finalità",
		retention: "Conservazione",
		category: "Categoria",
		functional: "Funzionali",
		security: "Sicurezza",
		personalization: "Personalizzazione",
		other: "Altri",
		empty: "Non sono ancora stati rilevati cookie.",
		uncategorized: "Nessun cookie classificato trovato.",
		functionalDescription: "Verifica se ogni elemento è strettamente necessario per il servizio richiesto.",
		session: "Sessione",
	},
	content: {
		blocked: "Contenuto esterno bloccato",
		external: "Contenuto esterno",
		videoTitle: "Guarda questo video YouTube",
		videoDescription: "La riproduzione si collega a YouTube e condivide il tuo indirizzo IP e i dati del browser.",
		description: "La visualizzazione condivide il tuo indirizzo IP e i dati del browser con il fornitore.",
		allowPlay: "Accetta e riproduci",
		allowShow: "Accetta e mostra",
		privacyDetails: "Informazioni sulla privacy",
		providerPrivacy: "Privacy del fornitore",
	},
	disclosure: {
		unavailable: "I contenuti facoltativi restano disattivati finché le informazioni sulla privacy non sono complete. Puoi continuare senza accettare.",
		retention: "Conservazione",
		withdraw: "Revoca tutti i consensi facoltativi",
		saveError: "Impossibile salvare la scelta. Il trattamento facoltativo resta bloccato.",
	},
	overlay: {
		title: "Rispettiamo la tua privacy",
		description:
			"I cookie facoltativi e i servizi esterni vengono attivati solo con il tuo consenso. Puoi rifiutare o modificare la tua scelta in qualsiasi momento.",
		descriptionPolicyLink: "Per maggiori dettagli, consulta la nostra",
		acceptAll: "Accetta tutti",
		advancedSettings: "Impostazioni avanzate",
		privacyPolicy: "informativa sulla privacy",
		cookiePolicy: "politica sui cookie",
		andOur: "e la nostra",
	},
	preferences: {
		externalServices: "Servizi esterni rilevati su questo sito",
		externalServicesDescription: "Consenso separato per ogni fornitore. Il caricamento può condividere il tuo indirizzo IP e i dati del browser.",
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
					"Ci aiutano a capire come i visitatori navigano e interagiscono con il nostro sito, raccogliendo e segnalando dati di utilizzo. Questo ci consente di migliorare le prestazioni del sito e l'esperienza utente.",
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
