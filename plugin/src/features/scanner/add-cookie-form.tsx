import { COOKIE_CATEGORIES } from "./categories";
import { useId, useState } from "preact/hooks";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";


interface AddCookieFormProps {
	onAdd: (data: { name: string; category: string; platform: string; description: string; retention: string }) => Promise<void>;
}

export function AddCookieForm({ onAdd }: AddCookieFormProps) {
	const id = useId();
	const [name, setName] = useState("");
	const [category, setCategory] = useState("Functional");
	const [platform, setPlatform] = useState("");
	const [description, setDescription] = useState("");
	const [retention, setRetention] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		try {
			await onAdd({ name: name.trim(), category, platform, description, retention });
			setName("");
			setPlatform("");
			setDescription("");
			setRetention("");
		} finally {
			setSubmitting(false);
		}
	};

	const inputClass = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900";

	return (
		<Card title="Add Cookie Manually" description="Add cookies that were not detected by the scanner (e.g. third-party cookies loaded via external scripts).">
			<form onSubmit={handleSubmit} class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div class="cb-field">
					<label for={`${id}-name`} class="cb-field-label">
						Cookie Name <span class="text-red-700">*</span>
					</label>
					<input id={`${id}-name`} type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="_ga" class={inputClass} required />
				</div>
				<div class="cb-field">
					<label for={`${id}-category`} class="cb-field-label">Category</label>
					<select id={`${id}-category`} value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)} class={`${inputClass} bg-white`}>
						{COOKIE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
					</select>
				</div>
				<div class="cb-field">
					<label for={`${id}-provider`} class="cb-field-label">Provider</label>
					<input id={`${id}-provider`} type="text" value={platform} onInput={(e) => setPlatform((e.target as HTMLInputElement).value)} placeholder="Google Analytics" class={inputClass} />
				</div>
				<div class="cb-field sm:col-span-2">
					<label for={`${id}-description`} class="cb-field-label">Purpose / Description</label>
					<input id={`${id}-description`} type="text" value={description} onInput={(e) => setDescription((e.target as HTMLInputElement).value)} placeholder="Used to distinguish users for analytics" class={inputClass} />
				</div>
				<div class="cb-field">
					<label for={`${id}-retention`} class="cb-field-label">Retention</label>
					<input id={`${id}-retention`} type="text" value={retention} onInput={(e) => setRetention((e.target as HTMLInputElement).value)} placeholder="2 years" class={inputClass} />
				</div>
				<div class="sm:col-span-2 lg:col-span-3 flex items-end">
					<Button type="submit" disabled={submitting || !name.trim()}>
						{submitting ? "Adding..." : "Add Cookie"}
					</Button>
				</div>
			</form>
		</Card>
	);
}
