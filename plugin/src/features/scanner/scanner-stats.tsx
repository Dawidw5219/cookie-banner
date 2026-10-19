import { StatCard } from "@/shared/ui/stat-card";

interface ScannerStatsProps {
	total: number;
	categorized: number;
	uncategorized: number;
	trackerCount: number;
	lastScan: string;
}

export function ScannerStats({ total, categorized, uncategorized, trackerCount, lastScan }: ScannerStatsProps) {
	return (
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
			<StatCard
				iconBg="bg-gray-900"
				value={total}
				label="Total Detected"
				icon={
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
					</svg>
				}
			/>
			<StatCard
				iconBg="bg-emerald-600"
				value={categorized}
				label="Auto-categorized"
				icon={
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
				}
			/>
			<StatCard
				iconBg="bg-amber-500"
				value={uncategorized}
				label="Needs Review"
				icon={
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
					</svg>
				}
			/>
			<StatCard
				iconBg="bg-purple-600"
				value={trackerCount}
				label="Trackers"
				icon={
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788" />
					</svg>
				}
			/>
			<StatCard
				iconBg="bg-blue-600"
				value={lastScan || "Never"}
				label="Last Scan"
				icon={
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
				}
			/>
		</div>
	);
}
