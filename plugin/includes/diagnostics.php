<?php
/** Administrator diagnostics and native WordPress Site Health integration. */
if (!defined('ABSPATH')) { exit; }

function cookie4_diagnostics(): array {
    $active = get_option('active_plugins', []);
    if (is_multisite()) { $active = array_merge($active, array_keys(get_site_option('active_sitewide_plugins', []))); }
    $competitors = [];
    foreach ($active as $plugin) {
        $slug = explode('/', $plugin)[0];
        if (in_array($slug, ['complianz-gdpr', 'cookie-law-info', 'real-cookie-banner', 'cookie-notice', 'cookiebot', 'iubenda-cookie-law-solution', 'wpconsent-cookies-banner-privacy-suite', 'surecookie'], true)) { $competitors[] = $slug; }
    }
    $caches = [];
    if (function_exists('rocket_clean_domain')) { $caches[] = 'WP Rocket'; }
    if (class_exists(\LiteSpeed\Conf::class)) { $caches[] = 'LiteSpeed Cache'; }
    if (class_exists('Cache_Enabler')) { $caches[] = 'Cache Enabler'; }
    return [
        'version' => COOKIE4_VERSION,
        'wordpress' => get_bloginfo('version'),
        'php' => PHP_VERSION,
        'theme' => wp_get_theme()->get('Name'),
        'strictCsp' => cookie4_csp_enabled(),
        'disclosureReady' => cookie4_disclosure_ready(cookie4_build_config()),
        'parser' => class_exists('WP_HTML_Tag_Processor'),
        'autoBlock' => cookie4_build_config()['autoBlock'] ?? false,
        'customServices' => count(get_option('cookie4_services', [])),
        'cachePlugins' => $caches,
        'otherConsentPlugins' => array_values(array_unique($competitors)),
        'auditActive' => get_option('cookie4_audit_mode', '') === '1',
    ];
}

add_action('rest_api_init', function () {
    register_rest_route('cookie4/v1', '/diagnostics', [
        'methods' => 'GET', 'permission_callback' => fn() => current_user_can('manage_options'),
        'callback' => fn() => rest_ensure_response(cookie4_diagnostics()),
    ]);
    register_rest_route('cookie4/v1', '/maintenance/purge-cache', [
        'methods' => 'POST', 'permission_callback' => fn() => current_user_can('manage_options'),
        'callback' => function () {
            cookie4_csp_refresh_cache();
            return rest_ensure_response(['purged' => cookie4_diagnostics()['cachePlugins'], 'upstreamCacheVerified' => false]);
        },
    ]);
});

add_filter('site_status_tests', function ($tests) {
    $tests['direct']['cookie4_blocking'] = ['label' => __('Cookie Banner blocking configuration', 'cookie-banner-wp'), 'test' => 'cookie4_site_health'];
    return $tests;
});

function cookie4_site_health(): array {
    $data = cookie4_diagnostics();
    $ready = $data['disclosureReady'] && $data['strictCsp'] && $data['parser'] && !$data['otherConsentPlugins'];
    return [
        'label' => $ready ? __('Cookie Banner blocking is configured', 'cookie-banner-wp') : __('Review Cookie Banner blocking settings', 'cookie-banner-wp'),
        'status' => $ready ? 'good' : 'recommended',
        'badge' => ['label' => 'Cookie Banner', 'color' => 'blue'],
        'description' => '<p>' . esc_html__('This checks the local CSP setting, HTML parser and known competing consent plugins. Verify the frontend response and any CDN cache separately in Cookie Banner diagnostics.', 'cookie-banner-wp') . '</p>',
        'actions' => '<p><a href="' . esc_url(admin_url('options-general.php?page=cookie-banner-wp#diagnostics')) . '">' . esc_html__('Open diagnostics', 'cookie-banner-wp') . '</a></p>',
        'test' => 'cookie4_blocking',
    ];
}

add_filter('debug_information', function ($info) {
    $data = cookie4_diagnostics();
    $info['cookie4'] = ['label' => 'Cookie Banner', 'fields' => [
        'version' => ['label' => 'Version', 'value' => $data['version']],
        'strict_csp' => ['label' => 'Strict CSP configured', 'value' => $data['strictCsp'] ? 'yes' : 'no'],
        'custom_services' => ['label' => 'Custom services', 'value' => $data['customServices']],
        'cache_plugins' => ['label' => 'Detected caches', 'value' => implode(', ', $data['cachePlugins']) ?: 'none'],
        'other_cmp' => ['label' => 'Other consent plugins', 'value' => implode(', ', $data['otherConsentPlugins']) ?: 'none'],
    ]];
    return $info;
});
