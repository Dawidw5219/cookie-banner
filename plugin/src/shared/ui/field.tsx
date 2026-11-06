import { useId } from "preact/hooks";
import { ColorInput } from "./color-input";

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
	const id = useId();

	if (type === "checkbox") {
		return (
			<div class="cb-toggle-row">
				<div>
					<label for={id} class="cb-field-label">{label}</label>
					{description && <p id={`${id}-description`} class="cb-field-description" dangerouslySetInnerHTML={{ __html: description }} />}
				</div>
				<label class="cb-switch">
					<input id={id} type="checkbox" role="switch" aria-describedby={description ? `${id}-description` : undefined}
						checked={props.value === "1"} onChange={(event) => props.onChange(event.currentTarget.checked ? "1" : "")} />
					<span aria-hidden="true" />
				</label>
			</div>
		);
	}

	return (
		<div class="cb-field">
			<div class="min-w-0">
				<label for={id} class="cb-field-label">{label}</label>
				{description && (
					<p
						class="cb-field-description"
						dangerouslySetInnerHTML={{ __html: description }}
					/>
				)}
			</div>
			<div class="w-full min-w-0">
				{type === "color" && <ColorInput id={id} label={label} value={props.value} onChange={props.onChange} />}
				{type === "select" && (
					<select
						id={id}
						value={props.value}
						onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
					>
						{Object.entries(props.options).map(([val, text]) => (
							<option key={val} value={val}>{text}</option>
						))}
					</select>
				)}
				{(type === "text" || type === "url") && (
					<input
						type={type}
						id={id}
						value={props.value}
						placeholder={props.placeholder}
						onInput={(e) => props.onChange((e.target as HTMLInputElement).value)}
					/>
				)}
			</div>
		</div>
	);
}
