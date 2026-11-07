import { useEffect, useState } from "preact/hooks";
import { api } from "@/shared/hooks/use-api";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toast";

type Disclosure = {
	description: string;
	privacyUrl: string;
	retention: string;
};
type Provider = Disclosure & { id: string; name: string };

export function ProviderDisclosures() {
	const [catalog, setCatalog] = useState<Provider[]>([]);
	const [saved, setSaved] = useState<Record<string, Disclosure>>({});
	const [drafts, setDrafts] = useState<Record<string, Disclosure>>({});
	const [error, setError] = useState("");
	const [ready, setReady] = useState(false);
	const [saving, setSaving] = useState(false);
	async function load() {
		try {
			const result = await api<{
				catalog: Provider[];
				disclosures: Record<string, Disclosure>;
			}>("/disclosures");
			setCatalog(result.catalog);
			setSaved(result.disclosures);
			setDrafts(result.disclosures);
			setReady(true);
			setError("");
		} catch {
			setError("Provider information could not be loaded.");
		}
	}
	useEffect(() => {
		void load();
	}, []);
	async function save(provider: Provider) {
		setSaving(true);
		try {
			const next = {
				...saved,
				[provider.id]: drafts[provider.id] || {
					description: provider.description,
					privacyUrl: provider.privacyUrl,
					retention: provider.retention,
				},
			};
			const result = await api<{ disclosures: Record<string, Disclosure> }>(
				"/disclosures",
				{ method: "PUT", body: JSON.stringify({ disclosures: next }) },
			);
			setSaved(result.disclosures);
			setError("");
			toast("Provider disclosure saved; previous consent invalidated");
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not save provider disclosure",
			);
		} finally {
			setSaving(false);
		}
	}
	return (
		<Card
			title="Provider privacy information"
			description="Review the actual purpose, provider policy and retention for this website. Unreviewed providers stay blocked. Suggestions reuse the scanner and cookie database."
		>
			{error && (
				<p role="alert" class="cb-alert cb-alert--error">
					{error} <Button onClick={load}>Retry</Button>
				</p>
			)}
			{!ready ? (
				<p role="status">Loading providers…</p>
			) : catalog.length === 0 ? (
				<p class="cb-help">
					Run the scanner to find providers used on this website. Configure
					custom integrations below.
				</p>
			) : (
				<div class="cb-section-stack">
					{catalog.map((provider) => {
						const value = drafts[provider.id] || provider;
						const change = (key: keyof Disclosure, text: string) =>
							setDrafts((current) => ({
								...current,
								[provider.id]: { ...value, [key]: text },
							}));
						return (
							<form
								class="cb-form-stack"
								onSubmit={(event) => {
									event.preventDefault();
									void save(provider);
								}}
							>
								<h3>
									{provider.name}{" "}
									<span class="cb-help">
										{saved[provider.id] ? "Reviewed" : "Review required"}
									</span>
								</h3>
								<Field
									label="Purpose on this website"
									type="text"
									value={value.description}
									onChange={(text) => change("description", text)}
								/>
								<Field
									label="Provider privacy policy"
									type="url"
									value={value.privacyUrl}
									onChange={(text) => change("privacyUrl", text)}
								/>
								<Field
									label="Retention period or criteria"
									type="text"
									value={value.retention}
									onChange={(text) => change("retention", text)}
								/>
								<Button type="submit" disabled={saving}>
									Save reviewed information
								</Button>
							</form>
						);
					})}
				</div>
			)}
		</Card>
	);
}
