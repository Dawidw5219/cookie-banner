export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentState = Record<ConsentCategory, boolean>;

export type BannerMode = "gtm" | "standalone";

export type BannerVariant = "modal" | "bar";

export type BannerView = "overlay" | "preferences" | "idle";

export interface ScriptDef {
	src?: string;
	inline?: string;
	async?: boolean;
}

export interface ThemeConfig {
	primary?: string;
	/** Hover shade for primary buttons; derived from `primary` when omitted. */
	primaryHover?: string;
	background?: string;
	text?: string;
}

export interface BannerConfig {
	mode: BannerMode;
	variant?: BannerVariant;
	gtmId?: string;
	loadGtm?: boolean;
	testMode?: boolean;
	autoAcceptAll?: boolean;
	lang: string;
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	theme?: ThemeConfig;
	useCustomSettingsLink?: boolean;
	customTexts?: Record<string, unknown>;
	scripts?: {
		analytics?: ScriptDef[];
		marketing?: ScriptDef[];
	};
}

export const STORAGE_PREFIX = "cb_consent_";
export const STORAGE_HAS_CONSENTED = "cb_has_consented";

export const CONSENT_CATEGORIES: ConsentCategory[] = [
	"essential",
	"analytics",
	"marketing",
];

export const DEFAULT_CONSENT_STATE: ConsentState = {
	essential: true,
	analytics: false,
	marketing: false,
};

export const GTM_CONSENT_KEYS = [
	"ad_storage",
	"analytics_storage",
	"ad_user_data",
	"ad_personalization",
	"functionality_storage",
	"security_storage",
	"personalization_storage",
] as const;

export type GTMConsentKey = (typeof GTM_CONSENT_KEYS)[number];

export type GTMConsentPayload = Record<GTMConsentKey, "granted" | "denied">;

export const DEFAULT_GTM_CONSENT_DENIED: GTMConsentPayload = {
	ad_storage: "denied",
	analytics_storage: "denied",
	ad_user_data: "denied",
	ad_personalization: "denied",
	functionality_storage: "denied",
	security_storage: "denied",
	personalization_storage: "denied",
};

export const GTM_CONSENT_MAP: Record<
	ConsentCategory,
	readonly GTMConsentKey[]
> = {
	essential: ["functionality_storage", "security_storage", "personalization_storage"],
	analytics: ["analytics_storage"],
	marketing: ["ad_storage", "ad_user_data", "ad_personalization"],
};

declare global {
	interface Window {
		__cookieConsent?: BannerConfig;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dataLayer?: any[];
		gtag?: (...args: unknown[]) => void;
		fbq?: (...args: unknown[]) => void;
	}
}
