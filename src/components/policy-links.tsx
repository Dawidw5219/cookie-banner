import { hasCompleteDisclosure, isPolicyUrl } from "../core/disclosure";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../hooks/use-consent";
import { t } from "../i18n";

const linkClass =
	"cursor-pointer underline underline-offset-2 text-cb-primary hover:text-cb-primary-hover transition-colors";

interface PolicyLinksProps {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
}

export function PolicyLinks({
	privacyPolicyUrl,
	cookiePolicyUrl,
}: PolicyLinksProps) {
	privacyPolicyUrl = isPolicyUrl(privacyPolicyUrl)
		? privacyPolicyUrl
		: undefined;
	cookiePolicyUrl = isPolicyUrl(cookiePolicyUrl) ? cookiePolicyUrl : undefined;
	if (!privacyPolicyUrl && !cookiePolicyUrl) return null;

	return (
		<>
			{" "}
			{(privacyPolicyUrl || cookiePolicyUrl) &&
				t.overlay.descriptionPolicyLink &&
				`${t.overlay.descriptionPolicyLink} `}
			{privacyPolicyUrl && (
				<a
					href={privacyPolicyUrl}
					target="_blank"
					rel="noopener noreferrer"
					class={linkClass}
				>
					{t.overlay.privacyPolicy}
				</a>
			)}
			{privacyPolicyUrl && cookiePolicyUrl && ` ${t.overlay.andOur} `}
			{cookiePolicyUrl && (
				<a
					href={cookiePolicyUrl}
					target="_blank"
					rel="noopener noreferrer"
					class={linkClass}
				>
					{t.overlay.cookiePolicy}
				</a>
			)}
			.
		</>
	);
}

export function PreferencesPolicyLinks({
	privacyPolicyUrl,
	cookiePolicyUrl,
}: PolicyLinksProps) {
	privacyPolicyUrl = isPolicyUrl(privacyPolicyUrl)
		? privacyPolicyUrl
		: undefined;
	cookiePolicyUrl = isPolicyUrl(cookiePolicyUrl) ? cookiePolicyUrl : undefined;
	if (!privacyPolicyUrl && !cookiePolicyUrl) return null;

	return (
		<>
			{" "}
			{t.preferences.descriptionPolicyLink}{" "}
			{privacyPolicyUrl && (
				<a
					href={privacyPolicyUrl}
					target="_blank"
					rel="noopener noreferrer"
					class={linkClass}
				>
					{t.overlay.privacyPolicy}
				</a>
			)}
			{privacyPolicyUrl && cookiePolicyUrl && ` ${t.overlay.andOur} `}
			{cookiePolicyUrl && (
				<a
					href={cookiePolicyUrl}
					target="_blank"
					rel="noopener noreferrer"
					class={linkClass}
				>
					{t.overlay.cookiePolicy}
				</a>
			)}
			.
		</>
	);
}

/** The first layer stays concise; the configured policy links provide further details. */
export function BannerDescription() {
	const config = useContext(ConfigContext);
	return (
		<>
			{t.overlay.description}
			{config && !hasCompleteDisclosure(config) && (
				<span class="block mt-2" role="status">
					{t.disclosure.unavailable}
				</span>
			)}
		</>
	);
}
