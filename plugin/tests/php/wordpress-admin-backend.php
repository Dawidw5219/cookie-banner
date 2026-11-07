<?php
// Run only against an isolated local WordPress fixture.
if (empty($argv[1])) { fwrite(STDERR, "Usage: php plugin/tests/php/wordpress-admin-backend.php /path/to/wordpress\n"); exit(1); }
$_SERVER['HTTP_HOST'] = '127.0.0.1:9403';
$_SERVER['SERVER_NAME'] = '127.0.0.1';
$_SERVER['SERVER_PORT'] = '9403';
$_SERVER['REQUEST_URI'] = '/';
require rtrim($argv[1], '/') . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') { throw new Exception('Use an isolated localhost fixture'); }
function check($ok, $message) {
    if (!$ok) { throw new Exception($message); }
    echo "PASS $message\n";
}
$service = ['id' => 'qa-backend-service', 'name' => 'Local test integration', 'description' => 'External appointment booking', 'privacyUrl' => 'https://example.com/privacy', 'retention' => 'Session', 'urls' => ['https://api.example.com/embed/']];
$original = get_option('cookie4_services', []);
$cookies = $_COOKIE;
try {
    update_option('cookie4_services', array_merge($original, [$service]), false);
    check(!is_wp_error(cookie4_validate_services([$service])), 'valid custom service accepted');
    foreach ([
        'null list' => null,
        'arbitrary string' => ['bad'],
        'duplicate IDs' => [$service, $service],
        'built-in ID collision' => [array_merge($service, ['id' => 'youtube'])],
        'HTTP origin' => [array_merge($service, ['urls' => ['http://example.com/']])],
        'credentials in URL' => [array_merge($service, ['urls' => ['https://user:password@example.com/']])],
        'wildcard URL' => [array_merge($service, ['urls' => ['https://*.example.com/']])],
        'directive injection' => [array_merge($service, ['urls' => ['https://example.com/;script-src *']])],
        'non-string field' => [array_merge($service, ['name' => []])],
    ] as $name => $bad) {
        check(is_wp_error(cookie4_validate_services($bad)), 'reject ' . $name);
    }
    $registered = array_values(array_filter(cookie4_get_tracker_database(), fn($entry) => $entry['id'] === $service['id']));
    check(count($registered) === 1 && $registered[0]['custom'] && $registered[0]['description'] === $service['description'], 'scanner derives the same custom service without duplicate records');
    check(cookie4_service_for_url('https://api.example.com/embed/calendar') === $service['id'], 'server blocker reuses custom URL rules');
    $_COOKIE['cb_csp_consent'] = wp_json_encode(['version' => cookie4_build_config()['noticeVersion'], 'services' => [$service['id']], 'expires' => (time() + 600) * 1000]);
    check(str_contains(cookie4_csp_policy(), 'https://api.example.com'), 'CSP grants the configured custom origin after consent');
    $purpose = get_option('cookie4_purposes', '');
    update_option('cookie4_purposes', $purpose . ' Changed purpose.');
    check(!str_contains(cookie4_csp_policy(), 'https://api.example.com'), 'changed disclosure invalidates old network grant before rendering');
    update_option('cookie4_purposes', $purpose);
    $_COOKIE['cb_csp_consent'] = wp_json_encode(['version' => cookie4_build_config()['noticeVersion'], 'services' => [$service['id']], 'expires' => (time() - 1) * 1000]);
    check(!str_contains(cookie4_csp_policy(), 'https://api.example.com'), 'expired grant cannot unlock server CSP');
    $health = cookie4_site_health();
    check($health['test'] === 'cookie4_blocking' && $health['status'] === 'good', 'Site Health reports configured prerequisites');
    $hooks = apply_filters('site_status_tests', []);
    check(isset($hooks['direct']['cookie4_blocking']), 'Site Health test is registered');
    $info = apply_filters('debug_information', []);
    check(isset($info['cookie4']['fields']['strict_csp']), 'Site Health support information is registered');
} finally {
    update_option('cookie4_services', $original, false);
    $_COOKIE = $cookies;
}
