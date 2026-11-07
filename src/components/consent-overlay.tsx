import { hasCompleteDisclosure } from "../core/disclosure";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../hooks/use-consent";
import {
	ConsentDecisionButton,
	ConsentSettingsButton,
} from "../ui/consent-button";
import { CookieIcon } from "../ui/cookie-icon";
import { t } from "../i18n";
import { PolicyLinks, BannerDescription } from "./policy-links";

interface ConsentOverlayProps {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	onAcceptAll: () => void;
	onRejectAll: () => void;
	onOpenPreferences: () => void;
}

export function ConsentOverlay({
	privacyPolicyUrl,
	cookiePolicyUrl,
	onAcceptAll,
	onRejectAll,
	onOpenPreferences,
}: ConsentOverlayProps) {
	const config = useContext(ConfigContext);
	const disclosed = hasCompleteDisclosure(config || undefined);
	const equal = config?.buttonStyle === "equal";
	return (
		<>
			{equal && (
				<div class="cb-intro-icon" aria-hidden="true">
					<CookieIcon />
				</div>
			)}
			<h2
				class={
					equal
						? "mb-3 text-xl sm:text-2xl font-semibold text-cb-text"
						: "mb-5 text-xl sm:text-2xl font-bold text-cb-text"
				}
			>
				{t.overlay.title}
			</h2>
			<p
				class={
					equal
						? "mb-6 text-sm leading-relaxed text-cb-text"
						: "mb-8 text-sm leading-relaxed text-cb-text"
				}
			>
				<BannerDescription />
				<PolicyLinks
					privacyPolicyUrl={privacyPolicyUrl}
					cookiePolicyUrl={cookiePolicyUrl}
				/>
			</p>
			<div class={`cb-decisions ${equal ? "" : "cb-standard-actions"}`}>
				{equal && (
					<ConsentDecisionButton
						variant="outline"
						type="button"
						onClick={onRejectAll}
					>
						{t.preferences.rejectAll}
					</ConsentDecisionButton>
				)}
				{!equal && (
					<ConsentSettingsButton
						appearance="outline"
						type="button"
						onClick={onOpenPreferences}
					>
						{t.overlay.advancedSettings}
					</ConsentSettingsButton>
				)}
				<ConsentDecisionButton
					type="button"
					onClick={onAcceptAll}
					disabled={!disclosed}
				>
					{equal ? t.overlay.acceptAll : t.overlay.acceptAllAndContinue}
				</ConsentDecisionButton>
			</div>
			{equal && (
				<ConsentSettingsButton type="button" onClick={onOpenPreferences}>
					{t.overlay.advancedSettings}
				</ConsentSettingsButton>
			)}
		</>
	);
}
