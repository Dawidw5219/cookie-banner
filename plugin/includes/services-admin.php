<?php
/** Manage custom services using the same registry as the scanner and blocker. */
if (!defined('ABSPATH')) { exit; }

function cookie4_validate_services($items) {
    if (!is_array($items) || count($items) > 50 || ($items !== [] && array_keys($items) !== range(0, count($items) - 1))) {
        return new WP_Error('cookie4_services_invalid', 'Provide a list of at most 50 services.', ['status' => 400]);
    }
    $services = [];
    $ids = [];
    $reserved = array_column(array_filter(cookie4_get_tracker_database(), fn($tracker) => empty($tracker['custom'])), 'id');
    foreach ($items as $item) {
        if (!is_array($item) || !is_string($item['id'] ?? null) || !preg_match('/^[a-z][a-z0-9_-]{1,79}$/D', $item['id'])) {
            return new WP_Error('cookie4_service_id', 'Use a unique service ID containing lowercase letters, numbers and hyphens (2–80 characters).', ['status' => 400]);
        }
        $id = $item['id'];
        if (isset($ids[$id]) || in_array($id, $reserved, true) || str_starts_with($id, 'external-')) {
            return new WP_Error('cookie4_service_duplicate', 'Service IDs must be unique and must not override the built-in registry.', ['status' => 400]);
        }
        foreach (['name', 'description', 'privacyUrl', 'retention'] as $field) {
            if (isset($item[$field]) && !is_string($item[$field])) {
                return new WP_Error('cookie4_service_field', 'Service fields must be text.', ['status' => 400]);
            }
        }
        $name = sanitize_text_field($item['name'] ?? '');
        $description = sanitize_textarea_field($item['description'] ?? '');
        $urls = $item['urls'] ?? [];
        if ($name === '' || strlen($name) > 120 || $description === '' || strlen($description) > 2000 || !is_array($urls) || count($urls) < 1 || count($urls) > 20) {
            return new WP_Error('cookie4_service_required', 'Each service needs a name, purpose and 1–20 HTTPS URL prefixes.', ['status' => 400]);
        }
        $clean_urls = [];
        foreach ($urls as $url) {
            $parts = is_string($url) && strlen($url) <= 2048 ? wp_parse_url($url) : false;
            if (!$parts || !filter_var($url, FILTER_VALIDATE_URL) || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host']) || !preg_match('/^[a-z0-9.-]+$/iD', $parts['host']) || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
                return new WP_Error('cookie4_service_url', 'Use complete HTTPS URL prefixes without credentials, wildcards, query strings or fragments.', ['status' => 400]);
            }
            $clean_urls[] = 'https://' . strtolower($parts['host']) . (isset($parts['port']) ? ':' . $parts['port'] : '') . ($parts['path'] ?? '/');
        }
        $privacy = $item['privacyUrl'] ?? '';
        if ($privacy !== '' && (strlen($privacy) > 2048 || !filter_var($privacy, FILTER_VALIDATE_URL) || wp_parse_url($privacy, PHP_URL_SCHEME) !== 'https')) {
            return new WP_Error('cookie4_service_privacy', 'The privacy policy must be a valid public HTTPS URL.', ['status' => 400]);
        }
        $services[] = ['id' => $id, 'name' => $name, 'description' => $description, 'privacyUrl' => esc_url_raw($privacy), 'retention' => sanitize_text_field($item['retention'] ?? ''), 'urls' => array_values(array_unique($clean_urls))];
        $ids[$id] = true;
    }
    return $services;
}

