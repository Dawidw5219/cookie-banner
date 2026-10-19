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

export function App() {
	const scanner = useScanner();

	return (
		<div class="max-w-5xl mx-auto py-8 px-4">
			<Header
				title="Cookie Banner"
				description="GDPR cookie consent banner with Google Consent Mode v2 support."
				icon={
					<svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
					</svg>
				}
			/>

			<div class="space-y-8">
				<BannerSettings />

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

				<ShortcodesInfo />
			</div>

			<ToastContainer />
		</div>
	);
}
