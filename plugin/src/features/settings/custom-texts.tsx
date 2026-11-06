import { useId } from "preact/hooks";
import { TEXT_SCHEMA, getDefaultText, type TextEntry } from "./i18n-defaults";

interface CustomTextsProps {
	lang: string;
	texts: Record<string, string>;
	onChange: (key: string, value: string) => void;
}

/**
 * Custom text editor — grouped fields for overriding banner translations.
 */
export function CustomTexts({ lang, texts, onChange }: CustomTextsProps) {
	const id = useId();
	const groups = new Map<string, TextEntry[]>();
	for (const entry of TEXT_SCHEMA) {
		const list = groups.get(entry.group) || [];
		list.push(entry);
		groups.set(entry.group, list);
	}

	const baseLang = lang === "custom" ? "en" : lang;

	return (
		<div class="cb-custom-texts">
			{Array.from(groups.entries()).map(([group, entries]) => (
				<fieldset key={group} class="cb-text-group">
					<legend>
						{group}
					</legend>
					<div class="cb-form-stack">
						{entries.map((entry) => {
							const placeholder = getDefaultText(baseLang, entry.key);
							const value = texts[entry.key] || "";

							return (
								<div key={entry.key} class="cb-field">
									<label for={`${id}-${entry.key}`} class="cb-field-label">
										{entry.label}
									</label>
									{entry.multiline ? (
										<textarea
											id={`${id}-${entry.key}`}
											class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
											rows={2}
											placeholder={placeholder}
											value={value}
											onInput={(e) =>
												onChange(entry.key, (e.target as HTMLTextAreaElement).value)
											}
										/>
									) : (
										<input
											type="text"
											id={`${id}-${entry.key}`}
											class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
											placeholder={placeholder}
											value={value}
											onInput={(e) =>
												onChange(entry.key, (e.target as HTMLInputElement).value)
											}
										/>
									)}
								</div>
							);
						})}
					</div>
				</fieldset>
			))}
		</div>
	);
}
