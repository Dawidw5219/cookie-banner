declare global {
	interface Window {
		cookie4Admin: {
			restUrl: string;
			nonce: string;
			homeUrl: string;
			previewUrl: string;
		};
	}
}

export const wp = window.cookie4Admin;
