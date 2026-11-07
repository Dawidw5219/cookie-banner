<?php
if (!defined('ABSPATH')) { exit; }

function cookie4_normalize_locale(string $lang): string {
    $parts = explode('-', strtolower(str_replace('_', '-', trim($lang))));
    if (in_array($parts[0], ['nb', 'nn'], true)) { $parts[0] = 'no'; }
    return implode('-', $parts);
}

function cookie4_resolve_lang(): string {
    $request = apply_filters('cookie4_request_language', null);
    if (is_string($request) && preg_match('/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/iD', $request)) { return cookie4_normalize_locale($request); }
    $setting = get_option('cookie4_lang', 'auto');
    if ($setting !== 'auto') { return cookie4_normalize_locale($setting === 'custom' ? 'en' : $setting); }
    $lang = function_exists('pll_current_language') ? pll_current_language('slug') : apply_filters('wpml_current_language', null);
    return cookie4_normalize_locale(is_string($lang) && $lang !== '' ? $lang : get_locale());
}

/** Walk only translated content, never network rules or cleanup identifiers. */
function cookie4_translate_content(array $values, string $lang, string $path = '', bool $register = false): array {
    foreach ($values as $key => $value) {
        $name = $path === '' ? (string) $key : $path . '.' . $key;
        if (is_array($value)) { $values[$key] = cookie4_translate_content($value, $lang, $name, $register); }
        elseif (is_string($value) && $value !== '') {
            if ($register) {
                if (function_exists('pll_register_string')) { pll_register_string($name, $value, 'Cookie Banner', true); }
                else { do_action('wpml_register_single_string', 'Cookie Banner', $name, $value); }
            } else {
                $translated = function_exists('pll_translate_string') ? pll_translate_string($value, $lang) : apply_filters('wpml_translate_single_string', $value, 'Cookie Banner', $name, $lang);
                if (is_string($translated) && $translated !== '') { $values[$key] = $translated; }
            }
        }
    }
    return $values;
}

function cookie4_service_texts(array $services, array $disclosures): array {
    $result = [];
    $keys = array_flip(['name', 'description', 'privacyUrl', 'retention']);
    foreach ($services as $service) { $result[$service['id']] = array_intersect_key($service, $keys); }
    foreach ($disclosures as $id => $service) { $result[$id] = array_merge($result[$id] ?? [], array_intersect_key((array) $service, $keys)); }
    return $result;
}

function cookie4_translation_sources(): array {
    $texts = json_decode(get_option('cookie4_custom_texts', '') ?: '{}', true) ?: [];
    $services = cookie4_service_texts(get_option('cookie4_services', []), get_option('cookie4_service_disclosures', []));
    $cookies = [];
    foreach (get_option('cookie4_scanned_cookies', []) as $cookie) { $cookies[$cookie['name']] = ['description' => $cookie['description'] ?? '', 'retention' => $cookie['retention'] ?? '']; }
    return [
        'cookies' => $cookies,
        'controller' => ['name' => get_option('cookie4_controller_name', '')],
        'purposes' => get_option('cookie4_purposes', ''),
        'privacyPolicyUrl' => get_option('cookie4_privacy_policy_url', '') ?: get_privacy_policy_url(),
        'cookiePolicyUrl' => get_option('cookie4_cookie_policy_url', ''),
        'customTexts' => $texts,
        'serviceDisclosures' => $services,
    ];
}

function cookie4_register_translatable_content(): void {
    cookie4_translate_content(cookie4_translation_sources(), '', '', true);
}
add_action('admin_init', 'cookie4_register_translatable_content', 30);
add_action('updated_option', function ($name) {
    if (str_starts_with($name, 'cookie4_') && in_array($name, ['cookie4_controller_name', 'cookie4_purposes', 'cookie4_privacy_policy_url', 'cookie4_cookie_policy_url', 'cookie4_custom_texts', 'cookie4_services', 'cookie4_service_disclosures', 'cookie4_scanned_cookies'], true)) { cookie4_register_translatable_content(); }
}, 10, 1);

