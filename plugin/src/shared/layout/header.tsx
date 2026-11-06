import { SectionIcon } from "@/shared/ui/section-icon";

interface HeaderProps {
	title: string;
	description: string;
	icon: preact.JSX.Element;
}

export function Header({ title, description, icon }: HeaderProps) {
	return (
		<header class="cb-header">
			<div class="cb-header-mark">
				<div class="cb-header-icon">
					{icon}
				</div>
			</div>
			<div class="cb-header-brand">
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/5 rounded-full">
					<SectionIcon section="diagnostics" />
					<span class="text-sm font-medium text-gray-700">Made in EU</span>
					<span class="text-xs font-medium text-gray-600">by App4You</span>
				</span>
			</div>
			<h1>{title}</h1>
			<p class="cb-header-description">{description}</p>
		</header>
	);
}
