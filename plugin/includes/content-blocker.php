<?php
/** Block URLs in the response, before the browser's preload scanner sees them. */
if (!defined('ABSPATH')) { exit; }

add_action('template_redirect', function () {
    if (is_admin() || is_feed() || is_robots() || is_trackback() || wp_doing_ajax()) { return; }
    $pending = '';
    ob_start(function (string $html, int $phase) use (&$pending): string {
        if ($phase & PHP_OUTPUT_HANDLER_CLEAN) { $pending = ''; return ''; }
        $pending .= $html;
        return ($phase & PHP_OUTPUT_HANDLER_FINAL) ? cookie4_block_external_content($pending) : '';
    });
}, -9999);

function cookie4_service_for_url(string $url, bool $domain_only = false): string {
    $parts = wp_parse_url($url);
    $host = strtolower($parts['host'] ?? '');
    if ($host === '') { return ''; }
    static $custom_services;
    if ($custom_services === null) {
        $custom_services = function_exists('cookie4_build_config') ? (cookie4_build_config()['services'] ?? []) : [];
    }
    foreach ($custom_services as $service) {
        foreach ($service['urls'] ?? [] as $prefix) {
            $target = wp_parse_url($prefix);
            if (is_array($target) && ($target['host'] ?? '') === $host &&
                ($target['scheme'] ?? '') === ($parts['scheme'] ?? '') &&
                ($target['port'] ?? null) === ($parts['port'] ?? null) &&
                ($domain_only || str_starts_with($parts['path'] ?? '/', $target['path'] ?? '/'))) {
                return $service['id'];
            }
        }
    }
    static $rules;
    if ($rules === null) {
        $rules = [];
        foreach (cookie4_get_tracker_database() as $tracker) {
            foreach (array_merge($tracker['scriptPatterns'] ?? [], $tracker['networkPatterns'] ?? []) as $pattern) {
                $match = wp_parse_url('https://' . $pattern);
                $domain = strtolower($match['host'] ?? '');
                if (strpos($domain, '.') !== false) {
                    $rules[$domain][] = ['id' => $tracker['id'], 'path' => $match['path'] ?? '/', 'subdomains' => true];
                }
            }
            if (empty($tracker['requiresConsent'])) { continue; }
            foreach ($tracker['domains'] ?? [] as $domain) {
                $wildcard = str_starts_with($domain, '*.');
                $domain = $wildcard ? substr($domain, 2) : $domain;
                $rules[$domain][] = ['id' => $tracker['id'], 'path' => '/', 'subdomains' => $wildcard];
            }
        }
    }
    $suffix = $host;
    do {
        foreach ($rules[$suffix] ?? [] as $rule) {
            if (($suffix === $host || $rule['subdomains']) &&
                ($domain_only || str_starts_with($parts['path'] ?? '/', $rule['path']))) {
                return $rule['id'];
            }
        }
        $dot = strpos($suffix, '.');
        $suffix = $dot === false ? '' : substr($suffix, $dot + 1);
    } while ($suffix !== '');
    return '';
}

function cookie4_block_external_content(string $html): string {
    if (stripos($html, '<html') === false) { return $html; }
    if (function_exists('cookie4_csp_enabled') && cookie4_csp_enabled() && !headers_sent()) { header_remove('Link'); }
    $html = cookie4_rewrite_consent_html($html);
    $policy = '';
    if (function_exists('cookie4_csp_enabled') && cookie4_csp_enabled()) {
        // Unknown embeds are authorized only from URLs present in this response,
        // never by interpreting a cookie value as a destination.
        $embedded = [];
        $frames = new WP_HTML_Tag_Processor($html);
        while ($frames->next_tag(['tag_name' => 'IFRAME'])) {
            $url = $frames->get_attribute('data-cb-src');
            if (!is_string($url)) { continue; }
            $parts = wp_parse_url($url);
            $host = $parts['host'] ?? '';
            $id = $frames->get_attribute('data-cb-service');
            if (($parts['scheme'] ?? '') === 'https' && $host !== '' && $id === 'external-' . strtolower($host)) {
                $embedded[$id]['frame-src'][] = 'https://' . $host . (isset($parts['port']) ? ':' . $parts['port'] : '');
            }
        }
        $policy = cookie4_csp_policy($embedded);
        // The full response buffer has not sent a byte yet. Resolve the policy
        // after parsing so that unknown embeds can be released safely on reload.
        if (!headers_sent()) { cookie4_emit_csp($policy); }
    }

    if (function_exists('cookie4_banner_markup')) {
        // Relocate our synchronous bootstrap before raw code printed ahead of wp_head.
        $markup = cookie4_banner_markup();
        if (function_exists('cookie4_csp_enabled') && cookie4_csp_enabled()) {
            // Defense in depth for static HTML caches: policy precedes every resource.
            $markup = '<meta http-equiv="Content-Security-Policy" content="' . esc_attr($policy) . '">' . $markup;
        }
        $html = str_replace(cookie4_banner_markup(), '', $html);
        $html = preg_replace_callback('/<head\b[^>]*>/i', fn($match) => $match[0] . $markup, $html, 1);
    }
    return $html;
}

