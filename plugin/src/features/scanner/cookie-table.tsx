import { COOKIE_CATEGORIES } from "./categories";
import { useState } from "preact/hooks";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import type { Cookie } from "./use-scanner";


interface CookieTableProps {
	cookies: Cookie[];
	onUpdateCategory: (name: string, category: string) => void;
}

export function CookieTable({ cookies, onUpdateCategory }: CookieTableProps) {
	const [filterCategory, setFilterCategory] = useState("");
	const [filterSource, setFilterSource] = useState("");
	const filtered = cookies.filter((cookie) =>
		(!filterCategory || cookie.category === filterCategory) &&
		(!filterSource || cookie.source === filterSource),
	);

	return (
		<Card title="Detected Cookies & Storage" description="All cookies and storage entries found during scanning sessions." actions={<Badge>{cookies.length} entries</Badge>}>
			{cookies.length === 0 ? (
				<EmptyState icon="cookies" title="No cookies detected yet" description="Start a scan to discover cookies on your site." />
			) : (
				<>
					<div class="cb-table-toolbar">
						<p class="cb-help">Showing {filtered.length} of {cookies.length} entries</p>
						<div class="cb-table-filters">
							<label class="cb-input-label">Category
								<select aria-label="Filter by category" value={filterCategory} onChange={(event) => setFilterCategory(event.currentTarget.value)}>
									<option value="">All categories</option>
									{COOKIE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
								</select>
							</label>
							<label class="cb-input-label">Source
								<select aria-label="Filter by source" value={filterSource} onChange={(event) => setFilterSource(event.currentTarget.value)}>
									<option value="">All sources</option>
									<option value="cookie">Cookie</option>
									<option value="localStorage">Local Storage</option>
									<option value="sessionStorage">Session Storage</option>
								</select>
							</label>
						</div>
					</div>
					<p class="cb-table-hint">← Scroll the table to see all columns →</p>
					<div class="cb-table-scroll" role="region" aria-label="Detected cookie entries" tabIndex={0}>
						<table class="cb-data-table cb-cookie-table">
							<caption class="screen-reader-text">Cookies and storage detected on your website</caption>
							<thead><tr>{["Name", "Source", "Category", "Platform", "Description", "Retention"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
							<tbody>
								{filtered.length === 0 && <tr><td colspan={6} class="cb-table-empty">No entries match these filters.</td></tr>}
								{filtered.map((cookie) => (
									<tr key={`${cookie.name}|${cookie.domain}|${cookie.source}`}>
										<td><span class="cb-mono">{cookie.name}</span>{cookie.domain && <small class="cb-table-detail">{cookie.domain}</small>}</td>
										<td><Badge>{cookie.source === "localStorage" ? "Local Storage" : cookie.source === "sessionStorage" ? "Session Storage" : "Cookie"}</Badge></td>
										<td><select aria-label={`Category for ${cookie.name}`} class="cb-category-select" data-category={cookie.category} value={cookie.category} onChange={(event) => onUpdateCategory(cookie.name, event.currentTarget.value)}>{COOKIE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></td>
										<td>{cookie.privacy_link ? <a class="cb-text-link" href={cookie.privacy_link} target="_blank" rel="noopener noreferrer">{cookie.platform || "Privacy policy"}</a> : cookie.platform || "—"}</td>
										<td class="cb-table-description">{cookie.description || "—"}</td>
										<td>{cookie.retention || "—"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</>
			)}
		</Card>
	);
}
