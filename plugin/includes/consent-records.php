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
    if (get_option('cookie4_receipts_schema') === '1') { return; }
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = cookie4_receipts_table();
    dbDelta("CREATE TABLE $table (
        id varchar(36) NOT NULL,
        recorded_at datetime NOT NULL,
        notice_version varchar(64) NOT NULL,
        receipt longtext NOT NULL,
        PRIMARY KEY  (id),
        KEY recorded_at (recorded_at)
    ) " . $wpdb->get_charset_collate() . ';');
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) === $table) { update_option('cookie4_receipts_schema', '1', false); }
}
add_action('admin_init', 'cookie4_install_receipts');

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
    // Short-lived abuse counter, separate from evidence; never store the raw address.
    $rate_key = 'cookie4_receipt_rate_' . hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'local', wp_salt('nonce'));
    $attempts = (int) get_transient($rate_key);
    if ($attempts >= 120) { return new WP_Error('cookie4_receipt_rate', 'Too many receipt requests.', ['status' => 429]); }
    set_transient($rate_key, $attempts + 1, MINUTE_IN_SECONDS);
    cookie4_install_receipts();
    $table = cookie4_receipts_table();
    $notice = array_intersect_key($config, array_flip(['controller', 'purposes', 'privacyPolicyUrl', 'cookiePolicyUrl', 'noticeVersion', 'lang', 'customTexts', 'services', 'serviceDisclosures']));
    $receipt = ['id' => $data['id'], 'version' => $config['noticeVersion'], 'categories' => $categories, 'services' => (object) $services, 'notice' => $notice, 'runtimeVersion' => COOKIE4_VERSION, 'runtimeHash' => is_file(COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js') ? hash_file('sha256', COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js') : ''];
    $result = $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $table (id, recorded_at, notice_version, receipt) VALUES (%s, %s, %s, %s)", $data['id'], current_time('mysql', true), $config['noticeVersion'], wp_json_encode($receipt)));
    if ($result === false) { return new WP_Error('cookie4_receipt_storage', 'Receipt could not be retained.', ['status' => 503]); }
    // Retention applies to evidence too. The administrator can shorten it for their policy.
    cookie4_expire_receipts();
    if ($result === 1) { do_action('cookie4_consent_recorded', $receipt); }
    return rest_ensure_response(['id' => $data['id'], 'retained' => true]);
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
    if (get_option('cookie4_receipts_schema') !== '1') { return; }
    $table = cookie4_receipts_table();
    $days = max(1, min(365, (int) apply_filters('cookie4_receipt_retention_days', 180)));
    $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE recorded_at < %s", gmdate('Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS)));
}
add_action('cookie4_expire_receipts', 'cookie4_expire_receipts');
add_action('init', function () {
    if (!wp_next_scheduled('cookie4_expire_receipts')) { wp_schedule_event(time() + DAY_IN_SECONDS, 'daily', 'cookie4_expire_receipts'); }
});
