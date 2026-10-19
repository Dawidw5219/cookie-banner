import { t } from "@/i18n";
import { PolicyLinks } from "@/components/policy-links";

interface ConsentOverlayProps {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	onAcceptAll: () => void;
	onOpenPreferences: () => void;
}

export function ConsentOverlay({
	privacyPolicyUrl,
	cookiePolicyUrl,
	onAcceptAll,
	onOpenPreferences,
}: ConsentOverlayProps) {
	return (
		<>
			<h2 class="mb-5 text-xl sm:text-2xl font-bold text-cb-text">
				{t.overlay.title}
			</h2>
			<p class="mb-8 text-sm leading-relaxed text-cb-text/70">
				{t.overlay.description}
				<PolicyLinks
					privacyPolicyUrl={privacyPolicyUrl}
					cookiePolicyUrl={cookiePolicyUrl}
				/>
			</p>
			<div class="mt-8 flex gap-3">
				<button
					type="button"
					onClick={onOpenPreferences}
					style={{ border: "1px solid var(--cb-primary)" }}
					class="flex-1 cursor-pointer rounded-md bg-cb-bg px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-cb-primary transition-colors hover:bg-cb-primary/5 focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{t.overlay.advancedSettings}
				</button>
				<button
					type="button"
					onClick={onAcceptAll}
					class="flex-1 cursor-pointer rounded-md bg-cb-primary px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-cb-primary-hover focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{t.overlay.acceptAll}
				</button>
			</div>
		</>
	);
}
