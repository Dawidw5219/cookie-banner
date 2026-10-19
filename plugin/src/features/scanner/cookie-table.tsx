import { useState } from "preact/hooks";
import { Card } from "@/shared/ui/card";
import type { Cookie } from "./use-scanner";

const CATEGORIES = ["Functional", "Analytics", "Marketing", "Security", "Personalization", "Unknown"] as const;

const categoryColors: Record<string, string> = {
	Functional: "bg-emerald-100 text-emerald-800",
	Analytics: "bg-blue-100 text-blue-800",
	Marketing: "bg-purple-100 text-purple-800",
	Security: "bg-amber-100 text-amber-800",
	Personalization: "bg-pink-100 text-pink-800",
	Unknown: "bg-red-50 text-red-700 !border-red-300",
};

interface CookieTableProps {
	cookies: Cookie[];
	onUpdateCategory: (name: string, category: string) => void;
}

export function CookieTable({ cookies, onUpdateCategory }: CookieTableProps) {
	const [filterCategory, setFilterCategory] = useState("");
	const [filterSource, setFilterSource] = useState("");

	const filtered = cookies.filter((c) => {
		if (filterCategory && c.category !== filterCategory) return false;
		if (filterSource && c.source !== filterSource) return false;
		return true;
	});

	if (cookies.length === 0) {
		return (
			<Card>
				<div class="py-12 text-center">
					<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-1">No cookies detected yet</h3>
					<p class="text-sm text-gray-500">Start a scan to discover cookies on your site.</p>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Detected Cookies & Storage</h2>
					<p class="text-sm text-gray-500 mt-1">
						All cookies and storage entries found during scanning sessions.
					</p>
				</div>
				<div class="flex gap-2">
					<select
						value={filterCategory}
						onChange={(e) => setFilterCategory((e.target as HTMLSelectElement).value)}
						class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
					>
						<option value="">All categories</option>
						{CATEGORIES.map((c) => (
							<option key={c} value={c}>{c}</option>
						))}
					</select>
					<select
						value={filterSource}
						onChange={(e) => setFilterSource((e.target as HTMLSelectElement).value)}
						class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
					>
						<option value="">All sources</option>
						<option value="cookie">Cookie</option>
						<option value="localStorage">Local Storage</option>
						<option value="sessionStorage">Session Storage</option>
					</select>
				</div>
			</div>

			<div class="overflow-x-auto -mx-6">
				<table class="w-full text-sm text-left">
					<thead class="text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-y border-gray-200">
						<tr>
							<th class="px-6 py-3 font-medium">Name</th>
							<th class="px-6 py-3 font-medium">Source</th>
							<th class="px-6 py-3 font-medium">Category</th>
							<th class="px-6 py-3 font-medium">Platform</th>
							<th class="px-6 py-3 font-medium">Description</th>
							<th class="px-6 py-3 font-medium">Retention</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{filtered.map((cookie) => (
							<tr key={cookie.name} class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4">
									<div class="font-mono text-sm font-medium text-gray-900">{cookie.name}</div>
									{cookie.domain && (
										<div class="text-xs text-gray-400 mt-0.5">{cookie.domain}</div>
									)}
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
										{cookie.source === "localStorage" ? "Local Storage" :
										 cookie.source === "sessionStorage" ? "Session Storage" : "Cookie"}
									</span>
								</td>
								<td class="px-6 py-4">
									<select
										value={cookie.category}
										onChange={(e) => onUpdateCategory(cookie.name, (e.target as HTMLSelectElement).value)}
										class={`text-xs border rounded-lg px-2 py-1 ${categoryColors[cookie.category] ?? categoryColors.Unknown} focus:outline-none focus:ring-2 focus:ring-gray-900`}
									>
										{CATEGORIES.map((cat) => (
											<option key={cat} value={cat}>{cat}</option>
										))}
									</select>
								</td>
								<td class="px-6 py-4 text-gray-600">
									{cookie.privacy_link ? (
										<a href={cookie.privacy_link} target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 hover:underline">
											{cookie.platform}
										</a>
									) : (
										cookie.platform || "—"
									)}
								</td>
								<td class="px-6 py-4 text-gray-600 max-w-xs">
									<div class="truncate" title={cookie.description}>
										{cookie.description || "—"}
									</div>
								</td>
								<td class="px-6 py-4 text-gray-600 whitespace-nowrap">
									{cookie.retention || "—"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
