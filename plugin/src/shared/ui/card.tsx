import type { ComponentChildren } from "preact";

interface CardProps {
	title?: string;
	description?: string;
	actions?: ComponentChildren;
	children: ComponentChildren;
	class?: string;
}

export function Card({ title, description, actions, children, class: className }: CardProps) {
	return (
		<section class={`cb-card ${className ?? ""}`}>
			{title && (
				<div class="cb-card-header">
					<div class="min-w-0">
						<h2>{title}</h2>
						{description && <p>{description}</p>}
					</div>
					{actions && <div class="cb-card-actions">{actions}</div>}
				</div>
			)}
			<div class="cb-card-body">{children}</div>
		</section>
	);
}
