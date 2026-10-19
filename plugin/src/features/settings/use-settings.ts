import { useState, useEffect, useCallback } from "preact/hooks";
import { api } from "@/shared/hooks/use-api";
import { toast } from "@/shared/ui/toast";

export interface FieldDef {
	key: string;
	label: string;
	type: "text" | "url" | "color" | "select" | "checkbox";
	default: string;
	options?: Record<string, string> | null;
	description?: string | null;
}

interface SettingsResponse {
	settings: Record<string, string>;
	fields: FieldDef[];
}

export function useSettings() {
	const [settings, setSettings] = useState<Record<string, string> | null>(null);
	const [fields, setFields] = useState<FieldDef[]>([]);
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		api<SettingsResponse>("/settings").then((data) => {
			setSettings(data.settings);
			setFields(data.fields);
		});
	}, []);

	const update = useCallback((key: string, value: string) => {
		setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
		setDirty(true);
	}, []);

	const save = useCallback(async () => {
		if (!settings) return;
		setSaving(true);
		try {
			await api("/settings", {
				method: "PUT",
				body: JSON.stringify(settings),
			});
			setDirty(false);
			toast("Settings saved");
		} catch {
			toast("Failed to save", "error");
		} finally {
			setSaving(false);
		}
	}, [settings]);

	return { settings, fields, update, save, saving, dirty };
}
