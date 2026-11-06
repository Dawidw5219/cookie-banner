import { useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import { Button } from "@/shared/ui/button";
import { Badge, CategoryBadge } from "@/shared/ui/badge";
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
function keyOf(cookie: Pick<Cookie, "name" | "domain" | "source">): string {
	return `${cookie.name}|${cookie.domain ?? ""}|${cookie.source ?? "cookie"}`;
}

export function ImportModal({ incoming, existing, fileName, onCancel, onConfirm }: ImportModalProps) {
	const dialog = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const existingKeys = useMemo(() => new Set(existing.map(keyOf)), [existing]);
	const [rows, setRows] = useState<ImportRow[]>(() => incoming.map((cookie) => ({
		cookie,
		status: existingKeys.has(keyOf(cookie)) ? "update" : "new",
		selected: true,
	})));
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<"all" | "new" | "update">("all");
	useEffect(() => {
		const element = dialog.current;
		element?.showModal();
		return () => element?.close();
	}, []);

	const visible = rows.map((row, index) => ({ row, index })).filter(({ row }) => filter === "all" || row.status === filter);
	const selectedCount = rows.filter((row) => row.selected).length;
	const newCount = rows.filter((row) => row.status === "new").length;
	const allSelected = visible.length > 0 && visible.every(({ row }) => row.selected);
	function toggle(index: number) {
		setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, selected: !row.selected } : row));
	}
	function toggleVisible() {
		const indices = new Set(visible.map(({ index }) => index));
		setRows((current) => current.map((row, index) => indices.has(index) ? { ...row, selected: !allSelected } : row));
	}
	async function confirm() {
		setSubmitting(true);
		setError("");
		try {
			await onConfirm(rows.filter((row) => row.selected).map((row) => row.cookie));
		} catch {
			setError("Import failed. Your selection is preserved; try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<dialog ref={dialog} class="cb-import-dialog" onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!submitting) onCancel(); }}>
			<div class="cb-import-layout">
				<div class="cb-dialog-header">
					<div>
						<h2 id={titleId}>Import Cookies</h2>
						<p class="cb-help">{fileName} · {incoming.length} cookies found. Choose entries to import. Existing entries with the same name, domain and source will be updated.</p>
					</div>
					<button type="button" class="cb-icon-button" aria-label="Close" disabled={submitting} onClick={onCancel}>×</button>
				</div>
				<div class="cb-dialog-toolbar">
					<div class="cb-segmented" aria-label="Filter import entries">
						{([ ["all", "All", rows.length], ["new", "New", newCount], ["update", "Update", rows.length - newCount] ] as const).map(([key, label, count]) => (
							<button key={key} type="button" class="cb-segment" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label} ({count})</button>
						))}
					</div>
					<button type="button" class="cb-text-link" onClick={toggleVisible}>{allSelected ? "Deselect visible" : "Select visible"}</button>
				</div>
				<p class="cb-table-hint">← Scroll to review all columns →</p>
				<div class="cb-import-table cb-table-scroll" role="region" aria-label="Cookies to import" tabIndex={0}>
					<table class="cb-data-table">
						<caption class="screen-reader-text">Review imported cookie entries</caption>
						<thead><tr>
							<th scope="col"><input type="checkbox" aria-label="Select all visible cookies" checked={allSelected} onChange={toggleVisible} /></th>
							{["Name", "Status", "Category", "Platform", "Source"].map((label) => <th key={label} scope="col">{label}</th>)}
						</tr></thead>
						<tbody>
							{visible.length === 0 && <tr><td colspan={6} class="cb-table-empty">No entries match this filter.</td></tr>}
							{visible.map(({ row, index }) => (
								<tr key={index} class={row.selected ? "" : "cb-row-unselected"} onClick={() => toggle(index)}>
									<td><input type="checkbox" aria-label={`Import ${row.cookie.name}`} checked={row.selected} onClick={(event) => event.stopPropagation()} onChange={() => toggle(index)} /></td>
									<td><span class="cb-mono">{row.cookie.name}</span>{row.cookie.domain && <small class="cb-table-detail">{row.cookie.domain}</small>}</td>
									<td><Badge tone={row.status === "new" ? "success" : "neutral"}>{row.status === "new" ? "New" : "Update"}</Badge></td>
									<td><CategoryBadge category={row.cookie.category} /></td>
									<td>{row.cookie.platform || "—"}</td>
									<td>{row.cookie.source || "cookie"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div class="cb-dialog-footer">
					<div><p class="cb-help">{selectedCount} of {rows.length} selected</p>{error && <p role="alert" class="cb-form-error">{error}</p>}</div>
					<div class="cb-action-group">
						<Button variant="secondary" disabled={submitting} onClick={onCancel}>Cancel</Button>
						<Button disabled={submitting || selectedCount === 0} onClick={confirm}>{submitting ? "Importing…" : `Import ${selectedCount}`}</Button>
					</div>
				</div>
			</div>
		</dialog>
	);
}
