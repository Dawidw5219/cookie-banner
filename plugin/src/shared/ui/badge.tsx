import type { ComponentChildren } from "preact";

export function Badge({ tone = "neutral", children }: {
	tone?: "neutral" | "success" | "warning" | "danger";
	children: ComponentChildren;
}) {
	return <span class={`cb-badge cb-badge--${tone}`}>{children}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
	return <Badge tone={!category || category === "Unknown" ? "warning" : "neutral"}>{category || "Unknown"}</Badge>;
}
