import { Card } from "@/shared/ui/card";
import type { useSettings } from "@/features/settings/use-settings";
import type { useScanner } from "@/features/scanner/use-scanner";
import type { useDiagnostics } from "@/features/diagnostics/use-diagnostics";
import type { useServices } from "@/features/services/use-services";
import type { AdminSection } from "@/app";
import { wp } from "@/shared/types/wp";

export function SetupOverview({
	settings,
	scanner,
	diagnostics,
	services,
	navigate,
}: {
	settings: ReturnType<typeof useSettings>;
	scanner: ReturnType<typeof useScanner>;
	diagnostics: ReturnType<typeof useDiagnostics>;
	services: ReturnType<typeof useServices>;
	navigate: (section: AdminSection) => void;
}) {
	const checks: {
		title: string;
		description: string;
		ready: boolean;
		section: AdminSection;
	}[] = [
		{
			title: "Add your privacy policy",
			description: "Give visitors a clear destination for privacy information.",
			ready: !!settings.settings?.privacy_policy_url && !settings.dirty,
			section: "appearance",
		},
		{
			title: "Discover cookies and providers",
			description:
				"Scan your real pages and interactions, not just the homepage.",
			ready: !!scanner.lastScan && !scanner.error,
			section: "cookies",
		},
		{
			title: "Categorize detected cookies",
			description:
				"Review unknown cookies and confirm the actual purpose of every provider.",
			ready:
				!!scanner.lastScan && scanner.uncategorized === 0 && !scanner.error,
			section: "cookies",
		},
		{
			title: "Confirm blocking prerequisites",
			description:
				"Verify the frontend headers, cache setup and request behavior before launch.",
			ready:
				!!diagnostics.data?.strictCsp &&
				!!diagnostics.data?.parser &&
				diagnostics.data.otherConsentPlugins.length === 0,
			section: "diagnostics",
		},
	];
	const complete = checks.filter((item) => item.ready).length;
	return (
		<div class="space-y-6">
			<div class="rounded-2xl bg-gray-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 justify-between">
				<div>
					<p class="text-xs uppercase tracking-widest text-gray-400">
						Your consent workspace
					</p>
					<h2 class="text-2xl font-semibold mt-2" style={{ color: "#fff" }}>
						Make privacy part of your website.
					</h2>
					<p class="text-sm text-gray-300 mt-3 max-w-xl">
						Set up the banner, review what your site loads and keep optional
						services behind a visitor's choice. Everything stays in WordPress.
					</p>
				</div>
				<a
					href={wp.homeUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="self-start shrink-0 rounded-lg border border-gray-600 px-4 py-2 text-sm text-white"
					style={{ color: "#fff" }}
				>
					Open website ↗
				</a>
			</div>
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					["Cookies found", scanner.total],
					["Providers found", scanner.trackerCount],
					["Need review", scanner.uncategorized],
					["Custom integrations", services.services.length],
				].map(([label, value]) => (
					<div
						key={label}
						class="rounded-xl border border-gray-200 bg-white p-5"
					>
						<p class="text-xs text-gray-500">{label}</p>
						<p class="text-2xl font-semibold mt-2 text-gray-900">
							{scanner.loading || services.loading ? "—" : value}
						</p>
					</div>
				))}
			</div>
			<Card
				title="Setup checklist"
				description="A practical starting point based on saved settings and scanner data. It does not replace reviewing your website or its legal obligations."
			>
				<div class="flex justify-between gap-4 text-xs text-gray-500 mb-2">
					<span>Configuration steps</span>
					<span>
						{complete} of {checks.length} configured
					</span>
				</div>
				<div
					role="progressbar"
					aria-label="Setup configuration"
					aria-valuenow={complete}
					aria-valuemin={0}
					aria-valuemax={checks.length}
					class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5"
				>
					<div
						class="bg-gray-900 h-full rounded-full"
						style={{ width: `${(complete / checks.length) * 100}%` }}
					/>
				</div>
				<ul class="divide-y divide-gray-100">
					{checks.map((check, index) => (
						<li key={check.title} class="py-4 flex items-start gap-4">
							<span
								class={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs ${check.ready ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-500"}`}
							>
								{check.ready ? "✓" : index + 1}
							</span>
							<div class="flex-1">
								<h3 class="text-sm font-semibold text-gray-900">
									{check.title}
								</h3>
								<p class="text-xs text-gray-500 mt-1">{check.description}</p>
							</div>
							<button
								class="text-sm underline underline-offset-4 shrink-0"
								onClick={() => navigate(check.section)}
							>
								Review
							</button>
						</li>
					))}
				</ul>
			</Card>
			<div class="grid md:grid-cols-2 gap-6">
				<Card
					title="A service missing from the catalog?"
					description="Add its name, purpose and URLs once. The existing scanner and blockers share those rules."
				>
					<button
						class="text-sm font-medium underline underline-offset-4"
						onClick={() => navigate("services")}
					>
						Manage custom services →
					</button>
				</Card>
				<Card
					title="Using a page builder or cache?"
					description="See detected integrations and check the actual headers returned by your homepage."
				>
					<button
						class="text-sm font-medium underline underline-offset-4"
						onClick={() => navigate("diagnostics")}
					>
						Open diagnostics →
					</button>
				</Card>
			</div>
		</div>
	);
}
