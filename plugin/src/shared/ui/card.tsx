import type { ComponentChildren } from "preact";

interface CardProps {
	title?: string;
	description?: string;
	children: ComponentChildren;
	class?: string;
}

export function Card({ title, description, children, class: className }: CardProps) {
	return (
		<div class={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className ?? ""}`}>
			{title && (
				<div class="p-6 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
					{description && (
						<p class="text-sm text-gray-500 mt-1">{description}</p>
					)}
				</div>
			)}
			<div class="p-6">{children}</div>
		</div>
	);
}
