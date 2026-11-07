<?php
/** Minimal consent evidence: no IP address, user agent or persistent visitor ID. */
if (!defined('ABSPATH')) { exit; }

function cookie4_disclosure_ready(array $config): bool {
    return !empty(trim($config['controller']['name'] ?? '')) && !empty(trim($config['purposes'] ?? '')) &&
        !empty($config['noticeVersion']) && !empty($config['privacyPolicyUrl']) &&
        in_array(wp_parse_url($config['privacyPolicyUrl'], PHP_URL_SCHEME), ['http', 'https'], true);
}

function cookie4_service_disclosed(string $id, array $config): bool {
    $disclosures = (array) ($config['serviceDisclosures'] ?? []);
    $service = $disclosures[$id] ?? null;
    if (!$service) { foreach ($config['services'] ?? [] as $item) { if (($item['id'] ?? '') === $id) { $service = $item; break; } } }
    return is_array($service) && !empty(trim($service['description'] ?? '')) && !empty(trim($service['retention'] ?? '')) &&
        !empty($service['privacyUrl']) && in_array(wp_parse_url($service['privacyUrl'], PHP_URL_SCHEME), ['http', 'https'], true);
}

/** One immutable record per choice; bounded retention and paginated administrator export. */
function cookie4_receipts_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'cookie4_receipts';
}

function cookie4_install_receipts(): void {
    global $wpdb;
    if (get_option('cookie4_receipts_schema') === '2') { return; }
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = cookie4_receipts_table();
    dbDelta("CREATE TABLE $table (
        id varchar(36) NOT NULL,
        recorded_at datetime NOT NULL,
        notice_version varchar(64) NOT NULL,
        receipt longtext NOT NULL,
        PRIMARY KEY  (id),
        KEY recorded_at (recorded_at)
    ) ENGINE=InnoDB " . $wpdb->get_charset_collate() . ';');
    $budget = $table . '_budget';
    dbDelta("CREATE TABLE $budget (
        name varchar(32) NOT NULL,
        window_id bigint NOT NULL DEFAULT 0,
        used bigint NOT NULL DEFAULT 0,
        PRIMARY KEY  (name)
    ) ENGINE=InnoDB " . $wpdb->get_charset_collate() . ';');
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table &&
        $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($budget))) === $budget) {
        if (!defined('DB_ENGINE') || DB_ENGINE !== 'sqlite') {
            foreach ([$table, $budget] as $transactional) {
                $status = $wpdb->get_row($wpdb->prepare('SHOW TABLE STATUS LIKE %s', $wpdb->esc_like($transactional)));
                if (!$status || strcasecmp($status->Engine ?? '', 'InnoDB') !== 0) {
                    if ($wpdb->query("ALTER TABLE $transactional ENGINE=InnoDB") === false) { return; }
                }
            }
        }
        if ($wpdb->query("INSERT IGNORE INTO $budget (name, window_id, used) SELECT 'capacity', 0, COUNT(*) FROM $table") === false) { return; }
        update_option('cookie4_receipts_schema', '2', false);
    }
}
add_action('admin_init', 'cookie4_install_receipts');