add_action('rest_api_init', function () {
    register_rest_route('cookie4/v1', '/services', [
        ['methods' => 'GET', 'permission_callback' => fn() => current_user_can('manage_options'), 'callback' => fn() => rest_ensure_response(['services' => get_option('cookie4_services', [])])],
        ['methods' => 'PUT', 'permission_callback' => fn() => current_user_can('manage_options'), 'callback' => function (WP_REST_Request $request) {
            $payload = $request->get_json_params();
            $services = cookie4_validate_services(is_array($payload) ? ($payload['services'] ?? null) : null);
            if (is_wp_error($services)) { return $services; }
            $before = get_option('cookie4_services', []);
            // Retired services must not keep silently inheriting an earlier consent.
            $history = get_option('cookie4_service_history', []);
            foreach ($before as $service) { $history[$service['id']] = hash('sha256', wp_json_encode($service)); }
            foreach ($services as $service) {
                $fingerprint = hash('sha256', wp_json_encode($service));
                if (isset($history[$service['id']]) && $history[$service['id']] !== $fingerprint) {
                    return new WP_Error('cookie4_service_immutable', 'Use a new service ID when changing an integration. Existing consent belongs to its previous purpose and destinations.', ['status' => 400]);
                }
                $history[$service['id']] = $fingerprint;
            }
            update_option('cookie4_service_history', $history, false);
            update_option('cookie4_services', $services, false);
            if ($before !== $services) { cookie4_csp_refresh_cache(); }
            return rest_ensure_response(['services' => $services]);
        }],
    ]);
});

/** Reviewed disclosures share tracker IDs with the scanner; no second URL registry. */
function cookie4_disclosure_catalog(): array {
    $catalog = [];
    $observed = get_option('cookie4_detected_trackers', []);
    $reviewed = get_option('cookie4_service_disclosures', []);
    foreach (cookie4_get_tracker_database() as $name => $tracker) {
        $id = $tracker['id'];
        if (!isset($observed[$id]) && !isset($reviewed[$id])) { continue; }
        $retentions = [];
        foreach (get_option('cookie4_scanned_cookies', []) as $cookie) {
            if (($cookie['platform'] ?? '') === $name && !empty($cookie['retention'])) { $retentions[] = $cookie['retention']; }
        }
        $catalog[] = ['id' => $id, 'name' => $name, 'description' => $tracker['description'] ?? '',
            'privacyUrl' => $tracker['privacyLink'] ?? '', 'retention' => implode('; ', array_unique($retentions))];
    }
    return $catalog;
}

add_action('rest_api_init', function () {
    register_rest_route('cookie4/v1', '/disclosures', [
        ['methods' => 'GET', 'permission_callback' => fn() => current_user_can('manage_options'),
            'callback' => fn() => rest_ensure_response(['catalog' => cookie4_disclosure_catalog(), 'disclosures' => (object) get_option('cookie4_service_disclosures', [])])],
        ['methods' => 'PUT', 'permission_callback' => fn() => current_user_can('manage_options'), 'callback' => function (WP_REST_Request $request) {
            $items = $request->get_param('disclosures');
            if (!is_array($items) || count($items) > 100) { return new WP_Error('cookie4_disclosures', 'Provide at most 100 provider disclosures.', ['status' => 400]); }
            $clean = [];
            foreach ($items as $id => $item) {
                if (!is_string($id) || !preg_match('/^[a-z0-9_.-]{1,100}$/iD', $id) || !is_array($item)) { return new WP_Error('cookie4_disclosure', 'Invalid provider disclosure.', ['status' => 400]); }
                foreach (['description', 'privacyUrl', 'retention'] as $key) {
                    if (!is_string($item[$key] ?? null) || trim($item[$key]) === '' || strlen($item[$key]) > 2000) { return new WP_Error('cookie4_disclosure_required', 'Each disclosure needs a purpose, privacy URL and retention period or criteria.', ['status' => 400]); }
                }
                if (!filter_var($item['privacyUrl'], FILTER_VALIDATE_URL) || wp_parse_url($item['privacyUrl'], PHP_URL_SCHEME) !== 'https') { return new WP_Error('cookie4_disclosure_url', 'Use an HTTPS privacy policy URL.', ['status' => 400]); }
                $clean[$id] = ['description' => sanitize_textarea_field($item['description']), 'privacyUrl' => esc_url_raw($item['privacyUrl']), 'retention' => sanitize_text_field($item['retention'])];
            }
            update_option('cookie4_service_disclosures', $clean, false);
            cookie4_csp_refresh_cache();
            return rest_ensure_response(['disclosures' => (object) $clean]);
        }],
    ]);
});
