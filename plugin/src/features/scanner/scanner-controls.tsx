import { useRef, useState } from "preact/hooks";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toast";
import { ImportModal } from "./import-modal";
import type { Cookie } from "./use-scanner";

interface ScannerControlsProps {
	scanActive: boolean;
	scanUrl: string;
	total: number;
	cookies: Cookie[];
	onRefresh: () => void;
	onClear: () => void;
	onExport: () => Promise<void>;
	onImport: (selected: Cookie[]) => Promise<unknown>;
}

export function ScannerControls({
	scanActive,
	scanUrl,
	total,
	cookies,
	onRefresh,
	onClear,
	onExport,
	onImport,
}: ScannerControlsProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importing, setImporting] = useState<{ cookies: Cookie[]; fileName: string } | null>(null);

	const handleFileChange = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;

		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			const incoming: unknown = Array.isArray(parsed)
				? parsed
				: Array.isArray(parsed?.cookies)
					? parsed.cookies
					: null;

			if (!Array.isArray(incoming)) {
				toast("Invalid file: expected JSON with { cookies: [...] } or an array");
				return;
			}

			const valid = (incoming as unknown[]).filter(
				(c): c is Cookie => typeof c === "object" && c !== null && typeof (c as Cookie).name === "string" && (c as Cookie).name.length > 0,
			);

			if (valid.length === 0) {
				toast("No valid cookies in file");
				return;
			}

			setImporting({ cookies: valid, fileName: file.name });
		} catch (err) {
			toast(`Failed to parse file: ${(err as Error).message}`);
		}
	};

	const handleConfirmImport = async (selected: Cookie[]) => {
		await onImport(selected);
		setImporting(null);
	};

	return (
		<>
			<Card
				title="Scanner Controls"
				description="Open your site with scan mode to detect cookies. Browse all pages as both logged-in and logged-out user."
				actions={<Badge tone={scanActive ? "success" : "neutral"}>{scanActive ? "Scanning" : "Inactive"}</Badge>}
			>
				<div class="flex flex-wrap gap-3">
					<a
						href={scanUrl}
						target="_blank"
						rel="noopener"
						class="cb-admin-button cb-admin-button--primary"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
						Open Site in Scan Mode
					</a>
					<Button variant="secondary" onClick={onRefresh}>
						Refresh Results
					</Button>
					{total > 0 && (
						<Button
							variant="secondary"
							onClick={onExport}
							icon={
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
								</svg>
							}
						>
							Export JSON
						</Button>
					)}
					<Button
						variant="secondary"
						onClick={() => fileInputRef.current?.click()}
						icon={
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5L12 3m0 0l4.5 4.5M12 3v13.5" />
							</svg>
						}
					>
						Import JSON
					</Button>
					{total > 0 && (
						<Button variant="danger" onClick={onClear}>
							Clear All
						</Button>
					)}
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="application/json,.json"
					class="hidden"
					onChange={handleFileChange}
				/>
			</Card>

			{importing && (
				<ImportModal
					incoming={importing.cookies}
					existing={cookies}
					fileName={importing.fileName}
					onCancel={() => setImporting(null)}
					onConfirm={handleConfirmImport}
				/>
			)}
		</>
	);
}
