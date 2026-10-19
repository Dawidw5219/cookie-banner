import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { Tracker } from "./use-scanner";

interface TrackerServicesProps {
	trackers: Tracker[];
	auditActive: boolean;
	onStartAudit: () => void;
	onStopAudit: () => void;
}

const TRACKER_COLORS: Record<string, { bg: string; text: string }> = {
	ga4: { bg: "#E37400", text: "#fff" },
	gtm: { bg: "#4285F4", text: "#fff" },
	meta: { bg: "#1877F2", text: "#fff" },
	fbpixel: { bg: "#1877F2", text: "#fff" },
	hotjar: { bg: "#FF3C00", text: "#fff" },
	clarity: { bg: "#5C2D91", text: "#fff" },
	tiktok: { bg: "#010101", text: "#fff" },
	linkedin: { bg: "#0A66C2", text: "#fff" },
	pinterest: { bg: "#E60023", text: "#fff" },
	snapchat: { bg: "#FFFC00", text: "#333" },
	hubspot: { bg: "#FF7A59", text: "#fff" },
	gads: { bg: "#4285F4", text: "#fff" },
	twitter: { bg: "#000", text: "#fff" },
};

function TrackerIcon({ id, name }: { id: string; name: string }) {
	const color = TRACKER_COLORS[id] || { bg: "#6b7280", text: "#fff" };
	const initials = name.slice(0, 2).toUpperCase();
	return (
		<div
			class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
			style={{ backgroundColor: color.bg, color: color.text }}
		>
			{initials}
		</div>
	);
}

const CATEGORY_COLORS: Record<string, string> = {
	Analytics: "bg-blue-100 text-blue-800",
	Marketing: "bg-purple-100 text-purple-800",
	Functional: "bg-emerald-100 text-emerald-800",
};

const AUDIT_BADGE: Record<string, { class: string; label: string; icon: string }> = {
	ok: { class: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Respects consent", icon: "M5 13l4 4L19 7" },
	violation: { class: "bg-red-100 text-red-800 border-red-200", label: "Loads without consent", icon: "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" },
};

export function TrackerServices({ trackers, auditActive, onStartAudit, onStopAudit }: TrackerServicesProps) {
	return (
		<Card>
			<div class="flex items-center justify-between mb-5">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">
						Detected Services
						{trackers.length > 0 && (
							<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
								{trackers.length}
							</span>
						)}
					</h2>
					<p class="text-sm text-gray-500 mt-1">
						Tracking scripts and services detected on your site during scanning.
					</p>
				</div>
				<div class="flex items-center gap-3">
					{auditActive ? (
						<>
							<span class="relative flex h-3 w-3">
								<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
								<span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
							</span>
							<span class="text-sm font-medium text-amber-700">Audit Active</span>
							<Button variant="secondary" onClick={onStopAudit}>
								Stop Audit
							</Button>
						</>
					) : (
						<button
							type="button"
							onClick={onStartAudit}
							title="Block all consents and check which trackers still load"
							class="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 text-sm font-medium rounded-lg transition-colors cursor-pointer"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
							</svg>
							Audit Consent
						</button>
					)}
				</div>
			</div>

			{trackers.length === 0 ? (
				<div class="py-8 text-center">
					<svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
					</svg>
					<h3 class="text-base font-medium text-gray-900 mb-1">No tracking services detected</h3>
					<p class="text-sm text-gray-500">Start a scan and browse your site to detect tracking scripts.</p>
				</div>
			) : (
				<>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{trackers.map((t) => (
							<div key={t.tracker_id} class="rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
								<div class="flex items-start gap-3">
									<TrackerIcon id={t.tracker_id} name={t.name} />
									<div class="flex-1 min-w-0">
										<h4 class="text-sm font-semibold text-gray-900 truncate mb-1">{t.name}</h4>
										<div class="flex flex-wrap items-center gap-1.5 mb-2">
											<span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[t.category] || "bg-gray-100 text-gray-700"}`}>
												{t.category}
											</span>
											{t.audit_status && AUDIT_BADGE[t.audit_status] && (
												<span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${AUDIT_BADGE[t.audit_status].class}`}>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={AUDIT_BADGE[t.audit_status].icon} />
													</svg>
													{AUDIT_BADGE[t.audit_status].label}
												</span>
											)}
										</div>
										<p class="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
										<div class="flex items-center justify-between text-[10px] text-gray-400">
											<span>
												{t.pages.length > 0 && `${t.pages.length} page${t.pages.length !== 1 ? "s" : ""}`}
											</span>
											{t.privacy_link && (
												<a
													href={t.privacy_link}
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-500 hover:text-blue-700 transition-colors no-underline"
												>
													Privacy
													<svg class="inline w-2.5 h-2.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
													</svg>
												</a>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					<div class="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
						<h4 class="text-sm font-medium text-amber-900 mb-1">Consent Audit</h4>
						<p class="text-xs text-amber-700">
							Click "Audit Consent" to force deny-all mode and check which trackers still load without user consent.
							Browse your site during audit, then stop to see results.
							Trackers that load despite denied consent are marked as violations.
						</p>
					</div>
				</>
			)}
		</Card>
	);
}
