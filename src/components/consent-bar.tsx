import { ConfigContext } from "../hooks/use-consent";
import { useContext, useLayoutEffect, useRef } from "preact/hooks";
import { t } from "../i18n";
import { hasCompleteDisclosure } from "../core/disclosure";
import {
	ConsentDecisionButton,
	ConsentSettingsButton,
} from "../ui/consent-button";
import { BannerDescription, PolicyLinks } from "./policy-links";

export function ConsentBar({
	privacyPolicyUrl,
	cookiePolicyUrl,
	onAcceptAll,
	onOpenPreferences,
	onRejectAll,
}: {
	privacyPolicyUrl?: string;
	cookiePolicyUrl?: string;
	onAcceptAll: () => void;
	onOpenPreferences: () => void;
	onRejectAll: () => void;
}) {
	const bar = useRef<HTMLDivElement>(null);
	const config = useContext(ConfigContext);
	const equal = config?.buttonStyle === "equal";
	useLayoutEffect(() => {
		const element = bar.current;
		if (!element) return;
		const body = document.body;
		const original = body.style.paddingBottom;
		const padding = getComputedStyle(body).paddingBottom;
		let owned = "";
		const resize = () => {
			owned = `calc(${padding} + ${element.getBoundingClientRect().height}px)`;
			body.style.paddingBottom = owned;
			owned = body.style.paddingBottom;
		};
		const reveal = () => {
			const active = document.activeElement;
			if (
				!(active instanceof HTMLElement) ||
				active.id === "cookie-consent-host"
			)
				return;
			const overlap =
				active.getBoundingClientRect().bottom -
				element.getBoundingClientRect().top +
				8;
			if (overlap > 0) window.scrollBy(0, overlap);
		};
		const observer =
			typeof ResizeObserver === "undefined"
				? undefined
				: new ResizeObserver(resize);
		observer?.observe(element);
		window.addEventListener("resize", resize);
		resize();
		document.addEventListener("focusin", reveal);
		return () => {
			observer?.disconnect();
			window.removeEventListener("resize", resize);
			document.removeEventListener("focusin", reveal);
			if (body.style.paddingBottom === owned)
				body.style.paddingBottom = original;
		};
	}, []);
	return (
		<div
			ref={bar}
			role="region"
			aria-label={t.overlay.title}
			class="fixed bottom-0 left-0 right-0 z-2147483647 max-h-[80vh] overflow-y-auto"
		>
			<div class="w-full bg-cb-bg shadow-[0_-4px_24px_rgba(0,0,0,0.15)] border-t border-cb-text/10">
				<div class="mx-auto max-w-7xl px-4 sm:px-8 py-3 sm:py-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
					<p class="flex-1 text-xs sm:text-sm leading-relaxed text-cb-text">
						<BannerDescription />
						<PolicyLinks
							privacyPolicyUrl={privacyPolicyUrl}
							cookiePolicyUrl={cookiePolicyUrl}
						/>
					</p>
					<div class="cb-bar-actions shrink-0 w-full lg:w-auto lg:min-w-max">
						<ConsentSettingsButton type="button" onClick={onOpenPreferences}>
							{t.overlay.advancedSettings}
						</ConsentSettingsButton>
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
								disabled={!hasCompleteDisclosure(window.__cookieConsent)}
							>
								{t.overlay.acceptAll}
							</ConsentDecisionButton>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
