<?php
/**
 * Cookie Scanner — REST API, admin page, and frontend scanner loader.
 *
 * @package Cookie_Banner_WP
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ───────────────────────────────────────────────
 * 1. Scanner section (embedded in main settings page)
 * ─────────────────────────────────────────────── */

/**
 * Enqueue scanner assets on the cookie banner settings page.
 * Called from settings.php via the admin_enqueue_scripts hook.
 */
function cookie4_scanner_enqueue_assets( string $current_hook ): void {
	if ( $current_hook !== 'settings_page_cookie-banner-wp' ) {
		return;
	}

	// Tailwind CDN — scoped to this admin page only.
	wp_enqueue_script(
		'tailwindcss-cdn',
		'https://cdn.tailwindcss.com',
		[],
		null,
		false
	);

	// Disable Tailwind preflight so it doesn't mess with WP admin styles.
	wp_add_inline_script( 'tailwindcss-cdn', "tailwind.config={corePlugins:{preflight:false}}" );

	// Scanner admin interactions are inline in scanner-page.php.
	// Just provide the config object they need.
	wp_add_inline_script( 'tailwindcss-cdn', 'var cookie4Scanner = ' . wp_json_encode( [
		'restUrl'    => rest_url( 'cookie4/v1/' ),
		'nonce'      => wp_create_nonce( 'wp_rest' ),
		'scanUrl'    => home_url( '/?cookie_scan=1' ),
		'siteUrl'    => home_url( '/' ),
		'auditMode'  => get_option( 'cookie4_audit_mode', '' ) === '1',
	] ) . ';' );
}

add_action( 'admin_enqueue_scripts', 'cookie4_scanner_enqueue_assets' );

/**
 * Classify a cookie as 'admin', 'logged_in', or '' (public).
 */
function cookie4_classify_wp_cookie( string $name ): string {
	// Admin-only: only set when user accesses wp-admin.
	$admin_patterns = [ 'wp-settings-', 'wp-settings-time-', 'wp-admin-' ];
	foreach ( $admin_patterns as $pattern ) {
		if ( str_starts_with( $name, $pattern ) ) {
			return 'admin';
		}
	}

	// Logged-in: set for any authenticated WordPress user.
	$login_patterns = [ 'wordpress_logged_in_', 'wordpress_sec_', 'wp-postpass_', 'wordpress_test_cookie' ];
	foreach ( $login_patterns as $pattern ) {
		if ( str_starts_with( $name, $pattern ) || $name === $pattern ) {
			return 'logged_in';
		}
	}

	return '';
}

/**
 * Match cookies set by our own Cookie Banner plugin.
 */
function cookie4_match_own_cookie( string $name ): ?array {
	$own = [
		'cb_has_consented'      => 'Stores whether the visitor has interacted with the cookie consent banner.',
		'cb_consent_essential'  => 'Stores consent status for essential/functional cookies (always granted).',
		'cb_consent_analytics'  => 'Stores consent status for analytics cookies.',
		'cb_consent_marketing'  => 'Stores consent status for marketing cookies.',
	];

	if ( ! isset( $own[ $name ] ) ) {
		return null;
	}

	return [
		'category'        => 'Functional',
		'platform'        => 'Cookie Banner App4You',
		'description'     => $own[ $name ],
		'retentionPeriod' => 'Persistent (localStorage)',
		'privacyLink'     => '',
	];
}

/**
 * Render the scanner section. Called from settings.php render function.
 */
function cookie4_scanner_render_section(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$cookies        = get_option( 'cookie4_scanned_cookies', [] );
	$last_scan      = get_option( 'cookie4_last_scan', '' );
	$scan_active    = get_option( 'cookie4_scan_active', '' );
	$cookie_db      = cookie4_get_cookie_database();

	// Retroactively enrich cookies missing platform/description from database.
	$dirty = false;
	foreach ( $cookies as $key => &$cookie ) {
		if ( ! empty( $cookie['platform'] ) ) {
			continue;
		}
		$own_match = cookie4_match_own_cookie( $cookie['name'] );
		$db_match  = $own_match ?: cookie4_match_cookie_in_db( $cookie['name'], $cookie_db );
		if ( $db_match ) {
			$cookie['platform']     = $db_match['platform'] ?? '';
			$cookie['description']  = $cookie['description'] ?: ( $db_match['description'] ?? '' );
			$cookie['retention']    = $cookie['retention'] ?: ( $db_match['retentionPeriod'] ?? '' );
			$cookie['privacy_link'] = $cookie['privacy_link'] ?? ( $db_match['privacyLink'] ?? '' );
			$cookie['category']     = $cookie['category'] === 'Unknown' ? ( $db_match['category'] ?? 'Unknown' ) : $cookie['category'];
			$cookie['auto']         = true;
			$dirty = true;
		}
	}
	unset( $cookie );
	if ( $dirty ) {
		update_option( 'cookie4_scanned_cookies', $cookies, false );
	}

	$total           = count( $cookies );
	$categorized     = count( array_filter( $cookies, fn( $c ) => ( $c['category'] ?? 'Unknown' ) !== 'Unknown' ) );
	$uncategorized   = $total - $categorized;

	// Tracker data.
	$trackers        = get_option( 'cookie4_detected_trackers', [] );
	$tracker_count   = count( $trackers );
	$audit_active    = get_option( 'cookie4_audit_mode', '' ) === '1';

	require COOKIE4_PLUGIN_DIR . 'includes/scanner-page.php';
}