/** Fixed-cardinality counters; conditional SQL increments are atomic across workers. */
function cookie4_receipt_reserve(string $name, int $window, int $limit): bool {
    global $wpdb;
    $budget = cookie4_receipts_table() . '_budget';
    if ($name !== 'capacity' && $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $budget (name, window_id, used) VALUES (%s, %d, 0)", $name, $window)) === false) { return false; }
    return $wpdb->query($wpdb->prepare(
        "UPDATE $budget SET used = CASE WHEN window_id = %d THEN used + 1 ELSE 1 END, window_id = %d WHERE name = %s AND (window_id < %d OR (window_id = %d AND used < %d))",
        $window, $window, $name, $window, $window, $limit
    )) === 1;
}

function cookie4_receipt_release_capacity(int $count = 1): bool {
    global $wpdb;
    if ($count <= 0) { return true; }
    $budget = cookie4_receipts_table() . '_budget';
    return $wpdb->query($wpdb->prepare("UPDATE $budget SET used = CASE WHEN used >= %d THEN used - %d ELSE 0 END WHERE name = 'capacity'", $count, $count)) !== false;
}

function cookie4_record_consent(WP_REST_Request $request) {
    global $wpdb;
    // REST requests may not carry the translated page URL. Bind evidence to that page's language.
    $language = $request->get_param('cookie4_lang');
    $request_language = fn() => $language;
    add_filter('cookie4_request_language', $request_language);
    try { $config = cookie4_build_config(); }
    finally { remove_filter('cookie4_request_language', $request_language); }
    if (strlen($request->get_body()) > 16000) { return new WP_Error('cookie4_receipt_size', 'Receipt too large.', ['status' => 413]); }
    $data = $request->get_json_params();
    if (!is_array($data) || !is_string($data['id'] ?? null) || !preg_match('/^[0-9a-f-]{36}$/iD', $data['id']) ||
        ($data['version'] ?? null) !== $config['noticeVersion']) { return new WP_Error('cookie4_receipt_version', 'Invalid or outdated receipt.', ['status' => 400]); }
    $categories = $data['categories'] ?? [];
    if (!is_array($categories) || count($categories) !== 3 || array_diff(array_keys($categories), ['essential', 'analytics', 'marketing']) || ($categories['essential'] ?? null) !== true) {
        return new WP_Error('cookie4_receipt_categories', 'Invalid categories.', ['status' => 400]);
    }
    foreach (['essential', 'analytics', 'marketing'] as $category) {
        if (!is_bool($categories[$category] ?? null)) { return new WP_Error('cookie4_receipt_categories', 'Invalid categories.', ['status' => 400]); }
    }
    $services = $data['services'] ?? [];
    if (!is_array($services) || count($services) > 100) { return new WP_Error('cookie4_receipt_services', 'Invalid services.', ['status' => 400]); }
    $optional = $categories['analytics'] || $categories['marketing'];
    foreach ($services as $id => $granted) {
        if (!is_string($id) || !preg_match('/^[a-z0-9_.-]{1,100}$/iD', $id) || !is_bool($granted) || ($granted && !cookie4_service_disclosed($id, $config))) { return new WP_Error('cookie4_receipt_service', 'Invalid or undisclosed service.', ['status' => 400]); }
        $optional = $optional || $granted;
    }
    if ($optional && !cookie4_disclosure_ready($config)) { return new WP_Error('cookie4_receipt_notice', 'Privacy information is incomplete.', ['status' => 400]); }
    cookie4_install_receipts();
    $table = cookie4_receipts_table();
    // Collisions only share a stricter quota. At most 256 address buckets exist,
    // regardless of source count; addresses themselves never enter evidence.
    $bucket = hexdec(substr(hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'local', wp_salt('nonce')), 0, 2));
    $minute = (int) floor(time() / MINUTE_IN_SECONDS);
    if (!cookie4_receipt_reserve('minute', $minute, 600) || !cookie4_receipt_reserve('ip_' . $bucket, $minute, 120)) {
        return new WP_Error('cookie4_receipt_rate', 'Too many receipt requests.', ['status' => 429]);
    }
    if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id = %s", $data['id']))) { return rest_ensure_response(['id' => $data['id'], 'retained' => true]); }
    $notice = array_intersect_key($config, array_flip(['controller', 'purposes', 'privacyPolicyUrl', 'cookiePolicyUrl', 'noticeVersion', 'lang', 'customTexts', 'services', 'serviceDisclosures']));
    $receipt = ['id' => $data['id'], 'version' => $config['noticeVersion'], 'categories' => $categories, 'services' => (object) $services, 'notice' => $notice, 'runtimeVersion' => COOKIE4_VERSION, 'runtimeHash' => is_file(COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js') ? hash_file('sha256', COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js') : ''];
    $encoded = wp_json_encode($receipt);
    if (!is_string($encoded) || strlen($encoded) > 16384) { return new WP_Error('cookie4_receipt_size', 'Retained receipt too large.', ['status' => 413]); }
    $limit = max(1, min(100000, (int) apply_filters('cookie4_receipt_max_records', 10000)));
    $result = cookie4_insert_receipt($receipt, $encoded, $limit);
    if (is_wp_error($result) && $result->get_error_code() === 'cookie4_receipt_capacity') {
        cookie4_expire_receipts();
        $result = cookie4_insert_receipt($receipt, $encoded, $limit);
    }
    if (is_wp_error($result)) { return $result; }
    if ($result === 1) { do_action('cookie4_consent_recorded', $receipt); }
    return rest_ensure_response(['id' => $data['id'], 'retained' => true]);
}

