import type { ComponentChildren } from "preact";
import { Toggle } from "../ui/toggle";

type ConsentOptionProps = {
	id: string;
	label: string;
	checked: boolean;
	disabled?: boolean;
	children: ComponentChildren;
	onChange: (checked: boolean) => void;
};

export function ConsentOption({
	id,
	label,
	checked,
	disabled,
	children,
	onChange,
}: ConsentOptionProps) {
	return (
		<div class="cb-preference-option rounded-cb border border-cb-border bg-cb-surface p-3 sm:p-4">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<label for={id} class="text-sm font-semibold text-cb-text">
						{label}
					</label>
					<div class="mt-1 text-xs leading-relaxed text-cb-text">
						{children}
					</div>
				</div>
				<div class="shrink-0 pt-0.5">
					<Toggle
						id={id}
						checked={checked}
						disabled={disabled}
						onChange={onChange}
					/>
				</div>
			</div>
		</div>
	);
}
