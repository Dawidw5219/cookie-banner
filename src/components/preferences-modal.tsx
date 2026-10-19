import { useState } from "preact/hooks";
import { t } from "@/i18n";
import { PreferencesPolicyLinks } from "@/components/policy-links";
import type { ConsentState } from "@/types";
import { CONSENT_CATEGORIES } from "@/types";
import { Toggle } from "@/ui/toggle";

interface PreferencesModalProps {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	initialState: ConsentState;
	onSave: (state: ConsentState) => void;
	onAcceptAll: () => void;
	onRejectAll: () => void;
}

export function PreferencesModal({
	privacyPolicyUrl,
	cookiePolicyUrl,
	initialState,
	onSave,
	onAcceptAll,
	onRejectAll,
}: PreferencesModalProps) {
	const [state, setState] = useState<ConsentState>({
		...initialState,
	});

	const handleToggle = (category: keyof ConsentState, checked: boolean) => {
		setState((prev) => ({ ...prev, [category]: checked }));
	};

	const handleSave = () => {
		onSave({ ...state, essential: true });
	};

	return (
		<>
			<div class="border-b border-cb-border p-5 sm:p-6">
				<div class="flex items-center justify-between">
					<h2 class="text-lg sm:text-xl font-bold text-cb-text">
						{t.preferences.title}!
					</h2>
					<button
						type="button"
						onClick={onRejectAll}
						class="cursor-pointer text-sm text-cb-primary underline underline-offset-2 transition-colors hover:text-cb-primary-hover focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:outline-none"
					>
						{t.preferences.rejectAll}
					</button>
				</div>
				<p class="mt-2 text-sm leading-relaxed text-cb-text/60">
					{t.preferences.description}
					<PreferencesPolicyLinks
						privacyPolicyUrl={privacyPolicyUrl}
						cookiePolicyUrl={cookiePolicyUrl}
					/>
				</p>
			</div>
			<div class="flex-1 overflow-y-auto p-5 sm:p-6">
				<div class="flex flex-col gap-3 sm:gap-4">
					{CONSENT_CATEGORIES.map((category) => {
						const catT = t.preferences.categories[category];
						const isEssential = category === "essential";
						return (
							<div
								key={category}
								class="rounded-cb border border-cb-border bg-cb-surface p-3 sm:p-4"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<span class="text-sm font-semibold text-cb-text">
											{catT.label}
										</span>
										<p class="mt-1 text-xs leading-relaxed text-cb-text/60">
											{catT.description}
										</p>
									</div>
									<div class="shrink-0 pt-0.5">
										<Toggle
											id={`cb-toggle-${category}`}
											checked={isEssential ? true : state[category]}
											disabled={isEssential}
											onChange={(checked) => handleToggle(category, checked)}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<div class="flex gap-3 border-t border-cb-border p-5 sm:p-6">
				<button
					type="button"
					onClick={handleSave}
					style={{ border: "1px solid var(--cb-primary)" }}
					class="flex-1 cursor-pointer rounded-md bg-cb-bg px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-cb-primary transition-colors hover:bg-cb-primary/5 focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{t.preferences.save}
				</button>
				<button
					type="button"
					onClick={onAcceptAll}
					class="flex-1 cursor-pointer rounded-md bg-cb-primary px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-cb-primary-hover focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					{t.preferences.acceptAllAndContinue}
				</button>
			</div>
		</>
	);
}
