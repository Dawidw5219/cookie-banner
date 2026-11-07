import { hasRevocationPolicy } from "./revocation-policy";
import { applyConsent } from "./consent-actions";
import { getConsentState, isConsentStorageChange } from "./consent-storage";

export function hasServiceConsent(service: string): boolean {
	return (
		typeof window !== "undefined" &&
		!window.__cookieConsent?.preview &&
		!hasRevocationPolicy() &&
		getConsentState().services?.[service] === true
	);
}

export function setServiceConsent(service: string, granted: boolean): void {
	const state = getConsentState();
	state.services = { ...state.services, [service]: granted };
	const config = window.__cookieConsent;
	if (!config) throw new Error("Initialize consent before changing a service");
	applyConsent(config, state);
}

/** Subscribe before mounting a widget or making its first network call. */
export function onServiceConsent(
	service: string,
	callback: (granted: boolean) => void,
): () => void {
	let previous: boolean | undefined;
	const update = (event?: Event) => {
		if (
			event?.type === "storage" &&
			!isConsentStorageChange(event as StorageEvent)
		)
			return;
		const granted = hasServiceConsent(service);
		if (granted !== previous) {
			previous = granted;
			callback(granted);
		}
	};
	window.addEventListener("cb:consent-update", update);
	window.addEventListener("storage", update);
	update();
	return () => {
		window.removeEventListener("cb:consent-update", update);
		window.removeEventListener("storage", update);
	};
}
