import { useState, useEffect, useCallback } from "preact/hooks";
import { api } from "@/shared/hooks/use-api";
import { toast } from "@/shared/ui/toast";
import { wp } from "@/shared/types/wp";

export interface Cookie {
	name: string;
	domain: string;
	source: string;
	category: string;
	platform: string;
	description: string;
	retention: string;
	privacy_link: string;
	wp_scope: string;
	auto: boolean;
	first_seen: string;
	last_seen: string;
	pages: string[];
}

export interface Tracker {
	tracker_id: string;
	name: string;
	category: string;
	description: string;
	privacy_link: string;
	detected_via: string;
	detected_urls: string[];
	pages: string[];
	first_seen: string;
	last_seen: string;
	audit_status: "" | "ok" | "violation";
}

interface CookiesResponse {
	cookies: Record<string, Cookie>;
	last_scan: string;
	scan_active: boolean;
	audit_active: boolean;
}

interface TrackersResponse {
	trackers: Tracker[];
}

export function useScanner() {
	const [cookies, setCookies] = useState<Cookie[]>([]);
	const [trackers, setTrackers] = useState<Tracker[]>([]);
	const [lastScan, setLastScan] = useState("");
	const [scanActive, setScanActive] = useState(false);
	const [auditActive, setAuditActive] = useState(false);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const [cookieData, trackerData] = await Promise.all([
				api<CookiesResponse>("/cookies"),
				api<TrackersResponse>("/trackers"),
			]);
			setCookies(Object.values(cookieData.cookies));
			setLastScan(cookieData.last_scan);
			setScanActive(cookieData.scan_active);
			setAuditActive(cookieData.audit_active);
			setTrackers(trackerData.trackers);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const clearAll = useCallback(async () => {
		await Promise.all([
			api("/cookies", { method: "DELETE" }),
			api("/trackers", { method: "DELETE" }),
		]);
		setCookies([]);
		setTrackers([]);
		toast("All cookies and trackers cleared");
	}, []);

	const updateCategory = useCallback(
		async (name: string, category: string) => {
			await api(`/cookies/${encodeURIComponent(name)}/category`, {
				method: "PATCH",
				body: JSON.stringify({ category }),
			});
			setCookies((prev) =>
				prev.map((c) => (c.name === name ? { ...c, category } : c)),
			);
		},
		[],
	);

	const addCookie = useCallback(
		async (data: { name: string; category: string; platform: string; description: string; retention: string }) => {
			await api("/cookies/add", {
				method: "POST",
				body: JSON.stringify(data),
			});
			toast("Cookie added");
			refresh();
		},
		[refresh],
	);

	const startAudit = useCallback(async () => {
		await Promise.all([
			api("/scan-mode", { method: "POST", body: JSON.stringify({ active: true }) }),
			api("/audit-mode", { method: "POST", body: JSON.stringify({ active: true }) }),
		]);
		setAuditActive(true);
		setScanActive(true);
		toast("Audit started — browse your site to test consent compliance");
		window.open(wp.homeUrl, "_blank");
	}, []);

	const stopAudit = useCallback(async () => {
		await Promise.all([
			api("/scan-mode", { method: "POST", body: JSON.stringify({ active: false }) }),
			api("/audit-mode", { method: "POST", body: JSON.stringify({ active: false }) }),
		]);
		setAuditActive(false);
		setScanActive(false);
		toast("Audit complete — check results below");
		refresh();
	}, [refresh]);

	const exportCookies = useCallback(async () => {
		const data = await api<{ cookies: Cookie[]; exported_at: string; count: number }>(
			"/cookies/export",
		);
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
		a.href = url;
		a.download = `cookies-export-${stamp}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast(`Exported ${data.count} cookies`);
	}, []);

	const importCookies = useCallback(
		async (selected: Cookie[]) => {
			const result = await api<{ added: number; updated: number; skipped: number; total: number }>(
				"/cookies/import",
				{
					method: "POST",
					body: JSON.stringify({ cookies: selected }),
				},
			);
			toast(`Imported: ${result.added} new, ${result.updated} updated`);
			refresh();
			return result;
		},
		[refresh],
	);

	const scanUrl = `${wp.homeUrl}?cookie_scan=1`;

	const total = cookies.length;
	const categorized = cookies.filter((c) => c.category !== "Unknown").length;
	const uncategorized = total - categorized;
	const trackerCount = trackers.length;

	return {
		cookies,
		trackers,
		lastScan,
		scanActive,
		auditActive,
		loading,
		total,
		categorized,
		uncategorized,
		trackerCount,
		scanUrl,
		refresh,
		clearAll,
		updateCategory,
		addCookie,
		startAudit,
		stopAudit,
		exportCookies,
		importCookies,
	};
}