/* ───────────────────────────────────────────────
 * 2. REST API
 * ─────────────────────────────────────────────── */

add_action( 'rest_api_init', 'cookie4_scanner_register_routes' );

function cookie4_scanner_register_routes(): void {
	$ns = 'cookie4/v1';

	// Receive scanned cookies from frontend.
	register_rest_route( $ns, '/scan', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_receive',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Get stored cookies.
	register_rest_route( $ns, '/cookies', [
		'methods'             => 'GET',
		'callback'            => 'cookie4_scanner_get_cookies',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Delete all scanned cookies.
	register_rest_route( $ns, '/cookies', [
		'methods'             => 'DELETE',
		'callback'            => 'cookie4_scanner_clear_cookies',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Toggle scan mode on/off.
	register_rest_route( $ns, '/scan-mode', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_toggle_mode',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Add a cookie manually.
	register_rest_route( $ns, '/cookies/add', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_add_manual',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Update cookie category (manual categorization).
	register_rest_route( $ns, '/cookies/(?P<name>[^/]+)/category', [
		'methods'             => 'PATCH',
		'callback'            => 'cookie4_scanner_update_category',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Export all stored cookies as JSON.
	register_rest_route( $ns, '/cookies/export', [
		'methods'             => 'GET',
		'callback'            => 'cookie4_scanner_export_cookies',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Import cookies from JSON payload (selective).
	register_rest_route( $ns, '/cookies/import', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_import_cookies',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Receive detected trackers from frontend.
	register_rest_route( $ns, '/trackers', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_receive_trackers',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Get stored trackers.
	register_rest_route( $ns, '/trackers', [
		'methods'             => 'GET',
		'callback'            => 'cookie4_scanner_get_trackers',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Delete all detected trackers.
	register_rest_route( $ns, '/trackers', [
		'methods'             => 'DELETE',
		'callback'            => 'cookie4_scanner_clear_trackers',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Toggle audit mode on/off.
	register_rest_route( $ns, '/audit-mode', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_toggle_audit',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );

	// Record tracker IDs detected during audit mode.
	register_rest_route( $ns, '/audit-detections', [
		'methods'             => 'POST',
		'callback'            => 'cookie4_scanner_record_audit_detections',
		'permission_callback' => fn() => current_user_can( 'manage_options' ),
	] );
}

function cookie4_scanner_receive( WP_REST_Request $request ): WP_REST_Response {
	$items   = $request->get_json_params();
	$cookies = get_option( 'cookie4_scanned_cookies', [] );
	$db      = cookie4_get_cookie_database();

	if ( ! is_array( $items ) ) {
		return new WP_REST_Response( [ 'error' => 'Invalid payload' ], 400 );
	}

	foreach ( $items as $item ) {
		$name   = sanitize_text_field( $item['name'] ?? '' );
		$domain = sanitize_text_field( $item['domain'] ?? '' );
		$value_preview = mb_substr( sanitize_text_field( $item['value'] ?? '' ), 0, 50 );
		$source = sanitize_text_field( $item['source'] ?? 'cookie' ); // cookie | localStorage | sessionStorage
		$page   = esc_url_raw( $item['page'] ?? '' );

		if ( empty( $name ) ) {
			continue;
		}

		$key = $name . '|' . $domain . '|' . $source;

		// Our own banner cookies — auto-categorize.
		$cb_own = cookie4_match_own_cookie( $name );

		// Lookup in Open Cookie Database.
		$db_match = $cb_own ? null : cookie4_match_cookie_in_db( $name, $db );

		if ( isset( $cookies[ $key ] ) ) {
			// Update last seen + add page if new.
			$cookies[ $key ]['last_seen'] = current_time( 'mysql' );
			if ( $page && ! in_array( $page, $cookies[ $key ]['pages'], true ) ) {
				$cookies[ $key ]['pages'][] = $page;
			}
		} else {
			$match = $cb_own ?: $db_match;
			$cookies[ $key ] = [
				'name'         => $name,
				'domain'       => $domain,
				'source'       => $source,
				'category'     => $match ? $match['category'] : 'Unknown',
				'platform'     => $match ? $match['platform'] : '',
				'description'  => $match ? $match['description'] : '',
				'retention'    => $match ? ( $match['retentionPeriod'] ?? '' ) : '',
				'privacy_link' => $match ? ( $match['privacyLink'] ?? '' ) : '',
				'wp_scope'     => cookie4_classify_wp_cookie( $name ),
				'auto'         => $match ? true : false,
				'first_seen'   => current_time( 'mysql' ),
				'last_seen'    => current_time( 'mysql' ),
				'pages'        => $page ? [ $page ] : [],
				'value_preview' => $value_preview,
			];
		}
	}

	update_option( 'cookie4_scanned_cookies', $cookies, false );
	update_option( 'cookie4_last_scan', current_time( 'mysql' ), false );

	return new WP_REST_Response( [
		'stored' => count( $cookies ),
		'new'    => count( $items ),
	] );
}

function cookie4_scanner_get_cookies(): WP_REST_Response {
	return new WP_REST_Response( [
		'cookies'      => array_values( get_option( 'cookie4_scanned_cookies', [] ) ),
		'last_scan'    => get_option( 'cookie4_last_scan', '' ),
		'scan_active'  => get_option( 'cookie4_scan_active', '' ) === '1',
		'audit_active' => get_option( 'cookie4_audit_mode', '' ) === '1',
	] );
}

function cookie4_scanner_clear_cookies(): WP_REST_Response {
	update_option( 'cookie4_scanned_cookies', [], false );
	update_option( 'cookie4_last_scan', '', false );
	return new WP_REST_Response( [ 'cleared' => true ] );
}

function cookie4_scanner_toggle_mode( WP_REST_Request $request ): WP_REST_Response {
	$active = $request->get_param( 'active' );
	update_option( 'cookie4_scan_active', $active ? '1' : '', false );
	return new WP_REST_Response( [ 'active' => (bool) $active ] );
}

function cookie4_scanner_update_category( WP_REST_Request $request ): WP_REST_Response {
	$cookie_name = urldecode( $request->get_param( 'name' ) );
	$category    = sanitize_text_field( $request->get_param( 'category' ) ?? '' );
	$cookies     = get_option( 'cookie4_scanned_cookies', [] );

	$found = false;
	foreach ( $cookies as $key => &$cookie ) {
		if ( $cookie['name'] === $cookie_name ) {
			$cookie['category'] = $category;
			$cookie['auto']     = false;
			$found              = true;
		}
	}
	unset( $cookie );

	if ( ! $found ) {
		return new WP_REST_Response( [ 'error' => 'Cookie not found' ], 404 );
	}

	update_option( 'cookie4_scanned_cookies', $cookies, false );
	return new WP_REST_Response( [ 'updated' => true ] );
}

function cookie4_scanner_add_manual( WP_REST_Request $request ): WP_REST_Response {
	$name        = sanitize_text_field( $request->get_param( 'name' ) ?? '' );
	$category    = sanitize_text_field( $request->get_param( 'category' ) ?? 'Unknown' );
	$description = sanitize_text_field( $request->get_param( 'description' ) ?? '' );
	$retention   = sanitize_text_field( $request->get_param( 'retention' ) ?? '' );
	$platform    = sanitize_text_field( $request->get_param( 'platform' ) ?? '' );

	if ( empty( $name ) ) {
		return new WP_REST_Response( [ 'error' => 'Name is required' ], 400 );
	}

	$cookies = get_option( 'cookie4_scanned_cookies', [] );
	$key     = $name . '||manual';

	$cookies[ $key ] = [
		'name'         => $name,
		'domain'       => '',
		'source'       => 'manual',
		'category'     => $category,
		'platform'     => $platform,
		'description'  => $description,
		'retention'    => $retention,
		'privacy_link' => '',
		'wp_scope'     => '',
		'auto'         => false,
		'first_seen'   => current_time( 'mysql' ),
		'last_seen'    => current_time( 'mysql' ),
		'pages'        => [],
		'value_preview' => '',
	];

	update_option( 'cookie4_scanned_cookies', $cookies, false );
	return new WP_REST_Response( [ 'added' => true, 'total' => count( $cookies ) ] );
}

function cookie4_scanner_export_cookies(): WP_REST_Response {
	$cookies = array_values( get_option( 'cookie4_scanned_cookies', [] ) );

	return new WP_REST_Response( [
		'version'     => 1,
		'plugin'      => 'cookie-banner-wp',
		'exported_at' => current_time( 'mysql' ),
		'site_url'    => home_url( '/' ),
		'count'       => count( $cookies ),
		'cookies'     => $cookies,
	] );
}

function cookie4_scanner_import_cookies( WP_REST_Request $request ): WP_REST_Response {
	$payload = $request->get_json_params();
	$items   = is_array( $payload['cookies'] ?? null ) ? $payload['cookies'] : null;

	if ( ! is_array( $items ) ) {
		return new WP_REST_Response( [ 'error' => 'Invalid payload: expected { cookies: [...] }' ], 400 );
	}

	$cookies = get_option( 'cookie4_scanned_cookies', [] );
	$added   = 0;
	$updated = 0;
	$skipped = 0;

	foreach ( $items as $item ) {
		$name = sanitize_text_field( $item['name'] ?? '' );
		if ( empty( $name ) ) {
			$skipped++;
			continue;
		}

		$domain = sanitize_text_field( $item['domain'] ?? '' );
		$source = sanitize_text_field( $item['source'] ?? 'cookie' );
		$key    = $name . '|' . $domain . '|' . $source;

		$pages_in = isset( $item['pages'] ) && is_array( $item['pages'] ) ? $item['pages'] : [];
		$pages    = array_values( array_filter( array_map( 'esc_url_raw', $pages_in ) ) );

		$record = [
			'name'          => $name,
			'domain'        => $domain,
			'source'        => $source,
			'category'      => sanitize_text_field( $item['category'] ?? 'Unknown' ),
			'platform'      => sanitize_text_field( $item['platform'] ?? '' ),
			'description'   => sanitize_text_field( $item['description'] ?? '' ),
			'retention'     => sanitize_text_field( $item['retention'] ?? '' ),
			'privacy_link'  => esc_url_raw( $item['privacy_link'] ?? '' ),
			'wp_scope'      => sanitize_text_field( $item['wp_scope'] ?? cookie4_classify_wp_cookie( $name ) ),
			'auto'          => ! empty( $item['auto'] ),
			'first_seen'    => sanitize_text_field( $item['first_seen'] ?? current_time( 'mysql' ) ),
			'last_seen'     => sanitize_text_field( $item['last_seen'] ?? current_time( 'mysql' ) ),
			'pages'         => $pages,
			'value_preview' => mb_substr( sanitize_text_field( $item['value_preview'] ?? '' ), 0, 50 ),
		];

		if ( isset( $cookies[ $key ] ) ) {
			$existing = $cookies[ $key ];
			$record['first_seen'] = $existing['first_seen'] ?? $record['first_seen'];
			$record['pages']      = array_values( array_unique( array_merge( $existing['pages'] ?? [], $record['pages'] ) ) );
			$cookies[ $key ]      = $record;
			$updated++;
		} else {
			$cookies[ $key ] = $record;
			$added++;
		}
	}

	update_option( 'cookie4_scanned_cookies', $cookies, false );

	return new WP_REST_Response( [
		'added'   => $added,
		'updated' => $updated,
		'skipped' => $skipped,
		'total'   => count( $cookies ),
	] );
}

/* ───────────────────────────────────────────────
 * 2b. Tracker endpoints
 * ─────────────────────────────────────────────── */

function cookie4_scanner_receive_trackers( WP_REST_Request $request ): WP_REST_Response {
	$items    = $request->get_json_params();
	$trackers = get_option( 'cookie4_detected_trackers', [] );

	if ( ! is_array( $items ) ) {
		return new WP_REST_Response( [ 'error' => 'Invalid payload' ], 400 );
	}

	foreach ( $items as $item ) {
		$tracker_id   = sanitize_text_field( $item['tracker_id'] ?? '' );
		$name         = sanitize_text_field( $item['name'] ?? '' );
		$category     = sanitize_text_field( $item['category'] ?? '' );
		$description  = sanitize_text_field( $item['description'] ?? '' );
		$privacy_link = esc_url_raw( $item['privacy_link'] ?? '' );
		$detected_via = sanitize_text_field( $item['detected_via'] ?? '' );
		$detected_url = sanitize_text_field( $item['detected_url'] ?? '' );
		$page         = esc_url_raw( $item['page'] ?? '' );

		if ( empty( $tracker_id ) ) {
			continue;
		}

		if ( isset( $trackers[ $tracker_id ] ) ) {
			// Update: add page, update last_seen.
			$trackers[ $tracker_id ]['last_seen'] = current_time( 'mysql' );
			if ( $page && ! in_array( $page, $trackers[ $tracker_id ]['pages'], true ) ) {
				$trackers[ $tracker_id ]['pages'][] = $page;
			}
			if ( $detected_url && ! in_array( $detected_url, $trackers[ $tracker_id ]['detected_urls'], true ) ) {
				$trackers[ $tracker_id ]['detected_urls'][] = $detected_url;
			}
		} else {
			$trackers[ $tracker_id ] = [
				'tracker_id'    => $tracker_id,
				'name'          => $name,
				'category'      => $category,
				'description'   => $description,
				'privacy_link'  => $privacy_link,
				'detected_via'  => $detected_via,
				'detected_urls' => $detected_url ? [ $detected_url ] : [],
				'pages'         => $page ? [ $page ] : [],
				'first_seen'    => current_time( 'mysql' ),
				'last_seen'     => current_time( 'mysql' ),
				'audit_status'  => '',  // '', 'ok', 'violation'
			];
		}
	}

	update_option( 'cookie4_detected_trackers', $trackers, false );
	return new WP_REST_Response( [ 'stored' => count( $trackers ), 'new' => count( $items ) ] );
}

function cookie4_scanner_get_trackers(): WP_REST_Response {
	return new WP_REST_Response( [
		'trackers' => array_values( get_option( 'cookie4_detected_trackers', [] ) ),
	] );
}

function cookie4_scanner_clear_trackers(): WP_REST_Response {
	update_option( 'cookie4_detected_trackers', [], false );
	delete_option( 'cookie4_audit_baseline' );
	delete_option( 'cookie4_audit_detections' );
	delete_option( 'cookie4_audit_mode' );
	return new WP_REST_Response( [ 'cleared' => true ] );
}

function cookie4_scanner_toggle_audit( WP_REST_Request $request ): WP_REST_Response {
	$active = $request->get_param( 'active' );
	update_option( 'cookie4_audit_mode', $active ? '1' : '', false );

	if ( $active ) {
		// Clear previous audit results — fresh audit run.
		$trackers = get_option( 'cookie4_detected_trackers', [] );
		foreach ( $trackers as &$t ) {
			$t['audit_status'] = '';
		}
		unset( $t );
		update_option( 'cookie4_detected_trackers', $trackers, false );

		// Store which trackers were known BEFORE audit.
		update_option( 'cookie4_audit_baseline', array_keys( $trackers ), false );
	} else {
		// Audit stopped — mark trackers detected during audit as violations.
		$baseline         = get_option( 'cookie4_audit_baseline', [] );
		$trackers         = get_option( 'cookie4_detected_trackers', [] );
		$audit_detections = get_option( 'cookie4_audit_detections', [] );

		foreach ( $trackers as $id => &$t ) {
			if ( in_array( $id, $audit_detections, true ) ) {
				$t['audit_status'] = 'violation';
			} elseif ( in_array( $id, $baseline, true ) ) {
				// Was known before audit but NOT detected during deny-all → respects consent.
				$t['audit_status'] = 'ok';
			}
		}
		unset( $t );

		update_option( 'cookie4_detected_trackers', $trackers, false );
		delete_option( 'cookie4_audit_baseline' );
		delete_option( 'cookie4_audit_detections' );
	}

	return new WP_REST_Response( [ 'active' => (bool) $active ] );
}

function cookie4_scanner_record_audit_detections( WP_REST_Request $request ): WP_REST_Response {
	$ids       = $request->get_param( 'ids' );
	$existing  = get_option( 'cookie4_audit_detections', [] );

	if ( ! is_array( $ids ) ) {
		return new WP_REST_Response( [ 'error' => 'Invalid payload' ], 400 );
	}

	foreach ( $ids as $id ) {
		$id = sanitize_text_field( $id );
		if ( $id && ! in_array( $id, $existing, true ) ) {
			$existing[] = $id;
		}
	}

	update_option( 'cookie4_audit_detections', $existing, false );
	return new WP_REST_Response( [ 'recorded' => count( $existing ) ] );
}

/* ───────────────────────────────────────────────
 * 3. Cookie Database lookup
 * ─────────────────────────────────────────────── */

function cookie4_get_cookie_database(): array {
	static $db = null;
	if ( $db !== null ) {
		return $db;
	}

	$file = COOKIE4_PLUGIN_DIR . 'includes/cookie-database.json';
	if ( ! file_exists( $file ) ) {
		$db = [];
		return $db;
	}

	$raw = json_decode( file_get_contents( $file ), true );
	if ( ! is_array( $raw ) ) {
		$db = [];
		return $db;
	}

	// Flatten: platform => entries into a flat lookup.
	$db = [];
	foreach ( $raw as $platform => $entries ) {
		foreach ( $entries as $entry ) {
			$entry['platform'] = $platform;
			$db[] = $entry;
		}
	}

	return $db;
}

function cookie4_match_cookie_in_db( string $name, array $db ): ?array {
	// Exact match first.
	foreach ( $db as $entry ) {
		if ( ( $entry['wildcardMatch'] ?? '0' ) === '0' && $entry['cookie'] === $name ) {
			return $entry;
		}
	}

	// Wildcard match: cookie name is a prefix pattern.
	foreach ( $db as $entry ) {
		if ( ( $entry['wildcardMatch'] ?? '0' ) === '1' ) {
			$pattern = $entry['cookie'];
			if ( str_starts_with( $name, $pattern ) ) {
				return $entry;
			}
		}
	}

	return null;
}

/**
 * Load tracker database (tracker-database.json).
 */
function cookie4_get_tracker_database(): array {
	static $db = null;
	if ( $db !== null ) {
		return $db;
	}

	$file = COOKIE4_PLUGIN_DIR . 'includes/tracker-database.json';
	if ( ! file_exists( $file ) ) {
		$db = [];
		return $db;
	}

	$raw = json_decode( file_get_contents( $file ), true );
	$db  = is_array( $raw ) ? $raw : [];
	return $db;
}

/* ───────────────────────────────────────────────
 * 4. Frontend scanner script injection
 * ─────────────────────────────────────────────── */

add_action( 'wp_footer', 'cookie4_maybe_inject_scanner', 9999 );

function cookie4_maybe_inject_scanner(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// Load scanner when:
	// 1. Persistent scan mode is active (works across all tabs), OR
	// 2. URL has ?cookie_scan=1 (legacy / one-off).
	$scan_active = get_option( 'cookie4_scan_active', '' ) === '1';
	$url_trigger = isset( $_GET['cookie_scan'] ) && $_GET['cookie_scan'] === '1';

	if ( ! $scan_active && ! $url_trigger ) {
		return;
	}

	$js_file    = COOKIE4_PLUGIN_DIR . 'assets/cookie-scanner-frontend.js';
	$js_ver     = file_exists( $js_file ) ? filemtime( $js_file ) : COOKIE4_VERSION;
	$js_url     = COOKIE4_PLUGIN_URL . 'assets/cookie-scanner-frontend.js?ver=' . $js_ver;
	$audit_mode = get_option( 'cookie4_audit_mode', '' ) === '1';
	$tracker_db = cookie4_get_tracker_database();
	?>
	<script>
	window.__cookieScanConfig = {
		restUrl: <?php echo wp_json_encode( rest_url( 'cookie4/v1/scan' ) ); ?>,
		nonce: <?php echo wp_json_encode( wp_create_nonce( 'wp_rest' ) ); ?>,
		adminUrl: <?php echo wp_json_encode( admin_url( 'options-general.php?page=cookie-banner-wp#cookies-table' ) ); ?>,
		interval: 3000,
		trackerDb: <?php echo wp_json_encode( $tracker_db ); ?>,
		auditMode: <?php echo wp_json_encode( $audit_mode ); ?>
	};
	</script>
	<?php if ( $audit_mode ) : ?>
	<script>
	/* Audit mode: force deny-all consent before anything else loads. */
	(function() {
		window.dataLayer = window.dataLayer || [];
		window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
		window.gtag('consent', 'default', {
			ad_storage: 'denied',
			analytics_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			functionality_storage: 'denied',
			security_storage: 'denied',
			personalization_storage: 'denied',
			wait_for_update: 500
		});
		/* Prevent our own banner from overriding with stored consent. */
		window.__cookieAuditDenyAll = true;
	})();
	</script>
	<?php endif; ?>
	<script src="<?php echo esc_url( $js_url ); ?>"></script>
	<?php
}
