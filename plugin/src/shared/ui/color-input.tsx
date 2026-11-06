import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Button } from "./button";

const palette = ["#ffffff", "#111827", "#6b7280", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#d97706", "#16a34a", "#0d9488", "#0284c7"];

function normalizeHex(value: string): string | null {
	const hex = value.trim().replace(/^#/, "");
	if (/^[\da-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
	if (/^[\da-f]{3}$/i.test(hex)) return `#${[...hex].map((digit) => digit + digit).join("").toLowerCase()}`;
	return null;
}

export function ColorInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(value);
	const [invalid, setInvalid] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	useLayoutEffect(() => { setDraft(value); setInvalid(false); }, [value]);

	function commit() {
		const color = normalizeHex(draft);
		setInvalid(!color);
		if (color) { onChange(color); setDraft(color); }
		return !!color;
	}

	useEffect(() => {
		if (!open) return;
		function outside(event: PointerEvent) {
			if (!root.current?.contains(event.target as Node)) {
				const color = normalizeHex(draft);
				if (color) onChange(color);
				else setDraft(value);
				setInvalid(false);
				setOpen(false);
			}
		}
		document.addEventListener("pointerdown", outside);
		return () => document.removeEventListener("pointerdown", outside);
	}, [open, draft, value, onChange]);

	return (
		<div ref={root} class="cb-color" onKeyDown={(event) => {
			if (event.key === "Escape" && open) {
				event.preventDefault(); event.stopPropagation(); setDraft(value); setInvalid(false); setOpen(false); trigger.current?.focus();
			}
		}}>
			<button ref={trigger} id={id} type="button" class="cb-color-trigger" aria-label={`${label}: ${value}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => { setInvalid(false); setDraft(value); setOpen(!open); }}>
				<span class="cb-color-swatch" style={{ backgroundColor: value }} />
				<span>{value}</span><span class="cb-color-chevron" aria-hidden="true">⌄</span>
			</button>
			{open && <div class="cb-color-popover" role="dialog" aria-label={`Choose ${label}`}>
				<p class="cb-color-heading">Choose a color</p>
				<div class="cb-color-palette">{palette.map((color) => <button key={color} type="button" class="cb-color-swatch" style={{ backgroundColor: color }} aria-label={`Set ${label} to ${color}`} aria-pressed={value.toLowerCase() === color} onClick={() => { onChange(color); setDraft(color); setInvalid(false); }} />)}</div>
				<label class="cb-color-custom">Custom color<input type="color" aria-label={`Custom ${label}`} value={normalizeHex(value) ?? "#000000"} onInput={(event) => onChange(event.currentTarget.value)} /></label>
				<label for={`${id}-hex`}>HEX color</label>
				<input id={`${id}-hex`} type="text" value={draft} spellcheck={false} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onInput={(event) => { setDraft(event.currentTarget.value); setInvalid(false); }} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); commit(); } }} />
				{invalid && <p id={`${id}-error`} class="cb-color-error" role="alert">Use #RGB or #RRGGBB.</p>}
				<Button class="mt-3" onClick={() => { if (commit()) { setOpen(false); trigger.current?.focus(); } }}>Done</Button>
			</div>}
		</div>
	);
}