function cookie4_rewrite_consent_html(string $html): string {
    // WP 6.2+ provides a tag parser that preserves scripts, quoting and HTML.
    if (!class_exists('WP_HTML_Tag_Processor')) { return $html; }
    $processor = new WP_HTML_Tag_Processor($html);
    $site_host = strtolower(wp_parse_url(home_url('/'), PHP_URL_HOST) ?? '');
    while ($processor->next_tag()) {
        $tag = $processor->get_tag();
        if (!in_array($tag, ['SCRIPT', 'IFRAME', 'IMG', 'LINK', 'DIV'], true)) { continue; }
        if ($tag === 'DIV') {
            if ($processor->get_attribute('data-widget_type') !== 'video.default') { continue; }
            $settings = json_decode((string)$processor->get_attribute('data-settings'), true) ?: [];
            $type = $settings['video_type'] ?? '';
            $video_url = $settings[$type . '_url'] ?? '';
            $video_service = is_string($video_url) ? cookie4_service_for_url($video_url) : '';
            if ($video_service !== '') { $processor->set_attribute('data-cb-service', $video_service); }
        }
        $id = $processor->get_attribute('id');
        if (in_array($id, ['cookie4-consent-config', 'cookie4-data-layer', 'cookie4-scanner-config', 'cookie4-scanner-audit'], true)) { continue; }
        $attribute = $tag === 'LINK' ? 'href' : 'src';
        $url = $processor->get_attribute($attribute);
        if (!is_string($url) || $url === '') {
            $url = $processor->get_attribute('data-src') ?: $processor->get_attribute('data-lazy-src');
        }
        if ($tag === 'LINK' && function_exists('cookie4_csp_enabled') && cookie4_csp_enabled()) {
            $rel = strtolower((string) $processor->get_attribute('rel'));
            $hint_host = is_string($url) ? strtolower(wp_parse_url($url, PHP_URL_HOST) ?? '') : '';
            if ($hint_host !== '' && $hint_host !== $site_host && in_array($rel, ['preconnect', 'dns-prefetch', 'preload', 'modulepreload', 'prefetch'], true)) {
                $processor->remove_attribute('href');
                continue;
            }
        }
        $service = $processor->get_attribute('data-cb-service');
        $service = is_string($service) ? $service : '';
        if (is_string($url) && $url !== '') {
            $service = $service ?: cookie4_service_for_url($url, $tag === 'LINK');
            $host = strtolower(wp_parse_url($url, PHP_URL_HOST) ?? '');
            if ($tag === 'IFRAME' && $host !== '' && $host !== $site_host) {
                $service = $service ?: 'external-' . $host;
            }
        }
        if ($service === '' && $tag === 'SCRIPT' && !is_string($url) && method_exists($processor, 'get_modifiable_text')) {
            $code = $processor->get_modifiable_text();
            // Only inspect URL literals in executable loaders, not JSON/configuration blobs.
            if (preg_match('/createElement\s*\(|\.src\s*=|fetch\s*\(|new\s+Image\s*\(/', $code)) {
                preg_match_all('~(?:https?:)?//[a-zA-Z0-9._-]+[^\s\x22\x27<>`]*~', $code, $matches);
                foreach ($matches[0] as $candidate) {
                    $service = cookie4_service_for_url($candidate);
                    if ($service !== '') { break; }
                }
            }
        }
        if ($service === '') { continue; }
        // Resource hints must not contact blocked providers either.
        if ($tag === 'LINK') {
            $rel = strtolower((string) $processor->get_attribute('rel'));
            if ($rel === 'stylesheet') {
                $processor->set_attribute('data-cb-service', $service);
                $processor->set_attribute('data-cb-src', $url);
                $processor->remove_attribute('href');
            }
            if (in_array($rel, ['preconnect', 'dns-prefetch', 'preload', 'modulepreload', 'prefetch'], true)) {
                $processor->remove_attribute('href');
            }
            continue;
        }
        $processor->set_attribute('data-cb-service', $service);
        if (is_string($url) && $url !== '') {
            $processor->set_attribute('data-cb-src', $url);
            $processor->remove_attribute($attribute);
        }
        foreach (['data-src', 'data-lazy-src', 'srcset', 'data-srcset', 'data-lazy-srcset'] as $attr) {
            $processor->remove_attribute($attr);
        }
        if ($tag === 'SCRIPT') {
            $type = $processor->get_attribute('type');
            if ($type !== 'text/plain') {
                $processor->set_attribute('data-cb-type', is_string($type) ? $type : 'text/javascript');
                $processor->set_attribute('type', 'text/plain');
            }
        } else {
            $processor->set_attribute('hidden', true);
            // Lazy-load plugins must not bypass the gate.
            $processor->remove_attribute('srcdoc');
        }
    }
    return $processor->get_updated_html();
}

// Native WP hooks cover fragments returned by renderers and AJAX, while the
// response pass also covers raw HTML printed directly by themes/plugins.
foreach (['script_loader_tag', 'render_block', 'embed_oembed_html'] as $hook) {
    add_filter($hook, function ($html) {
        return is_admin() ? $html : cookie4_rewrite_consent_html($html);
    }, PHP_INT_MAX);
}

add_filter('wp_inline_script_attributes', function (array $attributes): array {
    if (is_admin()) { return $attributes; }
    $id = $attributes['id'] ?? '';
    $handle = preg_replace('/-js-(before|after)$/', '', $id);
    $registered = wp_scripts()->registered[$handle] ?? null;
    if ($registered && is_string($registered->src)) {
        $service = cookie4_service_for_url($registered->src);
        if ($service !== '') {
            $attributes['data-cb-service'] = $service;
            $attributes['data-cb-type'] = $attributes['type'] ?? 'text/javascript';
            $attributes['type'] = 'text/plain';
        }
    }
    return $attributes;
});
