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
			<div class="cb-intro-icon" aria-hidden="true">
				<CookieIcon />
			</div>
			<h2 class="mb-3 text-xl sm:text-2xl font-semibold text-cb-text">
				{t.overlay.title}
			</h2>
			<p class="mb-6 text-sm leading-relaxed text-cb-text">
				<BannerDescription />
				<PolicyLinks
					privacyPolicyUrl={privacyPolicyUrl}
					cookiePolicyUrl={cookiePolicyUrl}
				/>
			</p>
			<div class={`cb-decisions ${equal ? "" : "cb-decisions-single"}`}>
				{equal && (
					<ConsentDecisionButton
						variant="outline"
						type="button"
						onClick={onRejectAll}
					>
						{t.preferences.rejectAll}
					</ConsentDecisionButton>
				)}
				<ConsentDecisionButton
					type="button"
					onClick={onAcceptAll}
					disabled={!disclosed}
				>
					{t.overlay.acceptAll}
				</ConsentDecisionButton>
			</div>
			<ConsentSettingsButton type="button" onClick={onOpenPreferences}>
				{t.overlay.advancedSettings}
			</ConsentSettingsButton>
		</>
	);
}
