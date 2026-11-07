import { COOKIE_SHAPE, COOKIE_CHIPS } from "../core/cookie-artwork";

export function CookieIcon({ chipFill = "var(--cb-bg)", opacity = 1 }: {
	chipFill?: string;
	opacity?: number;
}) {
	return (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d={COOKIE_SHAPE} fill="currentColor" opacity={opacity} />
			{COOKIE_CHIPS.map((chip) => (
				<circle key={`${chip.cx}-${chip.cy}`} {...chip} fill={chipFill} />
			))}
		</svg>
	);
}