/** Reserve storage and insert evidence in one transaction; worker death rolls both back. */
function cookie4_insert_receipt(array $receipt, string $encoded, int $limit) {
    global $wpdb;
    $table = cookie4_receipts_table();
    $error = new WP_Error('cookie4_receipt_storage', 'Receipt could not be retained.', ['status' => 503]);
    if (get_option('cookie4_receipts_schema') !== '2' || $wpdb->query('START TRANSACTION') === false) { return $error; }
    if (!cookie4_receipt_reserve('capacity', 0, $limit)) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('cookie4_receipt_capacity', 'Receipt storage limit reached.', ['status' => 503]);
    }
    $result = $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $table (id, recorded_at, notice_version, receipt) VALUES (%s, %s, %s, %s)", $receipt['id'], current_time('mysql', true), $receipt['version'], $encoded));
    if ($result !== 1) {
        $wpdb->query('ROLLBACK');
        return $result === 0 ? 0 : $error;
    }
    if ($wpdb->query('COMMIT') === false) { $wpdb->query('ROLLBACK'); return $error; }
    return 1;
}

add_action('rest_api_init', function () {
    register_rest_route('cookie4/v1', '/consent-receipts', [
        ['methods' => 'POST', 'permission_callback' => fn(WP_REST_Request $request) => (bool) wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest'), 'callback' => 'cookie4_record_consent'],
        ['methods' => 'GET', 'permission_callback' => fn() => current_user_can('manage_options'), 'callback' => function (WP_REST_Request $request) {
            global $wpdb;
            cookie4_install_receipts();
            $table = cookie4_receipts_table();
            $offset = max(0, (int) $request->get_param('offset'));
            $rows = $wpdb->get_results($wpdb->prepare("SELECT id, recorded_at, receipt FROM $table ORDER BY recorded_at DESC, id DESC LIMIT 100 OFFSET %d", $offset), ARRAY_A);
            $response = rest_ensure_response(['receipts' => array_map(fn($row) => ['id' => $row['id'], 'recordedAt' => $row['recorded_at'], 'receipt' => json_decode($row['receipt'], true)], $rows), 'nextOffset' => count($rows) === 100 ? $offset + 100 : null]);
            $response->header('Cache-Control', 'private, no-store');
            return $response;
        }],
    ]);
});

function cookie4_expire_receipts(): void {
    global $wpdb;
    if (get_option('cookie4_receipts_schema') !== '2') { return; }
    $table = cookie4_receipts_table();
    $days = max(1, min(365, (int) apply_filters('cookie4_receipt_retention_days', 180)));
    if ($wpdb->query('START TRANSACTION') === false) { return; }
    $budget = $table . '_budget';
    // Match the insert lock order before deleting evidence.
    if ($wpdb->query("UPDATE $budget SET used = used WHERE name = 'capacity'") === false) { $wpdb->query('ROLLBACK'); return; }
    $deleted = $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE recorded_at < %s", gmdate('Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS)));
    if (!is_int($deleted)) { $wpdb->query('ROLLBACK'); return; }
    if (!cookie4_receipt_release_capacity($deleted)) { $wpdb->query('ROLLBACK'); return; }
    if ($wpdb->query('COMMIT') === false) { $wpdb->query('ROLLBACK'); }
}
add_action('cookie4_expire_receipts', 'cookie4_expire_receipts');
add_action('init', function () {
    if (!wp_next_scheduled('cookie4_expire_receipts')) { wp_schedule_event(time() + DAY_IN_SECONDS, 'daily', 'cookie4_expire_receipts'); }
});
