import type { JSX } from "preact";

interface FieldBaseProps {
	label: string;
	description?: string | null;
	children?: never;
}

interface TextFieldProps extends FieldBaseProps {
	type: "text" | "url";
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
}

interface ColorFieldProps extends FieldBaseProps {
	type: "color";
	value: string;
	onChange: (value: string) => void;
}

interface SelectFieldProps extends FieldBaseProps {
	type: "select";
	value: string;
	options: Record<string, string>;
	onChange: (value: string) => void;
}

interface CheckboxFieldProps extends FieldBaseProps {
	type: "checkbox";
	value: string;
	onChange: (value: string) => void;
}

type FieldProps = TextFieldProps | ColorFieldProps | SelectFieldProps | CheckboxFieldProps;

export function Field(props: FieldProps) {
	const { label, description, type } = props;

	if (type === "checkbox") {
		return (
			<label class="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0 cursor-pointer">
				<input
					type="checkbox"
					checked={props.value === "1"}
					onChange={(e) =>
						props.onChange((e.target as HTMLInputElement).checked ? "1" : "")
					}
					class="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
				/>
				<div>
					<span class="text-sm font-medium text-gray-900">{label}</span>
					{description && (
						<p
							class="text-xs text-gray-500 mt-0.5"
							dangerouslySetInnerHTML={{ __html: description }}
						/>
					)}
				</div>
			</label>
		);
	}

	return (
		<div class="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
			<div class="shrink-0">
				<label class="text-sm font-medium text-gray-900">{label}</label>
				{description && (
					<p
						class="text-xs text-gray-500 mt-0.5"
						dangerouslySetInnerHTML={{ __html: description }}
					/>
				)}
			</div>
			<div class="flex-1 max-w-xs">
				{type === "color" && <ColorInput value={props.value} onChange={props.onChange} />}
				{type === "select" && (
					<select
						value={props.value}
						onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
					>
						{Object.entries(props.options).map(([val, text]) => (
							<option key={val} value={val}>{text}</option>
						))}
					</select>
				)}
				{(type === "text" || type === "url") && (
					<input
						type={type}
						value={props.value}
						placeholder={(props as TextFieldProps).placeholder}
						onInput={(e) => props.onChange((e.target as HTMLInputElement).value)}
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
					/>
				)}
			</div>
		</div>
	);
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<div class="flex items-center gap-2">
			<input
				type="color"
				value={value}
				onInput={(e) => onChange((e.target as HTMLInputElement).value)}
				class="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
			/>
			<input
				type="text"
				value={value}
				onInput={(e) => onChange((e.target as HTMLInputElement).value)}
				class="w-24 text-sm font-mono border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
			/>
		</div>
	);
}
