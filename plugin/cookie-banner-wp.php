<?php
/**
 * Plugin Name: Cookie Banner App4You
 * Plugin URI: https://app4you.dev
 * Description: Lightweight GDPR cookie consent banner with Google Consent Mode v2 support.
 * Requires at least: 6.5
 * Requires PHP: 8.0
 * Version: 2.0.2
 * Author: App4You.dev
 * Author URI: https://app4you.dev
 * License: GPL-2.0-or-later
 * Text Domain: cookie-banner-wp
 * GitHub URI: Dawidw5219/cookie-banner
 */

if (!defined('ABSPATH')) {
    exit;
}

define('COOKIE4_VERSION', '2.0.2');
define('COOKIE4_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('COOKIE4_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once COOKIE4_PLUGIN_DIR . 'includes/settings.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/rest-settings.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/admin-page.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/multilingual.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/frontend.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/content-blocker.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/scanner.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/csp.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/consent-records.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/services-admin.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/diagnostics.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/preview.php';
require_once COOKIE4_PLUGIN_DIR . 'includes/github-updater.php';

register_activation_hook(__FILE__, 'cookie4_activate');
register_deactivation_hook(__FILE__, function () { wp_clear_scheduled_hook('cookie4_expire_receipts'); });

function cookie4_activate(): void {
    $defaults = [
        'cookie4_primary_color'       => '#2563eb',
        'cookie4_background_color'   => '#ffffff',
        'cookie4_text_color'          => '#1a1a1a',
        'cookie4_privacy_policy_url'  => '',
        'cookie4_cookie_policy_url'   => '',
        'cookie4_gtm_id'              => '',
        'cookie4_lang'               => 'auto',
        'cookie4_variant'            => 'modal',
        'cookie4_test_mode'          => '',
        'cookie4_auto_accept_all'    => '',
        'cookie4_load_gtm'           => '1',
        'cookie4_use_settings_link'  => '',
        'cookie4_custom_texts'       => '',
    ];

    foreach ($defaults as $key => $value) {
        if (get_option($key) === false) {
            add_option($key, $value);
        }
    }
}
