import { t } from "@/i18n";

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
