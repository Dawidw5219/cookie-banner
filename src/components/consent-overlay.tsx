import { hasCompleteDisclosure } from "../disclosure";
import { useContext } from "preact/hooks";
import { ConfigContext } from "../hooks/use-consent";
import { ConsentDecisionButton, ConsentSettingsButton } from "@/ui/consent-button";
import { COOKIE_SHAPE, COOKIE_CHIPS } from "../ui/cookie-icon";
import { t } from "@/i18n";
import { PolicyLinks, BannerDescription } from "@/components/policy-links";

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
	const disclosed = hasCompleteDisclosure(
		useContext(ConfigContext) || undefined,
	);
	return (
		<>
			<div class="cb-intro-icon" aria-hidden="true">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d={COOKIE_SHAPE} fill="currentColor" />
					{COOKIE_CHIPS.map((chip) => (
						<circle key={`${chip.cx}-${chip.cy}`} {...chip} fill="var(--cb-bg)" />
					))}
				</svg>
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
			<div class="cb-decisions">
				<ConsentDecisionButton variant="outline" type="button" onClick={onRejectAll}>
					{t.preferences.rejectAll}
				</ConsentDecisionButton>
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
