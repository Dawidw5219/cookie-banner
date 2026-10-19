import { useEffect, useRef } from "preact/hooks";

interface BannerPreviewProps {
	config: Record<string, unknown>;
	previewVariant?: string;
}

// Build the preview iframe URL (WordPress AJAX endpoint).
const PREVIEW_URL =
	(window.cookie4Admin?.homeUrl || "/") +
	"wp-admin/admin-ajax.php?action=cookie4_preview";

/**
 * Live banner preview via an iframe that loads the real banner JS.
 * Uses postMessage to send config updates without reloading the iframe.
 */
export function BannerPreview({ config, previewVariant }: BannerPreviewProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const timerRef = useRef<number>(0);
	const readyRef = useRef(false);

	const previewConfig = {
		...config,
		variant: previewVariant || config.variant || "modal",
	};

	// Send config to iframe.
	function sendConfig() {
		if (!iframeRef.current?.contentWindow || !readyRef.current) return;
		iframeRef.current.contentWindow.postMessage(
			{ type: "cookie4_preview", config: previewConfig },
			"*",
		);
	}

	// Listen for "ready" from iframe.
	useEffect(() => {
		function onMessage(e: MessageEvent) {
			if (e.data?.type === "cookie4_preview_ready") {
				readyRef.current = true;
				sendConfig();
			}
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	// Debounced config push.
	const configKey = JSON.stringify(previewConfig);
	useEffect(() => {
		clearTimeout(timerRef.current);
		timerRef.current = window.setTimeout(sendConfig, 300);
		return () => clearTimeout(timerRef.current);
	}, [configKey]);

	return (
		<iframe
			ref={iframeRef}
			src={PREVIEW_URL}
			class="w-full bg-gray-100"
			style={{ height: "480px", border: "none" }}
		/>
	);
}
