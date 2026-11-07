import { COOKIE_SHAPE, COOKIE_CHIPS } from "./cookie-icon";
import { ConsentButton } from "@/ui/consent-button";
interface FloatingIconProps {
	label: string;
	onClick: () => void;
}

export function FloatingIcon({ label, onClick }: FloatingIconProps) {
	return (
		<ConsentButton
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			class="fixed bottom-4 left-4 z-2147483646 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-cb-primary text-cb-on-primary shadow-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-cb-primary focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path d={COOKIE_SHAPE} fill="currentColor" opacity="0.9" />
				{COOKIE_CHIPS.map((chip) => (
					<circle key={`${chip.cx}-${chip.cy}`} {...chip} fill="var(--cb-primary)" />
				))}
			</svg>
		</ConsentButton>
	);
}
