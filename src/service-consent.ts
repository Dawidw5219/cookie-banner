import { getConsentState, saveConsentState } from "./hooks/use-storage";

export function hasServiceConsent(service: string): boolean {
	return (
		typeof window !== "undefined" &&
		getConsentState().services?.[service] === true
	);
}

export function setServiceConsent(service: string, granted: boolean): void {
	const state = getConsentState();
	const revoked = state.services?.[service] === true && !granted;
	state.services = { ...state.services, [service]: granted };
	saveConsentState(state);
	if (window.__cookieConsent?.strictCsp) {
		window.location.reload();
		return;
	}
	window.dispatchEvent(new CustomEvent("cb:consent-update", { detail: state }));
	if (revoked) window.location.reload();
}

/** Subscribe before mounting a widget or making its first network call. */
export function onServiceConsent(
	service: string,
	callback: (granted: boolean) => void,
): () => void {
	let previous: boolean | undefined;
	const update = () => {
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
