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
