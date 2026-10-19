<?php

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_head', 'cookie4_print_banner', -9999);
add_shortcode('cookie_preferences_link', 'cookie4_shortcode_preferences_link');
add_shortcode('cookie_policy_table', 'cookie4_shortcode_policy_table');

function cookie4_shortcode_preferences_link($atts): string {
    $atts = shortcode_atts(['text' => ''], $atts, 'cookie_preferences_link');
    $text = $atts['text'] !== '' ? $atts['text'] : __('Cookie preferences', 'cookie-banner-wp');
    return sprintf('<a href="#" class="open-consent-settings" role="button">%s</a>', esc_html($text));
}

function cookie4_shortcode_policy_table($atts): string {
    $atts = shortcode_atts([
        'show_unknown' => 'no',
        'group'        => 'yes',
    ], $atts, 'cookie_policy_table');

    $cookies = get_option( 'cookie4_scanned_cookies', [] );

    if ( empty( $cookies ) ) {
        return '<p>' . esc_html__( 'No cookies have been detected yet. Run the Cookie Scanner from the admin panel.', 'cookie-banner-wp' ) . '</p>';
    }

    // Filter out Unknown if requested.
    if ( $atts['show_unknown'] !== 'yes' ) {
        $cookies = array_filter( $cookies, fn( $c ) => ( $c['category'] ?? 'Unknown' ) !== 'Unknown' );
    }

    if ( empty( $cookies ) ) {
        return '<p>' . esc_html__( 'No categorized cookies found. Assign categories in the Cookie Scanner.', 'cookie-banner-wp' ) . '</p>';
    }

    // Group by category.
    $grouped = [];
    $category_order = [ 'Functional', 'Analytics', 'Marketing', 'Security', 'Personalization', 'Unknown' ];
    foreach ( $cookies as $cookie ) {
        $cat = $cookie['category'] ?? 'Unknown';
        $grouped[ $cat ][] = $cookie;
    }

    // Sort groups by predefined order.
    $sorted = [];
    foreach ( $category_order as $cat ) {
        if ( isset( $grouped[ $cat ] ) ) {
            $sorted[ $cat ] = $grouped[ $cat ];
        }
    }

    $category_labels = [
        'Functional'      => __( 'Functional', 'cookie-banner-wp' ),
        'Analytics'       => __( 'Analytics', 'cookie-banner-wp' ),
        'Marketing'       => __( 'Marketing', 'cookie-banner-wp' ),
        'Security'        => __( 'Security', 'cookie-banner-wp' ),
        'Personalization' => __( 'Personalization', 'cookie-banner-wp' ),
        'Unknown'         => __( 'Other', 'cookie-banner-wp' ),
    ];

    $category_descriptions = [
        'Functional'      => __( 'Necessary for the website to function. Cannot be disabled.', 'cookie-banner-wp' ),
        'Analytics'       => __( 'Help us understand how visitors use our website.', 'cookie-banner-wp' ),
        'Marketing'       => __( 'Used to deliver relevant ads and track campaigns.', 'cookie-banner-wp' ),
        'Security'        => __( 'Protect the website against fraud and abuse.', 'cookie-banner-wp' ),
        'Personalization' => __( 'Allow the website to remember your preferences.', 'cookie-banner-wp' ),
        'Unknown'         => __( 'Other cookies not yet categorized.', 'cookie-banner-wp' ),
    ];

    ob_start();
    ?>
    <div class="cookie4-policy-table">
    <style>
    .cookie4-policy-table { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.5; }
    .cookie4-policy-table h3 { font-size: 18px; font-weight: 600; margin: 1.5em 0 0.25em; }
    .cookie4-policy-table .cookie4-cat-desc { color: #6b7280; font-size: 13px; margin: 0 0 0.75em; }
    .cookie4-policy-table table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; }
    .cookie4-policy-table th { text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
    .cookie4-policy-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; color: #374151; }
    .cookie4-policy-table tr:last-child td { border-bottom: none; }
    .cookie4-policy-table .cookie4-name { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 500; }
    .cookie4-policy-table .cookie4-provider-link { color: #2563eb; text-decoration: none; }
    .cookie4-policy-table .cookie4-provider-link:hover { text-decoration: underline; }
    </style>
    <?php foreach ( $sorted as $cat => $items ) : ?>
        <?php if ( $atts['group'] === 'yes' ) : ?>
            <h3><?php echo esc_html( $category_labels[ $cat ] ?? $cat ); ?></h3>
            <p class="cookie4-cat-desc"><?php echo esc_html( $category_descriptions[ $cat ] ?? '' ); ?></p>
        <?php endif; ?>
        <table>
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Name', 'cookie-banner-wp' ); ?></th>
                    <th><?php esc_html_e( 'Provider', 'cookie-banner-wp' ); ?></th>
                    <th><?php esc_html_e( 'Purpose', 'cookie-banner-wp' ); ?></th>
                    <th><?php esc_html_e( 'Retention', 'cookie-banner-wp' ); ?></th>
                    <?php if ( $atts['group'] !== 'yes' ) : ?>
                        <th><?php esc_html_e( 'Category', 'cookie-banner-wp' ); ?></th>
                    <?php endif; ?>
                </tr>
            </thead>
            <tbody>
                <?php foreach ( $items as $cookie ) :
                    $provider = $cookie['platform'] ?? '';
                    $link     = $cookie['privacy_link'] ?? '';
                ?>
                <tr>
                    <td><span class="cookie4-name"><?php echo esc_html( $cookie['name'] ); ?></span></td>
                    <td>
                        <?php if ( $provider && $link ) : ?>
                            <a href="<?php echo esc_url( $link ); ?>" target="_blank" rel="noopener noreferrer" class="cookie4-provider-link"><?php echo esc_html( $provider ); ?></a>
                        <?php else : ?>
                            <?php echo esc_html( $provider ?: '—' ); ?>
                        <?php endif; ?>
                    </td>
                    <td><?php echo esc_html( $cookie['description'] ?: '—' ); ?></td>
                    <td><?php echo esc_html( $cookie['retention'] ?: '—' ); ?></td>
                    <?php if ( $atts['group'] !== 'yes' ) : ?>
                        <td><?php echo esc_html( $category_labels[ $cookie['category'] ] ?? $cookie['category'] ); ?></td>
                    <?php endif; ?>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
}

function cookie4_print_banner(): void {
    // In audit mode, skip the banner to prevent overriding deny-all consent.
    if ( get_option( 'cookie4_audit_mode', '' ) === '1' && current_user_can( 'manage_options' ) ) {
        return;
    }

    $config = cookie4_build_config();
    $js_file = COOKIE4_PLUGIN_DIR . 'assets/cookie-banner.js';
    $js_ver  = file_exists($js_file) ? md5_file($js_file) : COOKIE4_VERSION;
    $js_url  = COOKIE4_PLUGIN_URL . 'assets/cookie-banner.js?ver=' . $js_ver;

    // The consent default is pushed by cookie-banner.js with the REAL stored state (granted for
    // returning visitors, denied for first-timers). GTM processes `default` commands at Consent Init
    // but `update` only after Container Loaded — so pushing denied here + update later blocks tags
    // that trigger on "All Pages" / "Initialization". Pushing the correct default straight from JS
    // avoids the update entirely on normal page loads.
    ?>
<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};</script>
<script>window.__cookieConsent=<?php echo wp_json_encode($config); ?>;</script>
<script src="<?php echo esc_url($js_url); ?>"></script>
    <?php
}

function cookie4_resolve_lang(): string {
    $lang = get_option('cookie4_lang', 'auto');

    // "custom" means use English as base + customTexts overrides.
    if ($lang === 'custom') {
        return 'en';
    }

    if ($lang !== 'auto') {
        return $lang;
    }

    $locale = get_locale();
    $code   = strtolower(substr($locale, 0, 2));

    $supported = ['en', 'pl', 'fr', 'de', 'es', 'it'];

    return in_array($code, $supported, true) ? $code : 'en';
}

function cookie4_build_config(): array {
    $primary    = get_option('cookie4_primary_color', '#2563eb');
    $background = get_option('cookie4_background_color', '#ffffff');
    $text       = get_option('cookie4_text_color', '#1a1a1a');
    $privacy    = get_option('cookie4_privacy_policy_url', '');
    $cookie_pol = get_option('cookie4_cookie_policy_url', '');
    $gtm_id     = get_option('cookie4_gtm_id', '');

    $has_gtm         = !empty($gtm_id);
    $test_mode       = get_option('cookie4_test_mode', '') === '1';
    $auto_accept_all = get_option('cookie4_auto_accept_all', '') === '1';
    $load_gtm        = get_option('cookie4_load_gtm', '1') === '1';
    $use_link        = get_option('cookie4_use_settings_link', '') === '1';

    $variant = get_option('cookie4_variant', 'modal');

    $config = [
        'mode'    => $has_gtm ? 'gtm' : 'standalone',
        'variant' => $variant,
        'lang'    => cookie4_resolve_lang(),
        'theme'   => [
            'primary'    => $primary,
            'background' => $background,
            'text'       => $text,
        ],
    ];

    if (!empty($privacy)) {
        $config['privacyPolicyUrl'] = $privacy;
    }

    if (!empty($cookie_pol)) {
        $config['cookiePolicyUrl'] = $cookie_pol;
    }

    if ($has_gtm) {
        $config['gtmId'] = $gtm_id;
        if (!$load_gtm) {
            $config['loadGtm'] = false;
        }
    }

    if ($test_mode) {
        $config['testMode'] = true;
    }

    if ($auto_accept_all) {
        $config['autoAcceptAll'] = true;
    }

    if ($use_link) {
        $config['useCustomSettingsLink'] = true;
    }

    // Custom texts: convert flat dot-notation keys to nested object.
    $custom_texts_raw = get_option( 'cookie4_custom_texts', '' );
    if ( $custom_texts_raw ) {
        $flat = json_decode( $custom_texts_raw, true );
        if ( is_array( $flat ) && ! empty( $flat ) ) {
            $nested = [];
            foreach ( $flat as $dot_key => $value ) {
                if ( empty( $value ) ) continue;
                $parts   = explode( '.', $dot_key );
                $current = &$nested;
                foreach ( $parts as $i => $part ) {
                    if ( $i === count( $parts ) - 1 ) {
                        $current[ $part ] = $value;
                    } else {
                        if ( ! isset( $current[ $part ] ) || ! is_array( $current[ $part ] ) ) {
                            $current[ $part ] = [];
                        }
                        $current = &$current[ $part ];
                    }
                }
                unset( $current );
            }
            if ( ! empty( $nested ) ) {
                $config['customTexts'] = $nested;
            }
        }
    }

    return $config;
}
