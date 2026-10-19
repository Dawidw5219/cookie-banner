import { Card } from "@/shared/ui/card";

export function ShortcodesInfo() {
	return (
		<Card title="Shortcodes & Integration" description="Ways to display cookie data and consent controls on your site.">
			<div class="space-y-6">
				<ShortcodeBlock
					title="Cookie Policy Table"
					code="[cookie_policy_table]"
					description="Renders an HTML table with all detected cookies — name, category, description, purpose, retention, provider, and privacy link. Perfect for your cookie policy page."
				/>
				<ShortcodeBlock
					title="Cookie Preferences Link"
					code='[cookie_preferences_link]Change preferences[/cookie_preferences_link]'
					description="Creates a link that opens the consent preferences dialog when clicked."
				/>
				<ShortcodeBlock
					title="CSS Class (no shortcode)"
					code='<a href="#" class="open-consent-settings">Manage cookies</a>'
					description='Add the class "open-consent-settings" to any link or button to open the consent dialog. Works with any HTML element.'
					isHtml
				/>
			</div>
		</Card>
	);
}

function ShortcodeBlock({ title, code, description, isHtml }: { title: string; code: string; description: string; isHtml?: boolean }) {
	return (
		<div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
			<h4 class="text-sm font-medium text-gray-900 mb-1">{title}</h4>
			<p class="text-xs text-gray-500 mb-2">{description}</p>
			<code class="block text-xs bg-gray-900 text-gray-100 px-3 py-2 rounded-md font-mono select-all">
				{code}
			</code>
		</div>
	);
}
