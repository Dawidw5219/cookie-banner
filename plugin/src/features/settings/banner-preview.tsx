import { wp } from "@/shared/types/wp";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/shared/ui/button";

interface BannerPreviewProps {
	config: Record<string, unknown>;
	previewVariant?: string;
}

export function BannerPreview({ config, previewVariant }: BannerPreviewProps) {
	const iframe = useRef<HTMLIFrameElement>(null);
	const ready = useRef(false);
	const requestId = useRef(0);
	const sentRequestId = useRef<number | null>(null);
	const currentConfig = useRef(config);
	const [attempt, setAttempt] = useState(0);
	const [updating, setUpdating] = useState(true);
	const [state, setState] = useState<"loading" | "ready" | "error">("loading");
	currentConfig.current = { ...config, variant: previewVariant || config.variant || "modal" };
	const configKey = JSON.stringify(currentConfig.current);

	function sendConfig() {
		if (ready.current && sentRequestId.current !== requestId.current) {
			sentRequestId.current = requestId.current;
			iframe.current?.contentWindow?.postMessage({ type: "cookie4_preview", config: currentConfig.current, requestId: requestId.current }, "*");
		}
	}

	useEffect(() => {
		const timeout = window.setTimeout(() => setState((current) => current === "loading" ? "error" : current), 15000);
		function onMessage(event: MessageEvent) {
			// Only the opaque sandbox for this preview may change its loading state.
			if (event.source !== iframe.current?.contentWindow || event.origin !== "null") return;
			if (event.data?.type === "cookie4_preview_ready") {
				ready.current = true;
				sendConfig();
			} else if (event.data?.type === "cookie4_preview_rendered" && event.data.requestId === requestId.current) {
				clearTimeout(timeout);
				setState("ready");
				setUpdating(false);
			} else if (event.data?.type === "cookie4_preview_error" && event.data.requestId === requestId.current) {
				clearTimeout(timeout);
				setState("error");
				setUpdating(false);
			}
		}
		window.addEventListener("message", onMessage);
		return () => { clearTimeout(timeout); window.removeEventListener("message", onMessage); };
	}, [attempt]);

	useLayoutEffect(() => {
		requestId.current += 1;
		setUpdating(true);
		const timer = window.setTimeout(sendConfig, 300);
		return () => clearTimeout(timer);
	}, [configKey, attempt]);

	function retry() {
		ready.current = false;
		sentRequestId.current = null;
		setState("loading");
		setAttempt((value) => value + 1);
	}

	return (
		<div class="cb-preview-canvas">
			<div class="cb-preview-window">
				<div class="cb-preview-chrome" aria-hidden="true">
					<span class="cb-preview-dots"><i /><i /><i /></span>
					<span class="cb-preview-address">Your website</span>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 10V7a4 4 0 0 1 8 0v3M6 10h12v11H6z" /></svg>
				</div>
				<div class="cb-preview-stage" aria-busy={state === "loading" || updating}>
					<iframe key={attempt} ref={iframe} title="Isolated cookie banner preview" sandbox="allow-scripts" src={wp.previewUrl} />
					{state !== "ready" && <div class="cb-preview-feedback">
						<p role="status">{state === "loading" ? "Loading live preview…" : "The preview could not be loaded."}</p>
						{state === "error" && <Button variant="secondary" onClick={retry}>Retry preview</Button>}
					</div>}
				</div>
			</div>
		</div>
	);
}
