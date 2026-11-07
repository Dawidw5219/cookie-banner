<?php
/** Standalone scanner contracts; no WordPress database or network required. */
define('ABSPATH', __DIR__);
define('COOKIE4_PLUGIN_DIR', dirname(__DIR__, 2) . '/');

$options = [];
function add_action(...$args): void {}
function get_option($key, $default = false) { global $options; return $options[$key] ?? $default; }
function update_option($key, $value, ...$args): void { global $options; $options[$key] = $value; }
function delete_option($key): void { global $options; unset($options[$key]); }
function sanitize_text_field($value): string { return trim((string) $value); }
function esc_url_raw($value): string { return (string) $value; }
function current_time($format): string { return '2026-11-07 12:00:00'; }
function home_url($path = ''): string { return 'https://example.test' . $path; }

class WP_REST_Request {
    private array $data;
    function __construct(array $data) { $this->data = $data; }
    function get_json_params(): array { return $this->data; }
    function get_param($key) { return $this->data[$key] ?? null; }
}
class WP_REST_Response {
    public array $data;
    function __construct(array $data, int $status = 200) { $this->data = $data; }
}
function check($condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function check_no_values(array $records): void {
    foreach ($records as $record) {
        check(!array_key_exists('value', $record), 'Raw value persisted');
        check(!array_key_exists('value_preview', $record), 'Value preview persisted');
    }
}
require COOKIE4_PLUGIN_DIR . 'includes/scanner.php';

$options['cookie4_scanned_cookies'] = [
    'legacy' => ['name' => 'legacy', 'value_preview' => 'secret', 'value' => 'token'],
];
check_no_values(cookie4_scanner_get_cookies()->data['cookies']);
check_no_values($options['cookie4_scanned_cookies']);

cookie4_scanner_receive(new WP_REST_Request([
    ['name' => 'cb_consent_record', 'domain' => 'example.test', 'value' => 'do-not-save'],
]));
check_no_values($options['cookie4_scanned_cookies']);
cookie4_scanner_import_cookies(new WP_REST_Request(['cookies' => [
    ['name' => 'imported', 'domain' => 'example.test', 'value_preview' => 'do-not-import'],
]]));
check_no_values(cookie4_scanner_export_cookies()->data['cookies']);

$options['cookie4_detected_trackers'] = [
    'unvisited' => ['audit_status' => 'ok'],
    'loaded' => ['audit_status' => ''],
];
check(cookie4_scanner_get_trackers()->data['trackers'][0]['audit_status'] === 'not_observed', 'Legacy OK status exposed');
$options['cookie4_audit_detections'] = ['unvisited'];
cookie4_scanner_toggle_audit(new WP_REST_Request(['active' => true]));
check(!isset($options['cookie4_audit_detections']), 'Previous audit detections retained');
$options['cookie4_detected_trackers']['newly_blocked'] = ['audit_status' => ''];
cookie4_scanner_record_audit_detections(new WP_REST_Request(['ids' => ['loaded']]));
cookie4_scanner_toggle_audit(new WP_REST_Request(['active' => false]));
check($options['cookie4_detected_trackers']['unvisited']['audit_status'] === 'not_observed', 'Unvisited tracker incorrectly approved');
check($options['cookie4_detected_trackers']['newly_blocked']['audit_status'] === 'not_observed', 'Blocked tracker lacks observation status');
check($options['cookie4_detected_trackers']['loaded']['audit_status'] === 'violation', 'Observed request not reported');
echo "PASS scanner metadata-only storage, legacy cleanup, safe imports/exports and audit observation status\n";
