import { useContext, useEffect, useState } from "preact/hooks";
import { getServices } from "../core/services";
import {
	hasCompleteDisclosure,
	hasServiceDisclosure,
	isPolicyUrl,
} from "../core/disclosure";
import { ConsentButton, ConsentDecisionButton } from "../ui/consent-button";
import { ConfigContext } from "../hooks/use-consent";
import { t } from "../i18n";
import { PreferencesPolicyLinks } from "./policy-links";
import { ConsentOption } from "./consent-option";
import type { ConsentCategory, ConsentState } from "../types";
import { CONSENT_CATEGORIES } from "../types";

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
	const standard = (config?.buttonStyle ?? "standard") === "standard";
	const [services, setServices] = useState(getServices);
	const [state, setState] = useState<ConsentState>({ ...initialState });
	useEffect(() => {
		const update = () => setServices(getServices());
		window.addEventListener("cb:services-changed", update);
		return () => window.removeEventListener("cb:services-changed", update);
	}, []);
	const handleToggle = (category: ConsentCategory, checked: boolean) =>
		setState((prev) => ({ ...prev, [category]: checked }));

	return (
		<>
			<div class="cb-preferences-header shrink-0 border-b border-cb-border px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-3">
				<div
					class={`flex items-center justify-between gap-4 ${standard ? "" : "pr-10"}`}
				>
					<h2 class="text-lg sm:text-xl font-bold text-cb-text">
						{t.preferences.title}
					</h2>
					{standard && (
						<ConsentButton
							type="button"
							onClick={onRejectAll}
							class="cb-header-reject"
						>
							{t.preferences.rejectAll}
						</ConsentButton>
					)}
				</div>
				<p class="mt-2 text-sm leading-relaxed text-cb-text">
					{t.preferences.description}
					<PreferencesPolicyLinks
						privacyPolicyUrl={privacyPolicyUrl}
						cookiePolicyUrl={cookiePolicyUrl}
					/>
				</p>
				{!disclosed && (
					<p class="mt-2 text-sm" role="status">
						{t.disclosure.unavailable}
					</p>
				)}
			</div>
			<div class="flex-1 min-h-0 overflow-y-auto px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
				<div class="flex flex-col gap-3 sm:gap-4">
					{CONSENT_CATEGORIES.map((category) => {
						const essential = category === "essential";
						const copy = t.preferences.categories[category];
						return (
							<ConsentOption
								key={category}
								id={`cb-toggle-${category}`}
								label={copy.label}
								checked={essential || state[category]}
								disabled={essential || !disclosed}
								onChange={(checked) => handleToggle(category, checked)}
							>
								<p>{copy.description}</p>
							</ConsentOption>
						);
					})}
					{services.length > 0 && (
						<div class="mt-2">
							<h3 class="text-sm font-semibold text-cb-text">
								{t.preferences.externalServices}
							</h3>
							<p class="mt-1 text-xs leading-relaxed text-cb-text">
								{t.preferences.externalServicesDescription}
							</p>
						</div>
					)}
					{services.map((service) => (
						<ConsentOption
							key={service.id}
							id={`cb-service-${service.id}`}
							label={service.name}
							checked={state.services?.[service.id] === true}
							disabled={!disclosed || !hasServiceDisclosure(service)}
							onChange={(checked) =>
								setState((prev) => ({
									...prev,
									services: { ...prev.services, [service.id]: checked },
								}))
							}
						>
							{service.description && <p>{service.description}</p>}
							{service.retention && (
								<p class="mt-1">
									{t.disclosure.retention}: {service.retention}
								</p>
							)}
							{!hasServiceDisclosure(service) && (
								<p class="mt-1">{t.disclosure.unavailable}</p>
							)}
							{isPolicyUrl(service.privacyUrl) && (
								<a
									class="inline-block mt-2 text-cb-primary underline"
									href={service.privacyUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{t.overlay.privacyPolicy}
								</a>
							)}
						</ConsentOption>
					))}
				</div>
			</div>
			<div
				class={`cb-preferences-footer grid grid-cols-1 ${standard ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3 shrink-0 border-t border-cb-border p-5 sm:p-6`}
			>
				{!standard && (
					<ConsentDecisionButton
						variant="outline"
						type="button"
						onClick={onRejectAll}
					>
						{t.preferences.rejectAll}
					</ConsentDecisionButton>
				)}
				<ConsentDecisionButton
					variant={standard ? "outline" : "subtle"}
					type="button"
					onClick={() => onSave({ ...state, essential: true })}
				>
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
