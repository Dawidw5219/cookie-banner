import { COOKIE_SHAPE, COOKIE_CHIPS } from "../../src/ui/cookie-icon";
import { useEffect, useState } from "preact/hooks";
import { useSettings } from "@/features/settings/use-settings";
import { useServices } from "@/features/services/use-services";
import { ServiceManager } from "@/features/services/service-manager";
import { useDiagnostics } from "@/features/diagnostics/use-diagnostics";
import { DiagnosticsPanel } from "@/features/diagnostics/diagnostics-panel";
import { SetupOverview } from "@/features/overview/setup-overview";
import { Button } from "@/shared/ui/button";
import { Header } from "@/shared/layout/header";
import { ToastContainer } from "@/shared/ui/toast";
import { BannerSettings } from "@/features/settings/banner-settings";
import { ScannerStats } from "@/features/scanner/scanner-stats";
import { ScannerControls } from "@/features/scanner/scanner-controls";
import { TrackerServices } from "@/features/scanner/tracker-services";
import { CookieTable } from "@/features/scanner/cookie-table";
import { AddCookieForm } from "@/features/scanner/add-cookie-form";
import { ShortcodesInfo } from "@/features/shortcodes/shortcodes-info";
import { useScanner } from "@/features/scanner/use-scanner";

const sections = [
	["overview", "Overview"],
	["appearance", "Banner & texts"],
	["services", "Services"],
	["cookies", "Cookies & scan"],
	["integration", "WordPress integration"],
	["diagnostics", "Diagnostics"],
] as const;
export type AdminSection = (typeof sections)[number][0];
function currentSection(): AdminSection {
	const key = location.hash.slice(1);
	return sections.find(([id]) => id === key)?.[0] || "overview";
}
export function App() {
	const scanner = useScanner();
	const settings = useSettings();
	const services = useServices();
	const diagnostics = useDiagnostics();
	const [section, setSection] = useState<AdminSection>(currentSection);
	const [opened, setOpened] = useState<Set<AdminSection>>(
		() => new Set([section]),
	);
	function navigate(next: AdminSection) {
		// Settings and service drafts stay mounted across sections.
		setOpened((current) => new Set([...current, next]));
		setSection(next);
		history.replaceState(null, "", `#${next}`);
	}
	useEffect(() => {
		const update = () => navigate(currentSection());
		window.addEventListener("hashchange", update);
		return () => window.removeEventListener("hashchange", update);
	}, []);
	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (settings.dirty) {
				event.preventDefault();
				event.returnValue = "";
			}
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [settings.dirty]);

	return (
		<div class="max-w-7xl mx-auto py-8 px-4">
			<Header
				title="Cookie Banner"
				description="Consent, content blocking and cookie discovery — managed in WordPress."
				icon={
					<svg
						class="w-7 h-7 text-white"
						aria-hidden="true"
						data-cookie4-brand="cookie"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							d={COOKIE_SHAPE}
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						{COOKIE_CHIPS.map((chip) => (
							<circle
								key={`${chip.cx}-${chip.cy}`}
								cx={chip.cx}
								cy={chip.cy}
								r={chip.r * 0.65}
								fill="currentColor"
								stroke="none"
							/>
						))}
					</svg>
				}
			/>

			<nav
				aria-label="Cookie Banner sections"
				class="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-2 mb-6"
			>
				{sections.map(([id, label]) => (
					<button
						type="button"
						key={id}
						aria-current={section === id ? "page" : undefined}
						onClick={() => navigate(id)}
						class={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
					>
						{label}
					</button>
				))}
			</nav>
			{settings.dirty && (
				<div
					role="status"
					class="mb-5 rounded-xl bg-amber-50 text-amber-900 text-sm p-4 flex flex-wrap justify-between items-center gap-3"
				>
					<span>
						Your banner settings have unsaved changes. Switching sections keeps
						your draft.
					</span>
					<Button disabled={settings.saving} onClick={settings.save}>
						{settings.saving ? "Saving…" : "Save banner settings"}
					</Button>
				</div>
			)}
			{settings.error && (
				<div
					role="alert"
					class="mb-5 rounded-xl bg-red-50 p-4 text-red-800 text-sm"
				>
					{settings.error}{" "}
					<button class="underline" onClick={settings.reload}>
						Retry settings
					</button>
				</div>
			)}
			{scanner.error && (
				<div
					role="alert"
					class="mb-5 rounded-xl bg-red-50 p-4 text-red-800 text-sm"
				>
					{scanner.error}{" "}
					<button class="underline" onClick={scanner.refresh}>
						Retry scanner
					</button>
				</div>
			)}
			{section === "overview" && (
				<SetupOverview
					settings={settings}
					scanner={scanner}
					services={services}
					diagnostics={diagnostics}
					navigate={navigate}
				/>
			)}
			{opened.has("appearance") && (
				<div hidden={section !== "appearance"}>
					<BannerSettings model={settings} services={services.services} />
				</div>
			)}
			{opened.has("services") && (
				<div hidden={section !== "services"}>
					<ServiceManager model={services} />
				</div>
			)}
			<div hidden={section !== "cookies"} class="space-y-8">
				<ScannerStats
					total={scanner.total}
					categorized={scanner.categorized}
					uncategorized={scanner.uncategorized}
					trackerCount={scanner.trackerCount}
					lastScan={scanner.lastScan}
				/>

				<ScannerControls
					scanActive={scanner.scanActive}
					scanUrl={scanner.scanUrl}
					total={scanner.total}
					cookies={scanner.cookies}
					onRefresh={scanner.refresh}
					onClear={scanner.clearAll}
					onExport={scanner.exportCookies}
					onImport={scanner.importCookies}
				/>

				<TrackerServices
					trackers={scanner.trackers}
					auditActive={scanner.auditActive}
					onStartAudit={scanner.startAudit}
					onStopAudit={scanner.stopAudit}
				/>

				<CookieTable
					cookies={scanner.cookies}
					onUpdateCategory={scanner.updateCategory}
				/>

				<AddCookieForm onAdd={scanner.addCookie} />
			</div>
			{section === "integration" && <ShortcodesInfo />}
			{opened.has("diagnostics") && (
				<div hidden={section !== "diagnostics"}>
					<DiagnosticsPanel model={diagnostics} />
				</div>
			)}

			<ToastContainer />
		</div>
	);
}