function cookie4_nonempty_translations(array $values): array {
    $result = [];
    foreach ($values as $key => $value) {
        if (is_array($value)) { $result[$key] = cookie4_nonempty_translations($value); }
        elseif (is_string($value) && trim($value) !== '') { $result[$key] = $value; }
    }
    return $result;
}

function cookie4_provider_language(string $lang): string {
    $slugs = function_exists('pll_languages_list') ? pll_languages_list(['fields' => 'slug']) : array_keys((array) apply_filters('wpml_active_languages', [], ['skip_missing' => 0]));
    foreach ($slugs as $slug) { if (cookie4_normalize_locale($slug) === $lang) { return $slug; } }
    return $lang;
}

function cookie4_localize_config(array $config): array {
    $lang = cookie4_normalize_locale($config['lang']);
    $fields = array_intersect_key($config, array_flip(['controller', 'purposes', 'privacyPolicyUrl', 'cookiePolicyUrl', 'customTexts']));
    $fields['serviceDisclosures'] = cookie4_service_texts($config['services'] ?? [], (array) ($config['serviceDisclosures'] ?? []));
    $provider_lang = cookie4_provider_language($lang);
    $fields = cookie4_translate_content($fields, $provider_lang);
    foreach (['privacyPolicyUrl', 'cookiePolicyUrl'] as $key) {
        $post_id = !empty($config[$key]) ? url_to_postid($config[$key]) : 0;
        if (!$post_id) { continue; }
        $translated_id = function_exists('pll_get_post') ? pll_get_post($post_id, $provider_lang) : apply_filters('wpml_object_id', $post_id, 'page', true, $provider_lang);
        if ($translated_id) { $fields[$key] = get_permalink($translated_id); }
    }
    $locales = json_decode(get_option('cookie4_localizations', '') ?: '{}', true) ?: [];
    $normalized = [];
    foreach ($locales as $locale => $value) { $normalized[cookie4_normalize_locale($locale)] = $value; }
    foreach (array_unique([explode('-', $lang)[0], $lang]) as $locale) {
        $fields = array_replace_recursive($fields, cookie4_nonempty_translations($normalized[$locale] ?? []));
    }
    // The global custom editor uses dot keys; locale entries may use nested values.
    $flat = $fields['customTexts'] ?? [];
    $nested = [];
    foreach ($flat as $key => $value) {
        $target = &$nested;
        foreach (explode('.', $key) as $part) { $target = &$target[$part]; }
        $target = is_array($value) ? array_replace_recursive(is_array($target) ? $target : [], $value) : $value;
        unset($target);
    }
    $fields['customTexts'] = $nested;
    foreach ($fields['serviceDisclosures'] as $id => $value) { $fields['serviceDisclosures'][$id] = array_merge((array) (((array) ($config['serviceDisclosures'] ?? []))[$id] ?? []), $value); }
    $config = array_replace($config, $fields);
    $config['lang'] = $lang;
    if (!empty($config['receiptEndpoint'])) { $config['receiptEndpoint'] = add_query_arg('cookie4_lang', $lang, $config['receiptEndpoint']); }
    $config['serviceDisclosures'] = (object) $config['serviceDisclosures'];
    return $config;
}

