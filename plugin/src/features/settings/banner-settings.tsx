import type { CustomService } from "@/features/services/use-services";
import { useState, useMemo } from "preact/hooks";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import type { useSettings } from "./use-settings";
import { BannerPreview } from "./banner-preview";
import { CustomTexts } from "./custom-texts";
import { getLanguageDefaults } from "./i18n-defaults";

/** Convert flat dot-notation keys to nested object. */
function dotToNested(flat: Record<string, string>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [dotKey, value] of Object.entries(flat)) {
		if (!value) continue;
		const parts = dotKey.split(".");
		let current: Record<string, unknown> = result;
		for (let i = 0; i < parts.length - 1; i++) {
			if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
				current[parts[i]] = {};
			}
			current = current[parts[i]] as Record<string, unknown>;
		}
		current[parts[parts.length - 1]] = value;
	}
	return result;
}

export function BannerSettings({ model, services }: {
	model: ReturnType<typeof useSettings>;
	services: CustomService[];
}) {
	const { settings, fields, update, save, saving, dirty } = model;
	const [previewVariant, setPreviewVariant] = useState<string | null>(null);
	const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
	const [textsLoaded, setTextsLoaded] = useState(false);

	// Parse stored custom_texts on first load.
	if (settings && !textsLoaded) {
		try {
			const stored = settings.custom_texts ? JSON.parse(settings.custom_texts) : {};
			setCustomTexts(typeof stored === "object" && stored ? stored : {});
		} catch {
			setCustomTexts({});
		}
		setTextsLoaded(true);
	}

	function updateCustomText(key: string, value: string) {
		const next = { ...customTexts, [key]: value };
		if (!value) delete next[key];
		setCustomTexts(next);
		update("custom_texts", JSON.stringify(next));
	}

	// Build preview config from current settings.
	const previewConfig = useMemo(() => {
		if (!settings) return {};
		const lang = settings.lang === "auto" || settings.lang === "custom" ? "en" : settings.lang;
		const config: Record<string, unknown> = {
			services,
			mode: settings.gtm_id ? "gtm" : "standalone",
			variant: previewVariant || settings.variant || "modal",
			lang,
			theme: {
				primary: settings.primary_color || "#2563eb",
				background: settings.background_color || "#ffffff",
				text: settings.text_color || "#1a1a1a",
			},
		};
		if (settings.privacy_policy_url) config.privacyPolicyUrl = settings.privacy_policy_url;
		if (settings.cookie_policy_url) config.cookiePolicyUrl = settings.cookie_policy_url;
		if (settings.lang === "custom" && Object.keys(customTexts).some((k) => customTexts[k])) {
			config.customTexts = dotToNested(customTexts);
		}
		return config;
	}, [settings, customTexts, previewVariant, services]);

	if (!settings) {
		return (
			<Card title="Banner Settings">
				<p class="cb-help" role="status">{model.error ? "Settings are unavailable. Use Retry settings above to reload them." : "Loading settings…"}</p>
			</Card>
		);
	}

	const colorFields = fields.filter((f) => f.type === "color");
	const regularFields = fields.filter((f) => f.type !== "checkbox" && f.type !== "color" && f.key !== "lang");
	const langField = fields.find((f) => f.key === "lang");
	const checkboxFields = fields.filter((f) => f.type === "checkbox");
	const isCustomLang = settings.lang === "custom";

	return (
		<div class="cb-appearance-layout">
			{/* LEFT: Settings editor */}
			<div class="w-full flex-1 min-w-0">
				<Card
					title="Banner Settings"
					description="Configure the appearance and behavior of the consent banner."
				>
					<div class="cb-color-fields">
						{colorFields.map((field) => <Field key={field.key} type="color" label={field.label} value={settings[field.key] ?? field.default} onChange={(value) => update(field.key, value)} />)}
					</div>
					<div class="cb-settings-fields">
						{regularFields.map((f) => (
							<Field
								key={f.key}
								label={f.label}
								type={f.type as any}
								value={settings[f.key] ?? f.default}
								options={f.options ?? {}}
								description={f.description}
								onChange={(v: string) => update(f.key, v)}
							/>
						))}

						{/* Language with Custom option */}
						{langField && (
							<Field
								key={langField.key}
								label={langField.label}
								type="select"
								value={settings.lang ?? "auto"}
								options={langField.options ?? {}}
								onChange={(v: string) => {
									update("lang", v);
									// Pre-fill custom texts from previous language.
									if (v === "custom" && Object.keys(customTexts).length === 0) {
										const base = settings.lang !== "custom" ? settings.lang : "en";
										const defaults = getLanguageDefaults(base === "auto" ? "en" : base);
										setCustomTexts(defaults);
										update("custom_texts", JSON.stringify(defaults));
									}
								}}
							/>
						)}
					</div>

					{/* Custom texts editor */}
					{isCustomLang && (
						<div class="cb-custom-text-panel">
							<div class="flex items-center gap-2 mb-4">
								<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
								<h4 class="text-sm font-semibold text-gray-900">Custom Texts</h4>
							</div>
							<p class="cb-help mb-4">
								Edit the banner texts below. Leave empty to use the default English text.
							</p>
							<CustomTexts
								lang={settings.lang}
								texts={customTexts}
								onChange={updateCustomText}
							/>
						</div>
					)}

					{checkboxFields.length > 0 && (
						<div class="cb-toggle-group">
							{checkboxFields.map((f) => (
								<Field
									key={f.key}
									label={f.label}
									type="checkbox"
									value={settings[f.key] ?? f.default}
									description={f.description}
									onChange={(v: string) => update(f.key, v)}
								/>
							))}
						</div>
					)}

					<div class="cb-form-footer">
						<Button onClick={save} disabled={saving || !dirty}>
							{saving ? "Saving..." : "Save Settings"}
						</Button>
						{dirty && <Badge tone="warning">Unsaved changes</Badge>}
					</div>
				</Card>
			</div>

			{/* RIGHT: Live preview */}
			<div class="cb-preview-column">
				<div class="cb-card cb-preview-card">
					<div class="cb-preview-header">
						<div class="cb-preview-title"><h2>Live Preview</h2><p>Updates as you edit.</p></div>
						<div class="cb-segmented" role="group" aria-label="Preview layout">
							{(["modal", "bar"] as const).map((v) => (
								<button
									key={v}
									class="cb-segment"
									aria-pressed={(previewVariant || settings.variant) === v}
									onClick={() => setPreviewVariant(v)}
								>
									{v === "modal" ? "Modal" : "Bar"}
								</button>
							))}
						</div>
					</div>
					<BannerPreview
						config={previewConfig}
						previewVariant={previewVariant || settings.variant}
					/>
					<p class="cb-preview-note">Interactive preview · Your website consent stays unchanged.</p>
				</div>
			</div>
		</div>
	);
}
