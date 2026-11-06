import type { ComponentChildren } from "preact";

interface StatCardProps {
	icon: ComponentChildren;
	value: string | number;
	valueTitle?: string;
	label: string;
}

export function StatCard({ icon, value, valueTitle, label }: StatCardProps) {
	return (
		<div class="cb-stat-card">
			<div class="flex items-start gap-4">
				<div class="cb-stat-icon">
					{icon}
				</div>
				<div class="min-w-0">
					<div class="cb-stat-value" title={valueTitle}>{value}</div>
					<div class="cb-stat-label">{label}</div>
				</div>
			</div>
		</div>
	);
}
