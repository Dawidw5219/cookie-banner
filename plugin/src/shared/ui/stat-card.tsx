import type { ComponentChildren } from "preact";

interface StatCardProps {
	icon: ComponentChildren;
	iconBg: string;
	value: string | number;
	label: string;
}

export function StatCard({ icon, iconBg, value, label }: StatCardProps) {
	return (
		<div class="rounded-xl bg-white p-5 border border-gray-200 hover:border-gray-300 transition-colors">
			<div class="flex items-start gap-4">
				<div class={`shrink-0 w-11 h-11 ${iconBg} rounded-lg flex items-center justify-center`}>
					{icon}
				</div>
				<div>
					<div class="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
					<div class="text-sm font-medium text-gray-500 mt-0.5">{label}</div>
				</div>
			</div>
		</div>
	);
}
