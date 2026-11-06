import { useCallback, useEffect, useState } from "preact/hooks";
import { api } from "@/shared/hooks/use-api";

export interface DiagnosticsData {
	version: string;
	wordpress: string;
	php: string;
	theme: string;
	strictCsp: boolean;
	parser: boolean;
	autoBlock: boolean;
	customServices: number;
	cachePlugins: string[];
	otherConsentPlugins: string[];
	auditActive: boolean;
}
export function useDiagnostics() {
	const [data, setData] = useState<DiagnosticsData | null>(null);
	const [error, setError] = useState("");
	const reload = useCallback(async () => {
		setError("");
		try {
			setData(await api<DiagnosticsData>("/diagnostics"));
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Could not load diagnostics",
			);
		}
	}, []);
	useEffect(() => {
		void reload();
	}, [reload]);
	return { data, error, reload };
}
