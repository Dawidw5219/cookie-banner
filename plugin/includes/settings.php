<?php

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', 'cookie4_add_settings_page');
add_action('admin_init', 'cookie4_register_settings');

function cookie4_sanitize_checkbox_factory($key) {
    return function() use ($key) {
        return isset($_POST[$key]) ? '1' : '';
    };
}

function cookie4_add_settings_page(): void {
    add_options_page(
        'Cookie Banner App4You',
        'Cookie Banner',
        'manage_options',
        'cookie-banner-wp',
        'cookie4_render_admin_page'
    );
}

function cookie4_get_fields(): array {
    return [
        'cookie4_primary_color' => [
            'label'   => 'Primary Color',
            'type'    => 'color',
            'default' => '#2563eb',
        ],
        'cookie4_background_color' => [
            'label'   => 'Background Color',
            'type'    => 'color',
            'default' => '#ffffff',
        ],
        'cookie4_text_color' => [
            'label'   => 'Text Color',
            'type'    => 'color',
            'default' => '#1a1a1a',
        ],
        'cookie4_privacy_policy_url' => [
            'label'   => 'Privacy Policy URL',
            'type'    => 'url',
            'default' => '',
        ],
        'cookie4_cookie_policy_url' => [
            'label'   => 'Cookie Policy URL (optional)',
            'type'    => 'url',
            'default' => '',
        ],
        'cookie4_gtm_id' => [
            'label'   => 'GTM Container ID',
            'type'    => 'text',
            'default' => '',
        ],
        'cookie4_lang' => [
            'label'   => 'Language',
            'type'    => 'select',
            'default' => 'auto',
            'options'  => [
                'auto' => 'Auto (WordPress language)',
                'en'   => 'English',
                'pl'   => 'Polski',
                'fr'   => 'Français',
                'de'   => 'Deutsch',
                'es'   => 'Español',
                'it'   => 'Italiano',
                'custom' => 'Custom (edit texts)',
            ],
        ],
        'cookie4_variant' => [
            'label'   => 'Banner Style',
            'type'    => 'select',
            'default' => 'modal',
            'options'  => [
                'modal' => 'Modal (centered overlay, blocks page)',
                'bar'   => 'Bar (bottom strip, non-blocking)',
            ],
        ],
        'cookie4_test_mode' => [
            'label'   => '⚠️ Enable tracking before consent',
            'type'    => 'checkbox',
            'default' => '',
            'description' => 'Testing only: tracking starts immediately, but the cookie banner remains visible. Disable on public sites.',
        ],
        'cookie4_auto_accept_all' => [
            'label'   => '⚠️ Hide banner and allow all cookies',
            'type'    => 'checkbox',
            'default' => '',
            'description' => 'Private sites only: automatically allows all cookies and hides both the banner and settings icon. Disable on public sites.',
        ],
        'cookie4_load_gtm' => [
            'label'   => 'Load Google Tag Manager',
            'type'    => 'checkbox',
            'default' => '1',
            'description' => 'On: banner loads GTM automatically. Off: banner only manages consent signals — load GTM yourself (e.g. via Stape).',
        ],
        'cookie4_use_settings_link' => [
            'label'   => 'Use custom settings link (no floating icon)',
            'type'    => 'checkbox',
            'default' => '',
            'description' => 'On: hide floating icon; add class <code>open-consent-settings</code> to a link or button to open preferences. Off: show floating icon.',
        ],
    ];
}

function cookie4_register_settings(): void {
    $fields = cookie4_get_fields();

    add_settings_section(
        'cookie4_main_section',
        '',
        '__return_false',
        'cookie-banner-wp'
    );

    foreach ($fields as $key => $field) {
        $sanitize = $field['type'] === 'checkbox' ? cookie4_sanitize_checkbox_factory($key) : 'sanitize_text_field';
        register_setting('cookie4_settings_group', $key, [
            'type'              => 'string',
            'sanitize_callback' => $sanitize,
            'default'           => $field['default'],
        ]);

        // Still register fields for WP internals, but we render manually.
        add_settings_field(
            $key,
            $field['label'],
            '__return_false',
            'cookie-banner-wp',
            'cookie4_main_section',
            ['key' => $key, 'field' => $field]
        );
    }
}
