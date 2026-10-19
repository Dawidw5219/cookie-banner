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
html, body { margin:0; padding:0; background:#ffffff; font-family:-apple-system,sans-serif; min-height:100vh; color:#374151; }
body { padding:40px 24px; }
.ph { max-width:400px; margin:0 auto; }
.ph-bar { height:48px; background:#f3f4f6; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; padding:0 16px; gap:12px; }
.ph-bar span { display:block; height:10px; background:#e5e7eb; border-radius:4px; }
.ph-title { height:24px; width:60%; background:#e5e7eb; border-radius:6px; margin-bottom:12px; }
.ph-text { height:10px; background:#f3f4f6; border-radius:4px; margin-bottom:8px; }
.ph-text.w75 { width:75%; }
.ph-text.w90 { width:90%; }
.ph-text.w50 { width:50%; }
.ph-img { height:120px; background:#f3f4f6; border-radius:12px; margin:20px 0; }
</style>
</head>
<body>
<div class="ph">
	<div class="ph-bar"><span style="width:80px"></span><span style="width:60px"></span><span style="flex:1"></span><span style="width:40px"></span></div>
	<div class="ph-title"></div>
	<div class="ph-text w90"></div>
	<div class="ph-text w75"></div>
	<div class="ph-text w50"></div>
	<div class="ph-img"></div>
	<div class="ph-text w90"></div>
	<div class="ph-text w75"></div>
	<div class="ph-text w50"></div>
</div>
<script>
// Listen for config from parent.
window.addEventListener('message', function(e) {
	if (e.data && e.data.type === 'cookie4_preview') {
		// Remove existing banner.
		var host = document.getElementById('cookie-consent-host');
		if (host) host.remove();
		// Clear consent so banner always shows.
		Object.keys(localStorage).forEach(function(k) { if (k.startsWith('cb_')) localStorage.removeItem(k); });
		// Set new config.
		window.__cookieConsent = e.data.config;
		// Re-load banner by inserting a fresh script tag.
		var old = document.getElementById('cb-preview-script');
		if (old) old.remove();
		var s = document.createElement('script');
		s.id = 'cb-preview-script';
		s.src = <?php echo wp_json_encode( $js_url ); ?>;
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
