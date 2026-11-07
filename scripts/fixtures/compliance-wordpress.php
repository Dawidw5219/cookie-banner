<?php
// Only the isolated local fixture; never run against a customer installation.
$root = $argv[1] ?? '';
$_SERVER['HTTP_HOST'] = '127.0.0.1:9403'; $_SERVER['SERVER_NAME'] = '127.0.0.1';
$_SERVER['SERVER_PORT'] = '9403'; $_SERVER['REQUEST_URI'] = '/';
require rtrim($root, '/') . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') { throw new Exception('Local fixture required'); }
$path = '/tmp/cb-compliance-options.json';
$mode = $argv[2] ?? 'setup';
if ($mode === 'restore') {
    if (!file_exists($path)) { exit; }
    foreach (json_decode(file_get_contents($path), true) as $key => $value) {
        if ($value === null) { delete_option($key); } else { update_option($key, $value); }
    }
    unlink($path); cookie4_csp_refresh_cache(); echo "Restored local fixture options\n"; exit;
}
$updates = [
    'cookie4_controller_name' => 'QA test controller — local fixture only',
    'cookie4_purposes' => 'Optional embedded videos and analytics in an isolated test website.',
    'cookie4_notice_version' => 'qa-hardening-1',
    'cookie4_privacy_policy_url' => home_url('/privacy-policy/'),
    'cookie4_lang' => 'pl',
    'cookie4_service_disclosures' => [
        'youtube' => ['description' => 'Play the video explicitly requested by the visitor using YouTube.', 'privacyUrl' => 'https://policies.google.com/privacy', 'retention' => 'QA session; test data only'],
        'ga4' => ['description' => 'QA traffic measurement.', 'privacyUrl' => 'https://policies.google.com/privacy', 'retention' => 'QA session; test data only'],
    ],
    'cookie4_scanned_cookies' => [['name' => '_qa_tracker', 'category' => 'Analytics', 'platform' => 'YouTube', 'description' => 'Test identifier', 'retention' => 'Session', 'domain' => '127.0.0.1']],
];
if (!file_exists($path)) {
    $backup = [];
    foreach (array_merge(array_keys($updates), ['active_plugins', 'wp_rocket_settings', 'litespeed.conf', 'cookie4_variant']) as $key) { $backup[$key] = get_option($key, null); }
    file_put_contents($path, wp_json_encode($backup)); chmod($path, 0600);
}
foreach ($updates as $key => $value) { update_option($key, $value); }
cookie4_install_receipts(); cookie4_csp_refresh_cache();
echo "Prepared complete, explicitly fictional local privacy configuration\n";
