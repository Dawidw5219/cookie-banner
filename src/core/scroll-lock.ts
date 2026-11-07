const HOST_BLOCK_PROPS: Record<string, string> = {
	position: "fixed",
	inset: "0",
	width: "100%",
	height: "100%",
	"pointer-events": "auto",
	"z-index": "2147483647",
};

type OwnedScrollLock = {
	body: HTMLElement;
	previousOverflow: string;
};

let ownedScrollLock: OwnedScrollLock | null = null;

export function acquireBannerScrollLock(body = document.body): void {
	if (ownedScrollLock) return;

	ownedScrollLock = {
		body,
		previousOverflow: body.style.overflow,
	};
	body.style.overflow = "hidden";
}

export function releaseBannerScrollLock(): void {
	if (!ownedScrollLock) return;

	const { body, previousOverflow } = ownedScrollLock;
	ownedScrollLock = null;

	// A later value belongs to whoever changed it after the banner acquired
	// the lock. Never overwrite that independent owner's state.
	if (body.style.overflow === "hidden") {
		body.style.overflow = previousOverflow;
	}
}

export function setBannerHostBlocking(
	host: HTMLElement,
	blocking: boolean,
): void {
	for (const [property, value] of Object.entries(HOST_BLOCK_PROPS)) {
		if (blocking) {
			host.style.setProperty(property, value);
		} else {
			host.style.removeProperty(property);
		}
	}
	if (!blocking && host.style.length === 0) {
		host.removeAttribute("style");
	}
}

export function syncBannerScrollLock(
	host: HTMLElement,
	blocking: boolean,
): void {
	setBannerHostBlocking(host, blocking);
	if (blocking) {
		acquireBannerScrollLock();
	} else {
		releaseBannerScrollLock();
	}
}

export function observeBannerHostRemoval(
	host: HTMLElement,
	onRemoved: () => void,
): () => void {
	const observer = new MutationObserver(() => {
		if (host.isConnected) return;
		observer.disconnect();
		onRemoved();
	});

	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
	});
	return () => observer.disconnect();
}
