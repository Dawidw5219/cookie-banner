import type { ComponentChildren, JSX } from "preact";

type Variant = "primary" | "secondary" | "danger";

type ButtonAttributes = Omit<
	JSX.HTMLAttributes<HTMLButtonElement>,
	"class" | "disabled" | "type"
>;

interface ButtonProps extends ButtonAttributes {
	variant?: Variant;
	icon?: ComponentChildren;
	children: ComponentChildren;
	class?: string;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
}

export function Button({
	variant = "primary",
	icon,
	children,
	class: className,
	...rest
}: ButtonProps) {
	return (
		<button
			class={`cb-admin-button cb-admin-button--${variant} ${className ?? ""}`}
			{...rest}
		>
			{icon}
			{children}
		</button>
	);
}