/** Validate the complete payload before any options are written. */
function cookie4_validate_localizations($raw) {
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_string($raw) || !is_object(json_decode($raw)) || !is_array($data) || count($data) > 50 || ($data && array_keys($data) === range(0, count($data) - 1))) {
        return new WP_Error('cookie4_localizations', 'Provide a JSON object keyed by language.', ['status' => 400]);
    }
    $allowed = ['controller', 'purposes', 'privacyPolicyUrl', 'cookiePolicyUrl', 'customTexts', 'serviceDisclosures'];
    $clean = [];
    foreach ($data as $locale => $fields) {
        if (!preg_match('/^[a-z]{2,3}([_-][a-z0-9]{2,8})*$/iD', $locale) || !is_array($fields) || array_diff(array_keys($fields), $allowed)) {
            return new WP_Error('cookie4_localizations', 'Invalid language or localized field.', ['status' => 400]);
        }
        $sanitize = function ($values, int $depth = 0) use (&$sanitize) {
            if ($depth > 8) { return null; }
            if (is_string($values)) { return strlen($values) <= 8000 ? sanitize_text_field($values) : null; }
            if (!is_array($values) || count($values) > 200) { return null; }
            $result = [];
            foreach ($values as $key => $value) {
                if (!is_string($key) || in_array($key, ['__proto__', 'constructor', 'prototype'], true)) { return null; }
                $item = $sanitize($value, $depth + 1);
                if ($item === null) { return null; }
                $result[$key] = $item;
            }
            return $result;
        };
        $value = $sanitize($fields);
        if ($value === null) { return new WP_Error('cookie4_localizations', 'Translations must contain text only.', ['status' => 400]); }
        foreach (['purposes', 'privacyPolicyUrl', 'cookiePolicyUrl'] as $field) {
            if (isset($value[$field]) && !is_string($value[$field])) { return new WP_Error('cookie4_localizations', 'Expected a text field.', ['status' => 400]); }
        }
        if (isset($value['controller']) && (!is_array($value['controller']) || array_diff(array_keys($value['controller']), ['name', 'contactUrl']) || count(array_filter($value['controller'], 'is_string')) !== count($value['controller']))) { return new WP_Error('cookie4_localizations', 'Invalid controller translation.', ['status' => 400]); }
        foreach (['customTexts', 'serviceDisclosures'] as $field) { if (isset($value[$field]) && !is_array($value[$field])) { return new WP_Error('cookie4_localizations', 'Expected a translation object.', ['status' => 400]); } }
        foreach ($value['serviceDisclosures'] ?? [] as $id => $service) {
            if (!preg_match('/^[a-z0-9_.-]{1,100}$/iD', $id) || !is_array($service) || count(array_filter($service, 'is_string')) !== count($service) || array_diff(array_keys($service), ['name', 'description', 'privacyUrl', 'retention'])) { return new WP_Error('cookie4_localizations', 'Service translations cannot change blocking rules.', ['status' => 400]); }
        }
        $urls = [$value['privacyPolicyUrl'] ?? '', $value['cookiePolicyUrl'] ?? '', $value['controller']['contactUrl'] ?? ''];
        foreach ($value['serviceDisclosures'] ?? [] as $service) { $urls[] = $service['privacyUrl'] ?? ''; }
        foreach ($urls as $url) {
            if ($url === '') { continue; }
            $parts = wp_parse_url($url);
            if ($parts === false || isset($parts['user']) || isset($parts['pass']) || (isset($parts['scheme']) && !in_array(strtolower($parts['scheme']), ['http', 'https'], true))) { return new WP_Error('cookie4_localizations', 'Policy links must be HTTP(S) URLs or site-relative paths.', ['status' => 400]); }
        }
        $clean[cookie4_normalize_locale($locale)] = $value;
    }
    return wp_json_encode((object) $clean);
}

/** Generated from src/i18n at build time, with the same localized overrides as the JS UI. */
function cookie4_frontend_translation(?array $config = null): array {
    static $dictionary;
    if ($dictionary === null) { $dictionary = json_decode(file_get_contents(COOKIE4_PLUGIN_DIR . 'includes/translations.json'), true); }
    $config = $config ?? cookie4_build_config();
    $language = explode('-', $config['lang'])[0];
    return array_replace_recursive($dictionary[$language] ?? $dictionary['en'], $config['customTexts'] ?? []);
}
