<?php
/**
 * Admin page — Preact app mount point.
 *
 * @package Cookie_Banner_WP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue admin scripts and styles for the Preact app.
 */
function cookie4_enqueue_admin_app( string $hook ): void {
	if ( 'settings_page_cookie-banner-wp' !== $hook ) {
		return;
	}

	$admin_js  = COOKIE4_PLUGIN_DIR . 'assets/admin/admin.js';
	$admin_css = COOKIE4_PLUGIN_DIR . 'assets/admin/admin.css';

	if ( file_exists( $admin_js ) ) {
		wp_enqueue_script(
			'cookie4-admin-app',
			COOKIE4_PLUGIN_URL . 'assets/admin/admin.js',
			[],
			(string) filemtime( $admin_js ),
			true
		);

		wp_localize_script( 'cookie4-admin-app', 'cookie4Admin', [
			'restUrl' => rest_url( 'cookie4/v1' ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
			'homeUrl' => home_url( '/' ),
            'previewUrl' => admin_url( 'admin-ajax.php?action=cookie4_preview' ),
		] );
	}

	if ( file_exists( $admin_css ) ) {
		wp_enqueue_style(
			'cookie4-admin-app',
			COOKIE4_PLUGIN_URL . 'assets/admin/admin.css',
			[],
			(string) filemtime( $admin_css )
		);
	}
}
add_action( 'admin_enqueue_scripts', 'cookie4_enqueue_admin_app' );

/**
 * Render the admin page — just a mount point for Preact.
 */
function cookie4_render_admin_page(): void {
	echo '<div class="wrap"><div id="cookie-banner-admin"></div></div>';
}

/** Keep third-party notice callbacks off our screen; retain core and our notices. */
function cookie4_focus_admin_notices(): void {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->id !== 'settings_page_cookie-banner-wp') { return; }
    global $wp_filter;
    $allowed = [COOKIE4_PLUGIN_DIR, ABSPATH . 'wp-admin/', ABSPATH . WPINC . '/'];
    $allowed = array_map(fn($path) => trailingslashit(wp_normalize_path(realpath($path) ?: $path)), $allowed);
    foreach (['admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices'] as $hook) {
        foreach (($wp_filter[$hook]->callbacks ?? []) as $priority => $callbacks) {
            foreach ($callbacks as $callback) {
                $function = $callback['function'];
                try {
                    if (is_array($function)) { $reflection = new ReflectionMethod($function[0], $function[1]); }
                    elseif (is_string($function) && str_contains($function, '::')) { $parts = explode('::', $function, 2); $reflection = new ReflectionMethod($parts[0], $parts[1]); }
                    elseif (is_object($function) && !($function instanceof Closure)) { $reflection = new ReflectionMethod($function, '__invoke'); }
                    else { $reflection = new ReflectionFunction($function); }
                    $file = $reflection->getFileName();
                    if (!$file) { continue; }
                    $file = wp_normalize_path($file);
                    $keep = false;
                    foreach ($allowed as $path) { if (str_starts_with($file, $path)) { $keep = true; break; } }
                    if (!$keep) { remove_action($hook, $function, $priority); }
                } catch (ReflectionException $error) {
                    // Leave unresolvable callbacks untouched rather than break admin rendering.
                }
            }
        }
    }
}
add_action('in_admin_header', 'cookie4_focus_admin_notices', PHP_INT_MAX);
