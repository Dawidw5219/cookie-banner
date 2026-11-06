import { useCallback, useEffect, useState } from "preact/hooks";
import { api } from "@/shared/hooks/use-api";
import { toast } from "@/shared/ui/toast";

export interface CustomService {
	id: string;
	name: string;
	description: string;
	privacyUrl: string;
	urls: string[];
}

export function useServices() {
	const [services, setServices] = useState<CustomService[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const reload = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			setServices(
				(await api<{ services: CustomService[] }>("/services")).services,
			);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Could not load services",
			);
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		void reload();
	}, [reload]);
	const save = async (next: CustomService[]) => {
		setSaving(true);
		setError("");
		try {
			const result = await api<{ services: CustomService[] }>("/services", {
				method: "PUT",
				body: JSON.stringify({ services: next }),
			});
			setServices(result.services);
			toast("Services saved; supported page caches cleared");
			return true;
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Could not save services",
			);
			return false;
		} finally {
			setSaving(false);
		}
	};
	return { services, loading, saving, error, reload, save };
}
