interface ToggleProps {
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
	id: string;
}

export function Toggle({ checked, disabled, onChange, id }: ToggleProps) {
	return (
		<button
			id={id}
			role="switch"
			type="button"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => !disabled && onChange(!checked)}
			style={{
				width: "52px",
				height: "28px",
				borderRadius: "14px",
				padding: "2px",
				border: "none",
				cursor: disabled ? "not-allowed" : "pointer",
				backgroundColor: disabled
					? "var(--cb-primary)"
					: checked
						? "var(--cb-primary)"
						: "#d1d5db",
				opacity: disabled ? 0.5 : 1,
				transition: "background-color 200ms ease",
				display: "inline-flex",
				alignItems: "center",
				flexShrink: 0,
				outline: "none",
				position: "relative",
			}}
		>
			<span
				style={{
					width: "24px",
					height: "24px",
					borderRadius: "12px",
					backgroundColor: "#ffffff",
					boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)",
					transition: "transform 200ms ease",
					transform: checked ? "translateX(24px)" : "translateX(0px)",
					pointerEvents: "none",
					display: "block",
				}}
			/>
		</button>
	);
}
