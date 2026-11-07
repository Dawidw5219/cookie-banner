import type { ComponentChildren } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import { t } from "../i18n";

export function ConsentPanel({
	children,
	class: extra = "",
	label,
	onDismiss,
	showClose = true,
}: {
	children: ComponentChildren;
	class?: string;
	label: string;
	onDismiss: () => void;
	showClose?: boolean;
}) {
	const panel = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		const host = document.getElementById("cookie-consent-host");
		const active = document.activeElement;
		const previous = (
			active === host ? host?.shadowRoot?.activeElement : active
		) as HTMLElement | null;
		const element = panel.current;
		if (!element) return;
		const inertElements = new Set<HTMLElement>();
		const isolate = () => {
			for (const child of document.body.children) {
				if (child instanceof HTMLElement && child !== host && !child.inert) {
					child.inert = true;
					inertElements.add(child);
				}
			}
		};
		isolate();
		const observer = new MutationObserver(isolate);
		observer.observe(document.body, { childList: true });
		element.focus();
		const trap = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onDismiss();
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = [
				...element.querySelectorAll<HTMLElement>(
					'button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
				),
			].filter(
				(control) =>
					control.getClientRects().length &&
					!control.closest("[hidden],[inert]"),
			);
			const active =
				element.getRootNode() instanceof ShadowRoot
					? (element.getRootNode() as ShadowRoot).activeElement
					: document.activeElement;
			const index = focusable.indexOf(active as HTMLElement);
			// Explicit traversal also reaches buttons when Safari's system setting
			// otherwise limits Tab to form fields and links.
			event.preventDefault();
			if (!focusable.length) {
				element.focus();
				return;
			}
			const next = event.shiftKey
				? index <= 0
					? focusable.length - 1
					: index - 1
				: (index + 1) % focusable.length;
			focusable[next].focus();
		};
		element.addEventListener("keydown", trap);
		return () => {
			element.removeEventListener("keydown", trap);
			observer.disconnect();
			for (const child of inertElements) child.inert = false;
			queueMicrotask(() => {
				if (
					document.activeElement !== document.body &&
					document.activeElement !== host
				)
					return;
				if (
					previous?.isConnected &&
					previous !== host &&
					previous !== document.body
				)
					previous.focus();
				else
					host?.shadowRoot
						?.querySelector<HTMLElement>("button[title]")
						?.focus();
			});
		};
	}, []);
	return (
		<div class="fixed inset-0 z-2147483647 flex items-end sm:items-center justify-center bg-cb-overlay backdrop-blur-sm">
			<div
				ref={panel}
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-label={label}
				class={`relative max-h-[90vh] overflow-y-auto outline-none w-full sm:mx-4 sm:max-w-xl rounded-t-cb sm:rounded-cb bg-cb-bg shadow-2xl ${extra}`.trim()}
			>
				{showClose && (
					<button
						type="button"
						onClick={onDismiss}
						aria-label={t.close}
						class="cb-panel-close"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							aria-hidden="true"
						>
							<path d="m6 6 12 12M18 6 6 18" />
						</svg>
					</button>
				)}
				{children}
			</div>
		</div>
	);
}
