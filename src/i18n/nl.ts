import type { TranslationSchema } from "./index";

export const nl: TranslationSchema = {
	policy: {
		name: "Naam",
		provider: "Aanbieder",
		purpose: "Doel",
		retention: "Bewaartermijn",
		category: "Categorie",
		functional: "Functioneel",
		security: "Beveiliging",
		personalization: "Personalisatie",
		other: "Overige",
		empty: "Er zijn nog geen cookies gedetecteerd.",
		uncategorized: "Geen ingedeelde cookies gevonden.",
		functionalDescription: "Controleer of elk onderdeel strikt noodzakelijk is voor de gevraagde dienst.",
		session: "Sessie",
	},
	content: {
		blocked: "Geblokkeerde externe inhoud",
		external: "Externe inhoud",
		videoTitle: "Bekijk deze YouTube-video",
		videoDescription: "Afspelen maakt verbinding met YouTube en deelt je IP-adres en browsergegevens.",
		description: "Weergave deelt je IP-adres en browsergegevens met de aanbieder.",
		allowPlay: "Toestaan en afspelen",
		allowShow: "Toestaan en tonen",
		privacyDetails: "Privacygegevens",
		providerPrivacy: "Privacy van de aanbieder",
	},
	disclosure: {
		unavailable: "Optionele inhoud blijft uitgeschakeld totdat de privacyinformatie volledig is. U kunt doorgaan zonder toestemming.",
		retention: "Bewaartermijn",
		withdraw: "Alle optionele toestemmingen intrekken",
		saveError: "De keuze kon niet worden opgeslagen. Optionele verwerking blijft geblokkeerd.",
	},
	close: "Sluiten",
	overlay: {
		title: "Wij respecteren uw privacy",
		description:
			"Optionele cookies en externe diensten worden alleen met uw toestemming geladen. U kunt weigeren of uw keuze op elk moment wijzigen.",
		descriptionPolicyLink: "Meer informatie vindt u in ons",
		acceptAll: "Alles accepteren",
		acceptAllAndContinue: "Alles accepteren en doorgaan",
		advancedSettings: "Geavanceerde instellingen",
		privacyPolicy: "privacybeleid",
		cookiePolicy: "cookiebeleid",
		andOur: "en ons",
	},
	preferences: {
		externalServices: "Externe diensten op deze website",
		externalServicesDescription: "Afzonderlijke toestemming per aanbieder. Laden kan uw IP-adres en browsergegevens delen.",
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
					"Helpen ons te begrijpen hoe bezoekers door onze website navigeren en ermee omgaan door gebruiksgegevens te verzamelen en te rapporteren. Zo kunnen we de prestaties en gebruikservaring verbeteren.",
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
