// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	acquireBannerScrollLock,
	observeBannerHostRemoval,
	releaseBannerScrollLock,
	setBannerHostBlocking,
	syncBannerScrollLock,
} from "./scroll-lock";

function createHost(): HTMLElement {
	const host = document.createElement("div");
	document.body.appendChild(host);
	return host;
}

async function flushMutationObserver(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("cookie banner scroll lock lifecycle", () => {
	beforeEach(() => {
		releaseBannerScrollLock();
		document.body.replaceChildren();
		document.body.style.overflow = "auto";
	});

	afterEach(() => {
		releaseBannerScrollLock();
		document.body.style.overflow = "";
	});

	it("locks overlay and preferences idempotently", () => {
		const host = createHost();

		syncBannerScrollLock(host, true); // overlay
		syncBannerScrollLock(host, true); // preferences

		expect(document.body.style.overflow).toBe("hidden");
		expect(host.style.position).toBe("fixed");
		expect(host.style.pointerEvents).toBe("auto");
	});

	it.each(["accept", "reject", "save", "idle"])(
		"releases its lock on %s",
		() => {
			const host = createHost();
			syncBannerScrollLock(host, true);

			syncBannerScrollLock(host, false);

			expect(document.body.style.overflow).toBe("auto");
			expect(host.getAttribute("style")).toBeNull();
		},
	);

	it("releases its lock during controlled unmount or teardown", () => {
		const host = createHost();
		syncBannerScrollLock(host, true);

		setBannerHostBlocking(host, false);
		releaseBannerScrollLock();
		releaseBannerScrollLock();

		expect(document.body.style.overflow).toBe("auto");
		expect(host.getAttribute("style")).toBeNull();
	});

	it("restores the previous overflow after raw host removal", async () => {
		const host = createHost();
		const cleanup = vi.fn(() => {
			setBannerHostBlocking(host, false);
			releaseBannerScrollLock();
		});
		observeBannerHostRemoval(host, cleanup);
		syncBannerScrollLock(host, true);

		host.remove();
		await flushMutationObserver();

		expect(cleanup).toHaveBeenCalledOnce();
		expect(document.body.style.overflow).toBe("auto");
		expect(host.getAttribute("style")).toBeNull();
	});

	it("does not overwrite a later independent overflow value", () => {
		acquireBannerScrollLock();
		document.body.style.overflow = "clip";

		releaseBannerScrollLock();

		expect(document.body.style.overflow).toBe("clip");
	});
});
