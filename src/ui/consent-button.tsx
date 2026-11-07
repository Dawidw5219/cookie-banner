import type { JSX } from "preact";
import { ConfigContext } from "../hooks/use-consent";
import { useContext, useLayoutEffect, useRef } from "preact/hooks";

type ConsentButtonProps = Omit<
	JSX.IntrinsicElements["button"],
	"onClick" | "ref"
> & {
	onClick: () => void;
};

// WP Rocket otherwise queues click listeners until every delayed script loads.
const immediateListener: AddEventListenerOptions & { isRocket: boolean } = {
	isRocket: true,
};

export function ConsentButton({ onClick, ...props }: ConsentButtonProps) {
	const ref = useRef<HTMLButtonElement>(null);
	useLayoutEffect(() => {
		const button = ref.current;
		if (!button) return;
		const handleClick = (event: MouseEvent) => {
			// Do not let Rocket queue and replay a consent action a second time.
			event.stopPropagation();
			onClick();
		};
		button.addEventListener("click", handleClick, immediateListener);
		return () =>
			button.removeEventListener("click", handleClick, immediateListener);
	}, [onClick]);
	return <button {...props} ref={ref} />;
}

/** Shared geometry with explicit visual roles for consent actions. */
export function ConsentDecisionButton({
	variant = "primary",
	...props
}: Omit<ConsentButtonProps, "class" | "style"> & {
	variant?: "primary" | "outline" | "subtle";
}) {
	const config = useContext(ConfigContext);
	const appearance =
		(config?.buttonStyle ?? "standard") !== "standard" && variant === "outline"
			? "primary"
			: variant;
	return (
		<ConsentButton {...props} class={`cb-decision cb-decision-${appearance}`} />
	);
}

export function ConsentSettingsButton({
	appearance = "link",
	...props
}: Omit<ConsentButtonProps, "class" | "style"> & {
	appearance?: "link" | "outline";
}) {
	return (
		<ConsentButton
			{...props}
			class={
				appearance === "outline"
					? "cb-settings cb-settings-inline"
					: "cb-settings"
			}
		/>
	);
}
