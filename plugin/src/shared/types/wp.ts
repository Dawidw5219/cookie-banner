declare global {
	interface Window {
		cookie4Admin: {
			restUrl: string;
			nonce: string;
			homeUrl: string;
		};
	}
}

export const wp = window.cookie4Admin;
