<?php
// Usage: php plugin/tests/php/content-blocker.php /path/to/wordpress
if (empty($argv[1])) { fwrite(STDERR, "Pass the path to a WordPress installation.\n"); exit(1); }
define('ABSPATH', rtrim($argv[1], '/') . '/');
define('COOKIE4_PLUGIN_DIR', dirname(__DIR__, 2) . '/');
define('COOKIE4_PLUGIN_URL', 'http://127.0.0.1:5173/plugin/');
define('COOKIE4_VERSION', 'test');
function add_action(...$args) {}
function add_filter(...$args) {}
function add_shortcode(...$args) {}
function get_option($key, $default = false) { return $key === 'cookie4_variant' ? 'bar' : $default; }
function current_user_can(...$args) { return false; }
function get_locale() { return 'pl_PL'; }
function wp_allowed_protocols() { return ["http", "https"]; }
function wp_json_encode($value, $flags = 0) { return json_encode($value, $flags); }
function home_url($path) { return 'https://site.test' . $path; }
function wp_parse_url($url, $component = -1) { return parse_url($url, $component); }
function apply_filters($tag, $value, ...$args) { return $value; }
function __($text) { return $text; }
function _doing_it_wrong(...$args) { throw new Exception(json_encode($args)); }
if (file_exists(ABSPATH . 'wp-includes/utf8.php')) { require_once ABSPATH . 'wp-includes/utf8.php'; }
require_once ABSPATH . 'wp-includes/formatting.php';
require_once ABSPATH . 'wp-includes/kses.php';
if (file_exists(ABSPATH . 'wp-includes/class-wp-token-map.php')) { require_once ABSPATH . 'wp-includes/class-wp-token-map.php'; }
require_once ABSPATH . 'wp-includes/html-api/class-wp-html-tag-processor.php';
foreach (glob(ABSPATH . 'wp-includes/html-api/*.php') as $file) { require_once $file; }
require COOKIE4_PLUGIN_DIR . 'includes/frontend.php';
require COOKIE4_PLUGIN_DIR . 'includes/scanner.php';
require COOKIE4_PLUGIN_DIR . 'includes/content-blocker.php';
$html = '<!doctype html><html><head><script src="/app.js"></script><script src="https://www.youtube.com/iframe_api"></script><script data-cb-service="youtube">initPlayer()</script><link rel="preconnect" href="https://www.youtube.com"></head><body><iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/test?a=1&amp;b=2"></iframe><iframe src="https://example.net/widget"></iframe><iframe src="/local"></iframe><img src="https://facebook.com/tr?id=secret"><iframe data-lazy-src="https://player.vimeo.com/video/123"></iframe></body></html>';
$out = cookie4_block_external_content($html);
$checks = [
    'local scripts remain live' => str_contains($out, '<script src="/app.js">'),
    'YouTube source becomes inert' => str_contains($out, 'data-cb-src="https://www.youtube-nocookie.com/embed/test?a=1&amp;b=2"'),
    'external scripts are text/plain' => substr_count($out, 'type="text/plain"') === 2,
    'unknown embeds need host consent' => str_contains($out, 'data-cb-service="external-example.net"'),
    'local iframe unchanged' => str_contains($out, '<iframe src="/local">'),
    'tracking pixel blocked' => str_contains($out, 'data-cb-src="https://facebook.com/tr?id=secret"'),
    'preconnect disabled' => !str_contains($out, 'href="https://www.youtube.com"'),
    'lazy iframe blocked' => !str_contains($out, 'data-lazy-src='),
    'idempotent output' => cookie4_block_external_content($out) === $out,
    'community provider recognized' => cookie4_service_for_url('https://cdn.segment.com/analytics.js') !== '',
    'inline loader blocked' => str_contains(cookie4_rewrite_consent_html('<script>var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";</script>'), 'type="text/plain"'),
    'synchronous bootstrap first in head' => str_contains($out, '<head><script id="cookie4-consent-config"'),
    'host spoofing rejected' => cookie4_service_for_url('https://evil.test/?youtube.com/embed/a') === '',
];
foreach ($checks as $name => $ok) { echo ($ok ? 'PASS ' : 'FAIL ') . $name . "\n"; }
if (in_array(false, $checks, true)) { echo $out; exit(1); }

if (!empty($argv[2])) {
    $fixture = '<!doctype html><html><head><title>WordPress blocker fixture</title>' . cookie4_banner_markup() .
        '<script>var loader=document.createElement("script");loader.src="https://"+"www.youtube.com/iframe_api";document.head.appendChild(loader);</script></head><body>' .
        '<iframe title="YouTube" src="https://www.youtube-nocookie.com/embed/test"></iframe>' .
        '<iframe title="Vimeo" src="https://player.vimeo.com/video/test"></iframe></body></html>';
    file_put_contents($argv[2], cookie4_block_external_content($fixture));
}

require COOKIE4_PLUGIN_DIR . 'includes/csp.php';
foreach (['{', '{}', '{"0":"youtube"}', '[true]', '["bad;id"]'] as $cookie) {
    $_COOKIE['cb_csp_consent'] = $cookie;
    if (cookie4_csp_grants() !== []) { throw new Exception('Malformed CSP cookie accepted: ' . $cookie); }
}
$_COOKIE['cb_csp_consent'] = '["youtube","youtube"]';
if (cookie4_csp_grants() !== ['youtube']) { throw new Exception('CSP consent not deduplicated'); }
$_COOKIE = [];


$registry = cookie4_csp_registry();
if (!in_array('https://instagram.com', $registry['tp-instagram']['frame-src'], true)) {
    throw new Exception('Wildcard providers must also allow their apex, matching service detection');
}
