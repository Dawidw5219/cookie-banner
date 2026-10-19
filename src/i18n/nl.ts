import type { TranslationSchema } from "./index";

export const nl: TranslationSchema = {
	overlay: {
		title: "Wij respecteren uw privacy",
		description:
			"Deze website gebruikt cookies en vergelijkbare trackingtechnologieën om uw browse-ervaring te verbeteren, het websiteverkeer te analyseren en te begrijpen waar onze bezoekers vandaan komen. Door uw voorkeuren te kiezen, helpt u ons onze diensten te verbeteren met respect voor uw recht op privacy.",
		descriptionPolicyLink: "Meer informatie vindt u in ons",
		acceptAll: "Alles accepteren",
		advancedSettings: "Geavanceerde instellingen",
		privacyPolicy: "privacybeleid",
		cookiePolicy: "cookiebeleid",
		andOur: "en ons",
	},
	preferences: {
		title: "Cookievoorkeuren",
		description:
			"Beheer hieronder uw cookievoorkeuren. Essentiële cookies zijn altijd actief omdat ze nodig zijn voor de werking van de website. U kunt andere categorieën naar wens in- of uitschakelen.",
		descriptionPolicyLink: "Meer informatie vindt u in ons",
		rejectAll: "Alles weigeren",
		save: "Opslaan",
		acceptAllAndContinue: "Alles accepteren en doorgaan",
		categories: {
			essential: {
				label: "Essentiële cookies",
				description:
					"Strikt noodzakelijk voor de werking van de website. Deze cookies maken basisfuncties mogelijk, zoals beveiliging, netwerkbeheer en toegang tot accounts. Ze kunnen niet worden uitgeschakeld.",
			},
			analytics: {
				label: "Analytische cookies",
				description:
					"Helpen ons te begrijpen hoe bezoekers door onze website navigeren en ermee omgaan door anonieme gebruiksgegevens te verzamelen en te rapporteren. Zo kunnen we de prestaties en gebruikservaring verbeteren.",
			},
			marketing: {
				label: "Marketingcookies",
				description:
					"Worden gebruikt om gepersonaliseerde advertenties te tonen die aansluiten bij uw interesses, campagneprestaties te meten en te beperken hoe vaak u een bepaalde advertentie op verschillende platforms ziet.",
			},
		},
	},
	floatingIcon: {
		label: "Cookievoorkeuren",
	},
};
