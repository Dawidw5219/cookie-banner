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

const variants: Record<Variant, string> = {
	primary: "bg-gray-900 hover:bg-gray-800 text-white",
	secondary: "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700",
	danger: "bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 text-gray-700 hover:text-red-700",
};

export function Button({
	variant = "primary",
	icon,
	children,
	class: className,
	...rest
}: ButtonProps) {
	return (
		<button
			class={`inline-flex items-center gap-2 px-5 py-2.5 font-medium text-sm rounded-lg transition-colors cursor-pointer ${variants[variant]} ${className ?? ""}`}
			{...rest}
		>
			{icon}
			{children}
		</button>
	);
}
