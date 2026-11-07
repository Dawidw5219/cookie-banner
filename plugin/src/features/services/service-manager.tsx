import { ProviderDisclosures } from "./provider-disclosures";
import { useState } from "preact/hooks";
import { EmptyState } from "@/shared/ui/empty-state";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { CustomService, useServices } from "./use-services";

const empty: CustomService = {
	id: "",
	name: "",
	description: "",
	privacyUrl: "",
	urls: [],
};
const inputClass =
	"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900";

export function ServiceManager({
	model,
}: {
	model: ReturnType<typeof useServices>;
}) {
	const [draft, setDraft] = useState<CustomService>(empty);
	const [urls, setUrls] = useState("");
	const [removing, setRemoving] = useState<string | null>(null);
	const update = (
		key: "id" | "name" | "description" | "privacyUrl" | "retention",
		value: string,
	) => setDraft((current) => ({ ...current, [key]: value }));
	async function add(event: Event) {
		event.preventDefault();
		if (model.saving || model.loading || !model.ready) return;
		const next = {
			...draft,
			urls: urls
				.split(/\r?\n/)
				.map((url) => url.trim())
				.filter(Boolean),
		};
		if (await model.save([...model.services, next])) {
			setDraft(empty);
			setUrls("");
		}
	}
	return (
		<div class="cb-section-stack">
			<ProviderDisclosures />
			<Card
				title="Custom services"
				description="Register an integration once. The consent banner, HTML blocker and CSP use the same service registry."
			>
				<p class="text-sm text-gray-600 mb-5">
					Built-in providers detected by the scanner already appear in the
					banner. Add only integrations missing from the catalog. These services
					always require explicit consent.
				</p>
				{model.error && (
					<div
						role="alert"
						class="cb-alert cb-alert--error mb-4"
					>
						{model.error}{" "}
						<button class="underline" type="button" onClick={model.reload}>
							Reload saved services
						</button>
					</div>
				)}
				{model.loading ? (
					<p role="status">Loading services…</p>
				) : !model.ready ? (
					<p class="cb-help">Saved integrations are unavailable. Reload them before adding or changing services.</p>
				) : model.services.length === 0 ? (
					<EmptyState icon="services" title="Your scanner and built-in catalog are ready" description="Use the form below for your own widgets, CRM or analytics provider." />
				) : (
					<ul class="divide-y divide-gray-100">
						{model.services.map((service) => (
							<li
								key={service.id}
								class="cb-service-row"
							>
								<div class="min-w-0">
									<h3 class="font-semibold text-gray-900">
										{service.name}{" "}
										<code class="cb-service-id">
											{service.id}
										</code>
									</h3>
									<p class="text-sm text-gray-600 mt-1">
										{service.description}
									</p>
									<ul class="mt-2 text-xs text-gray-500 break-all">
										{service.urls.map((url) => (
											<li key={url}>{url}</li>
										))}
									</ul>
								</div>
								<div class="shrink-0">
									{removing === service.id ? (
										<div class="space-y-2">
											<p class="text-xs text-gray-600">
												Remove this custom rule? CSP still denies unregistered
												origins.
											</p>
											<div class="flex gap-2">
												<Button
													disabled={model.saving}
													variant="danger"
													onClick={async () => {
														if (
															await model.save(
																model.services.filter(
																	(item) => item.id !== service.id,
																),
															)
														)
															setRemoving(null);
													}}
												>
													Confirm removal
												</Button>
												<Button
													variant="secondary"
													onClick={() => setRemoving(null)}
												>
													Cancel
												</Button>
											</div>
										</div>
									) : (
										<Button
											variant="secondary"
											disabled={model.saving}
											onClick={() => setRemoving(service.id)}
										>
											Remove
										</Button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>
			<Card
				title="Add an integration"
				description="Choose a stable ID. Use a new ID if the purpose or destinations change so an old consent cannot silently authorize a new integration."
			>
				<form onSubmit={add} class="cb-form-stack">
					<div class="grid gap-4 sm:grid-cols-2">
						<label class="cb-input-label">
							<span class="text-sm font-medium">Service name</span>
							<input
								disabled={model.saving || model.loading || !model.ready}
								required
								maxLength={120}
								value={draft.name}
								class={inputClass}
								placeholder="Booking calendar"
								onInput={(e) => update("name", e.currentTarget.value)}
							/>
						</label>
						<label class="cb-input-label">
							<span class="text-sm font-medium">Service ID</span>
							<input
								disabled={model.saving || model.loading || !model.ready}
								required
								pattern="[a-z][a-z0-9_-]{1,79}"
								maxLength={80}
								value={draft.id}
								class={inputClass}
								placeholder="booking-calendar"
								onInput={(e) => update("id", e.currentTarget.value)}
							/>
						</label>
					</div>
					<label class="cb-input-label">
						<span class="text-sm font-medium">
							What is this service used for?
						</span>
						<textarea
							disabled={model.saving || model.loading || !model.ready}
							required
							maxLength={2000}
							rows={2}
							value={draft.description}
							class={inputClass}
							placeholder="Let visitors book an appointment through our external calendar."
							onInput={(e) => update("description", e.currentTarget.value)}
						/>
					</label>
					<div class="cb-field">
						<label for="cb-service-urls" class="text-sm font-medium block">
							HTTPS URL prefixes — one per line
						</label>
						<textarea
							disabled={model.saving || model.loading || !model.ready}
							id="cb-service-urls"
							aria-describedby="cb-service-urls-help"
							required
							rows={3}
							value={urls}
							class={inputClass}
							placeholder={
								"https://calendar.example.com/embed/\nhttps://cdn.example.com/calendar/"
							}
							onInput={(e) => setUrls(e.currentTarget.value)}
						/>
						<p id="cb-service-urls-help" class="cb-help">
							Prefixes identify resources to block. After consent, CSP permits
							the listed HTTPS origins. Do not enter wildcards or unrelated
							domains.
						</p>
					</div>
					<label class="cb-input-label">
						<span class="text-sm font-medium">
							Provider privacy policy
						</span>
						<input
							disabled={model.saving || model.loading || !model.ready}
							type="url"
							required
							value={draft.privacyUrl}
							class={inputClass}
							placeholder="https://calendar.example.com/privacy"
							onInput={(e) => update("privacyUrl", e.currentTarget.value)}
						/>
					</label>
					<label class="cb-input-label"><span>Retention period or criteria</span><input required class={inputClass} value={draft.retention || ""} onInput={(e) => update("retention", e.currentTarget.value)} placeholder="State the actual configured retention or deletion criteria" /></label>
					<Button type="submit" disabled={model.loading || model.saving || !model.ready}>
						{model.saving ? "Saving…" : "Add service"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
