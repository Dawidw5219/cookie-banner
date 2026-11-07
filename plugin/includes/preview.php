<?php
/**
 * Banner preview — serves a minimal HTML page for the admin iframe.
 *
 * @package Cookie_Banner_WP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_ajax_cookie4_preview', 'cookie4_render_preview' );

function cookie4_render_preview(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Unauthorized', 403 );
	}

	$js_file = COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js';
	$js_ver  = file_exists( $js_file ) ? filemtime( $js_file ) : COOKIE4_VERSION;
	$js_url  = COOKIE4_PLUGIN_URL . 'assets/cookie-banner.js?ver=' . $js_ver;
	?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*, *::before, *::after { box-sizing:border-box; }
html, body { width:100%; margin:0; padding:0; background:#f8fafc; font-family:-apple-system,sans-serif; min-height:100vh; color:#374151; }
body { padding:20px 16px; }
.ph { width:100%; max-width:400px; margin:0 auto; }
.ph-bar { height:40px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
.ph-logo { width:28px; height:28px; flex-shrink:0; background:#e2e8f0; border-radius:7px; }
.ph-bar span { display:block; height:7px; width:32px; background:#e2e8f0; border-radius:4px; }
.ph-bar span:first-of-type { width:60px; margin-right:auto; }
.ph-hero { padding:20px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
.ph-title { height:14px; width:75%; background:#dbe1e8; border-radius:4px; margin-bottom:14px; }
.ph-text { height:7px; background:#edf0f4; border-radius:4px; margin-bottom:8px; }
.ph-text.w75 { width:75%; }
.ph-text.w90 { width:90%; }
.ph-text.w50 { width:50%; }
.ph-img { height:76px; background:#edf0f4; border-radius:6px; margin:18px 0 0; }
</style>
</head>
<body>
<div class="ph" aria-hidden="true">
	<div class="ph-bar"><div class="ph-logo"></div><span></span><span></span><span></span></div>
	<div class="ph-hero">
		<div class="ph-title"></div>
		<div class="ph-text w90"></div>
		<div class="ph-text w75"></div>
		<div class="ph-text w50"></div>
		<div class="ph-img"></div>
	</div>
</div>
<script>
// Listen for config from parent.
window.addEventListener('message', function(e) {
	if (e.source === window.parent && e.origin === new URL(<?php echo wp_json_encode(admin_url()); ?>).origin && e.data && e.data.type === 'cookie4_preview') {
		var requestId = e.data.requestId;
		// The opaque sandbox cannot read or write the site's real consent storage.
		if (window.CookieConsent && window.CookieConsent.teardown) window.CookieConsent.teardown();
		// Remove existing banner.
		var host = document.getElementById('cookie-consent-host');
		if (host) host.remove();
		// Set new config.
		window.__cookieConsent = Object.assign({}, e.data.config, {preview:true, strictCsp:false, autoBlock:false, receiptEndpoint:undefined, loadGtm:false, gtmId:undefined, scripts:undefined});
		// Re-load banner by inserting a fresh script tag.
		var old = document.getElementById('cb-preview-script');
		if (old) old.remove();
		var s = document.createElement('script');
		s.id = 'cb-preview-script';
		s.src = <?php echo wp_json_encode( $js_url ); ?>;
		s.onload = function() { window.parent.postMessage({ type: 'cookie4_preview_rendered', requestId: requestId }, '*'); };
		s.onerror = function() { window.parent.postMessage({ type: 'cookie4_preview_error', requestId: requestId }, '*'); };
		document.body.appendChild(s);
	}
});
// Initial load: request config from parent.
if (window.parent && window.parent !== window) {
	window.parent.postMessage({ type: 'cookie4_preview_ready' }, '*');
}
</script>
</body>
</html>
	<?php
	wp_die();
}
