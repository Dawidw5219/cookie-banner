import type { TranslationSchema } from "./index";

export const fr: TranslationSchema = {
	overlay: {
		title: "Nous respectons votre vie privée",
		description:
			"Ce site utilise des cookies et des technologies de suivi similaires pour améliorer votre expérience de navigation, analyser le trafic du site et comprendre d'où viennent nos visiteurs. En choisissant vos préférences, vous nous aidez à améliorer nos services tout en respectant votre droit à la vie privée.",
		descriptionPolicyLink: "Pour plus de détails, consultez notre",
		acceptAll: "Tout accepter",
		advancedSettings: "Paramètres avancés",
		privacyPolicy: "politique de confidentialité",
		cookiePolicy: "politique de cookies",
		andOur: "et notre",
	},
	preferences: {
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
					"Nous aident à comprendre comment les visitateurs naviguent et interagissent avec notre site en collectant et en rapportant des données d'utilisation anonymes. Cela nous permet d'améliorer les performances du site et l'expérience utilisateur.",
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
