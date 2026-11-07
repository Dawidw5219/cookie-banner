import type { TranslationSchema } from "./index";

export const fr: TranslationSchema = {
	policy: {
		name: "Nom",
		provider: "Fournisseur",
		purpose: "Finalité",
		retention: "Conservation",
		category: "Catégorie",
		functional: "Fonctionnels",
		security: "Sécurité",
		personalization: "Personnalisation",
		other: "Autres",
		empty: "Aucun cookie n’a encore été détecté.",
		uncategorized: "Aucun cookie classé trouvé.",
		functionalDescription: "Vérifiez si chaque élément est strictement nécessaire au service demandé.",
		session: "Session",
	},
	content: {
		blocked: "Contenu externe bloqué",
		external: "Contenu externe",
		videoTitle: "Regarder cette vidéo YouTube",
		videoDescription: "La lecture établit une connexion à YouTube et transmet votre adresse IP et les données du navigateur.",
		description: "L’affichage transmet votre adresse IP et les données du navigateur au fournisseur.",
		allowPlay: "Accepter et lire",
		allowShow: "Accepter et afficher",
		privacyDetails: "Informations de confidentialité",
		providerPrivacy: "Confidentialité du fournisseur",
	},
	disclosure: {
		unavailable: "Les contenus facultatifs restent désactivés tant que les informations de confidentialité sont incomplètes. Vous pouvez continuer sans accepter.",
		retention: "Conservation",
		withdraw: "Retirer tous les consentements facultatifs",
		saveError: "Le choix n’a pas pu être enregistré. Le traitement facultatif reste bloqué.",
	},
	close: "Fermer",
	overlay: {
		title: "Nous respectons votre vie privée",
		description:
			"Les cookies facultatifs et services externes sont activés uniquement avec votre consentement. Vous pouvez refuser ou modifier votre choix à tout moment.",
		descriptionPolicyLink: "Pour plus de détails, consultez notre",
		acceptAll: "Tout accepter",
		acceptAllAndContinue: "Tout accepter et continuer",
		advancedSettings: "Paramètres avancés",
		privacyPolicy: "politique de confidentialité",
		cookiePolicy: "politique de cookies",
		andOur: "et notre",
	},
	preferences: {
		externalServices: "Services externes détectés sur ce site",
		externalServicesDescription: "Consentement distinct pour chaque fournisseur. Le chargement peut transmettre votre adresse IP et les données du navigateur.",
		title: "Préférences de cookies",
		description:
			"Gérez vos préférences de cookies ci-dessous. Les cookies essentiels sont toujours actifs car ils sont nécessaires au fonctionnement du site. Vous pouvez activer ou désactiver les autres catégories selon vos préférences.",
		descriptionPolicyLink: "Pour plus de détails, consultez notre",
		rejectAll: "Tout refuser",
		save: "Enregistrer",
		acceptAllAndContinue: "Tout accepter et continuer",
		categories: {
			essential: {
				label: "Cookies essentiels",
				description:
					"Strictement nécessaires au fonctionnement du site. Ces cookies permettent des fonctions de base telles que la sécurité, la gestion du réseau et l'accès au compte. Ils ne peuvent pas être désactivés.",
			},
			analytics: {
				label: "Cookies analytiques",
				description:
					"Nous aident à comprendre comment les visitateurs naviguent et interagissent avec notre site en collectant et en rapportant des données d'utilisation. Cela nous permet d'améliorer les performances du site et l'expérience utilisateur.",
			},
			marketing: {
				label: "Cookies marketing",
				description:
					"Utilisés pour diffuser des publicités personnalisées correspondant à vos intérêts, suivre les performances des campagnes publicitaires et limiter le nombre de fois où vous voyez une annonce particulière sur différentes plateformes.",
			},
		},
	},
	floatingIcon: {
		label: "Préférences de cookies",
	},
};
