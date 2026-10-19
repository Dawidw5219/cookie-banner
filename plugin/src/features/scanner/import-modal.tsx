import { useMemo, useState } from "preact/hooks";
import { Button } from "@/shared/ui/button";
import type { Cookie } from "./use-scanner";

interface ImportRow {
	cookie: Cookie;
	status: "new" | "update";
	selected: boolean;
}

interface ImportModalProps {
	incoming: Cookie[];
	existing: Cookie[];
	fileName: string;
	onCancel: () => void;
	onConfirm: (selected: Cookie[]) => Promise<unknown>;
}

const categoryColors: Record<string, string> = {
	Functional: "bg-emerald-100 text-emerald-800",
	Analytics: "bg-blue-100 text-blue-800",
	Marketing: "bg-purple-100 text-purple-800",
	Security: "bg-amber-100 text-amber-800",
	Personalization: "bg-pink-100 text-pink-800",
	Unknown: "bg-red-50 text-red-700",
};

function keyOf(c: Pick<Cookie, "name" | "domain" | "source">): string {
	return `${c.name}|${c.domain ?? ""}|${c.source ?? "cookie"}`;
}

export function ImportModal({ incoming, existing, fileName, onCancel, onConfirm }: ImportModalProps) {
	const existingKeys = useMemo(() => new Set(existing.map(keyOf)), [existing]);

	const [rows, setRows] = useState<ImportRow[]>(() =>
		incoming.map((cookie) => ({
			cookie,
			status: existingKeys.has(keyOf(cookie)) ? "update" : "new",
			selected: true,
		})),
	);
	const [submitting, setSubmitting] = useState(false);
	const [filter, setFilter] = useState<"all" | "new" | "update">("all");

	const filteredIndices = rows
		.map((row, idx) => ({ row, idx }))
		.filter(({ row }) => filter === "all" || row.status === filter);

	const selectedCount = rows.filter((r) => r.selected).length;
	const newCount = rows.filter((r) => r.status === "new").length;
	const updateCount = rows.filter((r) => r.status === "update").length;
	const visibleAllSelected =
		filteredIndices.length > 0 && filteredIndices.every(({ row }) => row.selected);

	const toggle = (idx: number) => {
		setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)));
	};

	const toggleVisible = () => {
		const next = !visibleAllSelected;
		const visibleSet = new Set(filteredIndices.map(({ idx }) => idx));
		setRows((prev) => prev.map((r, i) => (visibleSet.has(i) ? { ...r, selected: next } : r)));
	};

	const handleConfirm = async () => {
		setSubmitting(true);
		try {
			await onConfirm(rows.filter((r) => r.selected).map((r) => r.cookie));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
			<div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
					<div>
						<h2 class="text-lg font-semibold text-gray-900">Import Cookies</h2>
						<p class="text-sm text-gray-500 mt-0.5">
							{fileName} — {incoming.length} cookies found.
							Select which to import. Existing entries (same name + domain + source) will be updated.
						</p>
					</div>
					<button
						type="button"
						onClick={onCancel}
						class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
						aria-label="Close"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
					<div class="flex items-center gap-2 text-sm">
						<button
							type="button"
							onClick={() => setFilter("all")}
							class={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filter === "all" ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
						>
							All ({rows.length})
						</button>
						<button
							type="button"
							onClick={() => setFilter("new")}
							class={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filter === "new" ? "bg-emerald-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
						>
							New ({newCount})
						</button>
						<button
							type="button"
							onClick={() => setFilter("update")}
							class={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${filter === "update" ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
						>
							Update ({updateCount})
						</button>
					</div>
					<button
						type="button"
						onClick={toggleVisible}
						class="text-sm text-gray-700 hover:text-gray-900 underline cursor-pointer"
					>
						{visibleAllSelected ? "Deselect visible" : "Select visible"}
					</button>
				</div>

				<div class="overflow-auto flex-1">
					<table class="w-full text-sm text-left">
						<thead class="text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 sticky top-0">
							<tr>
								<th class="px-4 py-3 w-10">
									<input
										type="checkbox"
										checked={visibleAllSelected}
										onChange={toggleVisible}
										class="rounded border-gray-300 cursor-pointer"
									/>
								</th>
								<th class="px-4 py-3 font-medium">Name</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Category</th>
								<th class="px-4 py-3 font-medium">Platform</th>
								<th class="px-4 py-3 font-medium">Source</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{filteredIndices.length === 0 ? (
								<tr>
									<td colspan={6} class="px-4 py-8 text-center text-gray-400">
										Nothing here.
									</td>
								</tr>
							) : (
								filteredIndices.map(({ row, idx }) => (
									<tr
										key={idx}
										class={`hover:bg-gray-50 transition-colors cursor-pointer ${row.selected ? "" : "opacity-50"}`}
										onClick={() => toggle(idx)}
									>
										<td class="px-4 py-3">
											<input
												type="checkbox"
												checked={row.selected}
												onChange={() => toggle(idx)}
												onClick={(e) => e.stopPropagation()}
												class="rounded border-gray-300 cursor-pointer"
											/>
										</td>
										<td class="px-4 py-3">
											<div class="font-mono text-xs font-medium text-gray-900">{row.cookie.name}</div>
											{row.cookie.domain && (
												<div class="text-xs text-gray-400 mt-0.5">{row.cookie.domain}</div>
											)}
										</td>
										<td class="px-4 py-3">
											{row.status === "new" ? (
												<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
													New
												</span>
											) : (
												<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
													Update
												</span>
											)}
										</td>
										<td class="px-4 py-3">
											<span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[row.cookie.category] ?? categoryColors.Unknown}`}>
												{row.cookie.category || "Unknown"}
											</span>
										</td>
										<td class="px-4 py-3 text-gray-600">{row.cookie.platform || "—"}</td>
										<td class="px-4 py-3">
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
												{row.cookie.source === "localStorage" ? "Local Storage" :
												 row.cookie.source === "sessionStorage" ? "Session Storage" : "Cookie"}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
					<div class="text-sm text-gray-600">
						<span class="font-medium text-gray-900">{selectedCount}</span> of {rows.length} selected
					</div>
					<div class="flex gap-2">
						<Button variant="secondary" onClick={onCancel} disabled={submitting}>
							Cancel
						</Button>
						<Button onClick={handleConfirm} disabled={submitting || selectedCount === 0}>
							{submitting ? "Importing..." : `Import ${selectedCount}`}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
