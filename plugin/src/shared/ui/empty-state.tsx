import { SectionIcon } from "./section-icon";
import type { AdminSection } from "@/app";

export function EmptyState({ title, description, icon }: {
	title: string;
	description: string;
	icon: AdminSection;
}) {
	return (
		<div class="cb-empty-state">
			<span class="cb-empty-icon"><SectionIcon section={icon} /></span>
			<h3>{title}</h3>
			<p>{description}</p>
		</div>
	);
}
