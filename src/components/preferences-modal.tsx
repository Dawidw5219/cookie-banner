import { getServices } from "@/services";
import { ConsentDecisionButton } from "@/ui/consent-button";
import {
	hasCompleteDisclosure,
	hasServiceDisclosure,
	isPolicyUrl,
} from "../disclosure";
import { ConfigContext } from "../hooks/use-consent";
import { useContext } from "preact/hooks";
import { useEffect, useState } from "preact/hooks";
import { t } from "@/i18n";
import {
	PreferencesPolicyLinks,
	ConsentNotice,
} from "@/components/policy-links";
import type { ConsentCategory, ConsentState } from "@/types";
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
	const config = useContext(ConfigContext);
	const disclosed = hasCompleteDisclosure(config || undefined);
	const [services, setServices] = useState(getServices);
	useEffect(() => {
		const update = () => setServices(getServices());
		window.addEventListener("cb:services-changed", update);
		return () => window.removeEventListener("cb:services-changed", update);
	}, []);
	const [state, setState] = useState<ConsentState>({
		...initialState,
	});

	const handleToggle = (category: ConsentCategory, checked: boolean) => {
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
				</div>
				<p class="mt-2 text-sm leading-relaxed text-cb-text">
					<ConsentNotice />
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
										<label
											for={`cb-toggle-${category}`}
											class="text-sm font-semibold text-cb-text"
										>
											{catT.label}
										</label>
										<p class="mt-1 text-xs leading-relaxed text-cb-text">
											{catT.description}
										</p>
									</div>
									<div class="shrink-0 pt-0.5">
										<Toggle
											id={`cb-toggle-${category}`}
											checked={isEssential ? true : state[category]}
											disabled={isEssential || !disclosed}
											onChange={(checked) => handleToggle(category, checked)}
										/>
									</div>
								</div>
							</div>
						);
					})}
					<h3 class="text-sm font-semibold text-cb-text">
						{t.preferences.externalServices}
					</h3>
					{services.map((service) => (
						<div
							key={service.id}
							class="rounded-cb border border-cb-border p-4"
						>
							<div class="flex items-center justify-between gap-3">
								<label
									for={`cb-service-${service.id}`}
									class="text-sm font-semibold text-cb-text"
								>
									{service.name}
								</label>
								<Toggle
									id={`cb-service-${service.id}`}
									checked={state.services?.[service.id] === true}
									disabled={!disclosed || !hasServiceDisclosure(service)}
									onChange={(checked) =>
										setState((prev) => ({
											...prev,
											services: { ...prev.services, [service.id]: checked },
										}))
									}
								/>
							</div>
							<p class="mt-2 text-xs text-cb-text">
								{service.description && (
									<span>
										{service.description}
										<br />
									</span>
								)}
								{t.preferences.externalServicesDescription}
								{service.retention && (
									<span class="block">
										{t.disclosure.retention}: {service.retention}
									</span>
								)}
								{!hasServiceDisclosure(service) && (
									<span class="block">{t.disclosure.unavailable}</span>
								)}
							</p>
							{isPolicyUrl(service.privacyUrl) && (
								<a
									class="text-xs text-cb-primary underline"
									href={service.privacyUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{t.overlay.privacyPolicy}
								</a>
							)}
						</div>
					))}
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-cb-border p-5 sm:p-6">
				<ConsentDecisionButton variant="outline" type="button" onClick={onRejectAll}>
					{t.preferences.rejectAll}
				</ConsentDecisionButton>
				<ConsentDecisionButton variant="subtle" type="button" onClick={handleSave}>
					{t.preferences.save}
				</ConsentDecisionButton>
				<ConsentDecisionButton
					type="button"
					onClick={onAcceptAll}
					disabled={!disclosed}
				>
					{t.preferences.acceptAllAndContinue}
				</ConsentDecisionButton>
			</div>
		</>
	);
}
