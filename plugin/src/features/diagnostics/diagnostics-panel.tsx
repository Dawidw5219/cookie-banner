import { useState } from "preact/hooks";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { api } from "@/shared/hooks/use-api";
import { wp } from "@/shared/types/wp";
import type { useDiagnostics } from "./use-diagnostics";

interface FrontendCheck {
	status: number;
	csp: string;
	cache: string;
	dns: string;
}
export function DiagnosticsPanel({
	model,
}: {
	model: ReturnType<typeof useDiagnostics>;
}) {
	const [checking, setChecking] = useState(false);
	const [purging, setPurging] = useState(false);
	const [check, setCheck] = useState<FrontendCheck | null>(null);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	async function checkFrontend() {
		setChecking(true);
		setError("");
		setCheck(null);
		try {
			// Fetch HTML as text only: never execute scripts or load its resources.
			const response = await fetch(wp.homeUrl, {
				credentials: "same-origin",
				cache: "no-store",
				redirect: "error",
			});
			setCheck({
				status: response.status,
				csp: response.headers.get("Content-Security-Policy") || "",
				cache: response.headers.get("Cache-Control") || "",
				dns: response.headers.get("X-DNS-Prefetch-Control") || "",
			});
			await response.body?.cancel();
		} catch {
			setError(
				"Could not read the frontend response. Check redirects, connectivity and the website URL.",
			);
		} finally {
			setChecking(false);
		}
	}
	async function purge() {
		setPurging(true);
		setError("");
		setMessage("");
		try {
			const response = await api<{ purged: string[] }>(
				"/maintenance/purge-cache",
				{ method: "POST" },
			);
			setMessage(
				response.purged.length
					? `Cache refresh requested for ${response.purged.join(", ")}. Purge any additional CDN or hosting cache separately.`
					: "No supported page-cache plugin detected. Check any hosting or CDN cache separately.",
			);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Cache refresh failed");
		} finally {
			setPurging(false);
		}
	}
	const data = model.data;
	return (
		<div class="cb-section-stack">
			{(model.error || error) && (
				<div role="alert" class="cb-alert cb-alert--error">
					{model.error || error}{" "}
					{model.error && (
						<button onClick={model.reload} class="underline">
							Retry
						</button>
					)}
				</div>
			)}
			<Card
				title="Protection & compatibility"
				description="Local configuration, not a certificate of legal compliance or a full network audit."
			>
				{data ? (
					<>
						<dl class="cb-diagnostics-grid">
							{[
								[
									"Strict network CSP",
									data.strictCsp ? "Configured" : "Disabled by site filter",
								],
								["Server HTML parser", data.parser ? "Available" : "Missing"],
								[
									"Dynamic loader guard",
									data.autoBlock ? "Enabled" : "Disabled",
								],
								[
									"Cache adapters",
									data.cachePlugins.join(", ") || "None detected",
								],
								["Theme", data.theme],
								[
									"Environment",
									`WordPress ${data.wordpress} · PHP ${data.php}`,
								],
							].map(([label, value]) => (
								<div key={label} class="cb-diagnostic-item">
									<dt class="cb-help">{label}</dt>
									<dd class="cb-diagnostic-value">
										{value}
									</dd>
								</div>
							))}
						</dl>
						{data.otherConsentPlugins.length > 0 && (
							<div
								role="alert"
								class="cb-alert cb-alert--warning mt-5"
							>
								Other consent plugins are active:{" "}
								{data.otherConsentPlugins.join(", ")}. Running multiple banners
								may produce conflicting consent states. Review them before
								launch.
							</div>
						)}
						{data.auditActive && (
							<p class="mt-4 text-sm text-amber-800">
								A scanner audit is active. Review its results in Cookies & scan.
							</p>
						)}
					</>
				) : (
					<p role="status">Loading environment…</p>
				)}
			</Card>
			<Card
				title="Check the actual frontend response"
				description="Reads the homepage response for this administrator session. It does not execute the page or verify third-party requests, anonymous visitors or every cache variant."
			>
				<Button onClick={checkFrontend} disabled={checking}>
					{checking ? "Checking…" : "Check frontend headers"}
				</Button>
				{check && (
					<div class="mt-5 space-y-3" aria-live="polite">
						<div class="flex flex-wrap gap-2 text-xs">
							{[
								[`HTTP ${check.status}`, check.status === 200],
								["Default-deny CSP", /default-src\s+'none'/.test(check.csp)],
								["HTML no-store", /\bno-store\b/i.test(check.cache)],
								["DNS prefetch off", check.dns.toLowerCase() === "off"],
							].map(([label, ok]) => (
								<Badge key={String(label)} tone={ok ? "success" : "warning"}>
									{ok ? "✓" : "!"} {label}
								</Badge>
							))}
						</div>
						<details class="cb-details">
							<summary>Response headers</summary>
							<pre class="cb-response-code">{`Content-Security-Policy: ${check.csp || "missing"}\nCache-Control: ${check.cache || "missing"}\nX-DNS-Prefetch-Control: ${check.dns || "missing"}`}</pre>
						</details>
					</div>
				)}
			</Card>
			<Card
				title="Cache maintenance"
				description="Strict CSP bypasses shared HTML caching. Asset caching and compatible JS/CSS optimization can remain active."
			>
				<p class="text-sm text-gray-600 mb-4">
					Changing settings or custom services automatically refreshes supported
					caches. Use this after a deployment or when checking a suspected stale
					page. CDN and reverse-proxy caches must honor no-store and be managed
					separately.
				</p>
				<Button variant="secondary" onClick={purge} disabled={purging}>
					{purging ? "Refreshing…" : "Refresh supported caches"}
				</Button>
				{message && (
					<p role="status" class="mt-3 text-sm text-gray-600">
						{message}
					</p>
				)}
			</Card>
		</div>
	);
}
