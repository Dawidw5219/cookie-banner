import { Badge, CategoryBadge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { Tracker } from "./use-scanner";

interface TrackerServicesProps {
	trackers: Tracker[];
	auditActive: boolean;
	onStartAudit: () => void;
	onStopAudit: () => void;
}

function TrackerIcon({ name }: { name: string }) {
	return <span class="cb-provider-icon" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}

const AUDIT_BADGE: Record<string, { label: string; icon: string }> = {
	not_observed: { label: "No request observed in audit", icon: "M12 8v4m0 4h.01" },
	violation: { label: "Request observed during deny-all", icon: "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" },
};

export function TrackerServices({ trackers, auditActive, onStartAudit, onStopAudit }: TrackerServicesProps) {
	return (
		<Card
			title="Detected Services"
			description="Tracking scripts and services detected on your site during scanning."
			actions={
				<>
					{trackers.length > 0 && <Badge>{trackers.length} providers</Badge>}
					{auditActive && <Badge tone="warning">Audit Active</Badge>}
					<Button variant="secondary" onClick={auditActive ? onStopAudit : onStartAudit}>
						{auditActive ? "Stop Audit" : "Audit Consent"}
					</Button>
				</>
			}
		>
			{trackers.length === 0 ? (
				<EmptyState icon="diagnostics" title="No tracking services detected" description="Start a scan and browse your site to detect tracking scripts." />
			) : (
				<>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{trackers.map((t) => (
							<div key={t.tracker_id} class="cb-provider-card">
								<div class="flex items-start gap-3">
									<TrackerIcon name={t.name} />
									<div class="flex-1 min-w-0">
										<h4 class="text-sm font-semibold text-gray-900 truncate mb-1">{t.name}</h4>
										<div class="flex flex-wrap items-center gap-1.5 mb-2">
											<CategoryBadge category={t.category} />
											{t.audit_status && AUDIT_BADGE[t.audit_status] && (
												<span class={`cb-badge cb-badge--${t.audit_status === "not_observed" ? "neutral" : "danger"}`}>
													<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={AUDIT_BADGE[t.audit_status].icon} />
													</svg>
													{AUDIT_BADGE[t.audit_status].label}
												</span>
											)}
										</div>
										<p class="cb-help mb-3">{t.description}</p>
										<div class="cb-provider-meta">
											<span>
												{t.pages.length > 0 && `${t.pages.length} page${t.pages.length !== 1 ? "s" : ""}`}
											</span>
											{t.privacy_link && (
												<a
													href={t.privacy_link}
													target="_blank"
													rel="noopener noreferrer"
													class="cb-text-link"
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

					<div class="cb-callout">
						<h4 class="cb-callout-title">Consent Audit</h4>
						<p class="cb-help">
							Click "Audit Consent" to force deny-all mode and check which trackers still load without user consent.
							Browse your site during audit, then stop to see results.
							Observed requests during deny-all are marked as violations. A missing request does not prove consent compliance.
						</p>
					</div>
				</>
			)}
		</Card>
	);
}
