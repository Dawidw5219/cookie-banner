import { useState } from "preact/hooks";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export function ShortcodesInfo() {
	return (
		<Card title="Shortcodes & Integration" description="Ways to display cookie data and consent controls on your site.">
			<div class="cb-shortcode-list">
				<ShortcodeBlock title="Cookie Policy Table" code="[cookie_policy_table]" description="Renders a table with detected cookies, their purpose, provider and retention. Add it to your cookie policy page." />
				<ShortcodeBlock title="Cookie Preferences Link" code='[cookie_preferences_link]Change preferences[/cookie_preferences_link]' description="Creates a link that opens the consent preferences dialog when clicked." />
				<ShortcodeBlock title="CSS Class (no shortcode)" code='<a href="#" class="open-consent-settings">Manage cookies</a>' description='Add the class "open-consent-settings" to a link or button to open the consent preferences.' />
			</div>
		</Card>
	);
}

function ShortcodeBlock({ title, code, description }: { title: string; code: string; description: string }) {
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			setStatus("copied");
		} catch {
			setStatus("error");
		}
	}
	return (
		<div class="cb-shortcode-block">
			<div class="cb-shortcode-heading">
				<div><h3>{title}</h3><p class="cb-help">{description}</p></div>
				<Button variant="secondary" onClick={copy} aria-label={`Copy ${title}`}>{status === "copied" ? "Copied ✓" : "Copy code"}</Button>
			</div>
			<code class="cb-admin-code">{code}</code>
			<span role="status" class={status === "error" ? "cb-form-error" : "screen-reader-text"}>{status === "error" ? "Copy unavailable. Select the code above and copy it manually." : status === "copied" ? `${title} copied.` : ""}</span>
		</div>
	);
}
