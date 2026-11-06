<?php
/** Consent-dependent network allowlist, enforced before any HTML is parsed. */
if (!defined('ABSPATH')) { exit; }

function cookie4_csp_enabled(): bool {
    return (bool) apply_filters('cookie4_strict_csp', true);
}

function cookie4_csp_grants(): array {
    $raw = $_COOKIE['cb_csp_consent'] ?? '[]';
    if (!is_string($raw) || strlen($raw) > 4096) { return []; }
    $ids = json_decode(wp_unslash($raw));
    if (!is_array($ids) || count($ids) > 100) { return []; }
    foreach ($ids as $id) {
        if (!is_string($id) || !preg_match('/^[a-z0-9_.-]{1,100}$/iD', $id)) { return []; }
    }
    return array_values(array_unique($ids));
}

function cookie4_csp_registry(): array {
    static $registry;
    if ($registry !== null) { return $registry; }
    $services = [];
    foreach (cookie4_get_tracker_database() as $tracker) {
        $origins = [];
        foreach (array_merge($tracker['scriptPatterns'] ?? [], $tracker['networkPatterns'] ?? [], $tracker['domains'] ?? []) as $pattern) {
            $host = wp_parse_url('https://' . $pattern, PHP_URL_HOST);
            if (is_string($host) && str_contains($host, '.') && preg_match('/^(?:\*\.)?[a-z0-9.-]+$/iD', $host)) {
                $origins[] = 'https://' . $host;
                if (str_starts_with($host, '*.')) { $origins[] = 'https://' . substr($host, 2); }
                else { $origins[] = 'https://*.' . $host; }
            }
        }
        $services[$tracker['id']] = array_fill_keys(['script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'frame-src', 'media-src'], array_unique($origins));
    }
    foreach (cookie4_build_config()['services'] ?? [] as $service) {
        $origins = [];
        foreach ($service['urls'] ?? [] as $url) {
            $parts = wp_parse_url($url);
            if (($parts['scheme'] ?? '') === 'https' && isset($parts['host'])) {
                $origins[] = 'https://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
            }
        }
        $services[$service['id']] = array_fill_keys(['script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'frame-src', 'media-src'], $origins);
    }
    return $registry = $services;
}

/** Replace only our own policy; preserve any independent site CSP headers. */
function cookie4_emit_csp(string $policy): void {
    static $previous;
    if ($previous !== null) {
        $others = [];
        $removed = false;
        foreach (headers_list() as $header) {
            if (stripos($header, 'Content-Security-Policy:') !== 0) { continue; }
            if (!$removed && $header === 'Content-Security-Policy: ' . $previous) { $removed = true; continue; }
            $others[] = $header;
        }
        header_remove('Content-Security-Policy');
        foreach ($others as $header) { header($header, false); }
    }
    header('Content-Security-Policy: ' . $policy, false);
    $previous = $policy;
}

function cookie4_csp_policy(array $embedded_services = []): string {
    $directives = [
        'default-src' => ["'none'"], 'base-uri' => ["'self'"],
        'object-src' => ["'none'"], 'form-action' => ["'self'"],
        'frame-ancestors' => ["'self'"],
        // Inline WordPress/Elementor bootstrap is allowed, external destinations are not.
        'script-src' => ["'self'", "'unsafe-inline'"],
        'style-src' => ["'self'", "'unsafe-inline'"],
        'img-src' => ["'self'", 'data:'], 'font-src' => ["'self'", 'data:'],
        'connect-src' => ["'self'"], 'frame-src' => ["'self'"],
        'media-src' => ["'self'"], 'worker-src' => ["'self'"],
    ];
    $rocket = get_option('wp_rocket_settings', []);
    $needs_eval = defined('WP_ROCKET_VERSION') && !empty($rocket['delay_js']);
    if (apply_filters('cookie4_csp_allow_eval', $needs_eval)) {
        $directives['script-src'][] = "'unsafe-eval'";
    }
    $needs_blob = class_exists('LiteSpeed\\Conf') && (int) \LiteSpeed\Conf::cls()->conf('optm-js_defer') === 2;
    if (apply_filters('cookie4_csp_allow_blob_scripts', $needs_blob)) {
        $directives['script-src'][] = 'blob:';
    }
    $services = cookie4_csp_registry();
    // Explicit developer overrides; a cookie can only select registered services.
    $services = apply_filters('cookie4_csp_services', array_merge($services, $embedded_services));
    $sources = [apply_filters('cookie4_csp_essential', [])];
    foreach (cookie4_csp_grants() as $id) { $sources[] = $services[$id] ?? []; }
    foreach ($sources as $group) {
        foreach ($group as $directive => $origins) {
            if (!in_array($directive, ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src', 'frame-src', 'media-src', 'worker-src'], true)) { continue; }
            foreach ($origins as $origin) {
                if (is_string($origin) && preg_match('~^https://(?:\*\.)?[a-z0-9.-]+(?::[0-9]+)?$~iD', $origin)) { $directives[$directive][] = $origin; }
            }
        }
    }
    return implode('; ', array_map(fn($key) => $key . ' ' . implode(' ', array_unique($directives[$key])), array_keys($directives)));
}

add_action('template_redirect', function () {
    if (!cookie4_csp_enabled() || is_admin() || is_feed() || is_robots() || is_trackback() || wp_doing_ajax()) { return; }
    if (!defined('DONOTCACHEPAGE')) {
        define('DONOTCACHEPAGE', true);
        // Rocket couples this flag to JS optimization. Its cache writes are
        // disabled separately below, so override only the flag we own.
        add_filter('rocket_override_donotcachepage', '__return_true');
    }
    // A denied/known-service fallback remains enforced even if another plugin
    // emits a non-HTML or precompressed response that cannot be rewritten.
    cookie4_emit_csp(cookie4_csp_policy());
    header('Cache-Control: private, no-store, max-age=0');
    header('Vary: Cookie', false);
    header('X-LiteSpeed-Cache-Control: no-cache');
    header('X-DNS-Prefetch-Control: off');
    // HTTP resource hints can run before the document's meta policy.
    header_remove('Link');
}, -10000);

// No HTML cache files are generated; existing files are purged on deployment.
// Unlike reject-URI rules this preserves Rocket's independent JS optimizations.
add_filter('do_rocket_generate_caching_files', fn($enabled) => cookie4_csp_enabled() ? false : $enabled);
// LiteSpeed reads DONOTCACHEPAGE when emitting its cache-control header;
// its internal cacheable flag stays intact until optimization has finished.

function cookie4_csp_refresh_cache(): void {
    if (function_exists('rocket_clean_domain')) { rocket_clean_domain(); }
    if (function_exists('rocket_generate_config_file')) { rocket_generate_config_file(); }
    if (function_exists('flush_rocket_htaccess')) { flush_rocket_htaccess(); }
    do_action('litespeed_purge_all');
}
// Once per deployed policy revision, plus every optimizer activation.
add_action('init', function () {
    $revision = COOKIE4_VERSION . ':strict-csp-1';
    if (get_option('cookie4_csp_revision') === $revision) { return; }
    cookie4_csp_refresh_cache();
    update_option('cookie4_csp_revision', $revision, false);
}, 99);
add_action('activated_plugin', 'cookie4_csp_refresh_cache');
add_action('deactivated_plugin', 'cookie4_csp_refresh_cache');
