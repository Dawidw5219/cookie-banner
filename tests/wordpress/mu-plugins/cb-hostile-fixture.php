<?php
/** Plugin Name: Cookie Banner hostile integration fixture (local tests only) */
add_shortcode('cb_hostile_fixture', function ($atts = []) {
    $case = sanitize_key($atts['case'] ?? $_GET['probe'] ?? 'static');
    $url = 'https://www.youtube.com/embed/privacy-probe';
    if ($case === 'static') return '<iframe title="raw-video" src="' . $url . '"></iframe><script src="https://www.youtube.com/iframe_api"></script>';
    $code = [
        'srcset' => 'var i=new Image();i.srcset="https://www.facebook.com/tr?probe=1 1x";document.body.append(i);',
        'srcdoc' => 'var f=document.createElement("iframe");f.srcdoc=\'<iframe src="https://www.youtube.com/embed/privacy-probe"></iframe>\';document.body.append(f);',
        'namespace' => 'var f=document.createElement("iframe");document.body.append(f);f.setAttributeNS(null,"src","https://"+"www.youtube.com/embed/privacy-probe");',
        'shadow' => 'var d=document.createElement("div");document.body.append(d);d.attachShadow({mode:"open"}).innerHTML=\'<iframe src="https://www.youtube.com/embed/privacy-probe"></iframe>\';',
        'raw-loader' => 'var s=document.createElement("script");s.src="https://"+"www.youtube.com/iframe_api";s.type="text/javascript";document.head.append(s);',
        'fetch' => 'fetch("https://"+"www.google-analytics.com/g/collect").catch(function(){});',
    ][$case] ?? '';
    return '<script>' . $code . '</script>';
});

add_action('init', function () {
    if (get_option('cb_hostile_pages_ready')) return;
    foreach (['static','srcset','srcdoc','namespace','shadow','raw-loader','fetch'] as $case) {
        wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_name'=>'probe-'.$case,'post_title'=>'Probe '.$case,'post_content'=>'[cb_hostile_fixture case="'.$case.'"]']);
    }
    update_option('permalink_structure', '/%postname%/');
    flush_rewrite_rules();
    update_option('cb_hostile_pages_ready', true);
});
add_action('send_headers', function () {
    header('X-CB-Test-Theme: '.get_stylesheet());
    header('X-CB-Test-WP: '.get_bloginfo('version'));
    header('X-CB-Test-Cache: '.(class_exists('Cache_Enabler')?'active':'inactive'));
});
add_action('init', function () {
    if (isset($_GET['cb_test_purge']) && wp_parse_url(home_url(), PHP_URL_HOST) === '127.0.0.1' && class_exists('Cache_Enabler')) {
        Cache_Enabler::clear_total_cache();
    }
});
add_action('init', function () {
    if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') return;
    if (isset($_GET['cb_optimizer']) && class_exists('LiteSpeed\Conf')) {
        $profile = sanitize_key($_GET['cb_optimizer']);
        $conf = \LiteSpeed\Conf::cls();
        $conf->update('optm-js_min', $profile !== 'off');
        $conf->update('optm-js_comb', in_array($profile, ['combine','both'], true));
        $conf->update('optm-js_comb_ext_inl', in_array($profile, ['combine','both'], true));
        $conf->update('optm-js_defer', in_array($profile, ['delay','both'], true) ? 2 : 0);
        update_option('cb_optimizer_profile', $profile);
        do_action('litespeed_purge_all');
    }
    if (class_exists('Elementor\Plugin') && !get_option('cb_elementor_fixture')) {
        update_option('cb_elementor_fixture', -1);
        $id=wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_name'=>'elementor-consent-probe','post_title'=>'Elementor consent probe']);
        update_post_meta($id,'_elementor_edit_mode','builder');
        update_post_meta($id,'_elementor_template_type','wp-page');
        update_post_meta($id,'_elementor_version',ELEMENTOR_VERSION);
        $data=[['id'=>'testsection','elType'=>'section','elements'=>[['id'=>'testcolumn','elType'=>'column','settings'=>['_column_size'=>100],'elements'=>[['id'=>'testhtml','elType'=>'widget','widgetType'=>'html','settings'=>['html'=>'<iframe title="elementor-video" src="https://www.youtube.com/embed/privacy-probe"></iframe><script>window.cbFunctionalWorks=true;</script><button id="local-action" onclick="this.textContent=\'Works\'">Local action</button>'],'elements'=>[]]]]]]];
        update_post_meta($id,'_elementor_data',wp_slash(wp_json_encode($data)));
        update_option('cb_elementor_fixture',$id);
        flush_rewrite_rules();
    }
});
add_action('init', function () {
    if (!class_exists('Elementor\Plugin') || get_option('cb_elementor_native_video_added')) return;
    $id=(int)get_option('cb_elementor_fixture');
    if($id<1)return;
    $data=json_decode(get_post_meta($id,'_elementor_data',true),true);
    $data[0]['elements'][0]['elements'][]=['id'=>'testnativevideo','elType'=>'widget','widgetType'=>'video','settings'=>['video_type'=>'youtube','youtube_url'=>'https://www.youtube.com/watch?v=aqz-KE-bpKQ'],'elements'=>[]];
    update_post_meta($id,'_elementor_data',wp_slash(wp_json_encode($data)));
    update_option('cb_elementor_native_video_added',true);
    do_action('litespeed_purge_all');
});
add_action('init', function () {
    if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1' || !isset($_GET['cb_optimizer']) || !function_exists('rocket_valid_key')) return;
    $profile=sanitize_key($_GET['cb_optimizer']);
    update_option('wp_rocket_settings',array_merge(get_option('wp_rocket_settings',[]),[
        'minify_js'=>$profile!=='off',
        'minify_concatenate_js'=>in_array($profile,['combine','both'],true),
        'delay_js'=>in_array($profile,['delay','both'],true),
        'defer_all_js'=>0,
    ]));
    if(function_exists('rocket_clean_domain'))rocket_clean_domain();
});

add_action('init', function () {
    if (!class_exists('Elementor\\Plugin') || get_option('cb_elementor_fixture_layout_v2')) return;
    $id = (int) get_option('cb_elementor_fixture');
    if ($id < 1) return;
    $data = json_decode(get_post_meta($id, '_elementor_data', true), true);
    $data[0]['elements'][0]['settings']['_column_size'] = 100;
    $data[0]['elements'][0]['settings']['_inline_size'] = 100;
    update_post_meta($id, '_elementor_data', wp_slash(wp_json_encode($data)));
    delete_post_meta($id, '_elementor_element_cache');
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    update_option('cb_elementor_fixture_layout_v2', true);
});
add_action('wp_footer', function () {
    if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1' || !isset($_GET['cb_unknown'])) return;
    echo '<iframe title="unknown-vendor" src="https://unknown.vendor.test/embed"></iframe><script src="https://never-allowed.test/loader.js"></script>';
});

add_action('send_headers', function () {
    if (wp_parse_url(home_url(), PHP_URL_HOST) === '127.0.0.1' && isset($_GET['cb_extra_csp'])) {
        header("Content-Security-Policy: img-src 'self' data:", false);
    }
});

// Standard foreign plugin notices must remain available outside our panel.
add_action('admin_notices', function () {
    echo '<div class="notice notice-warning" id="cb-test-foreign-notice"><p>Cookie Banner test: foreign plugin notice.</p></div>';
});
add_action('all_admin_notices', function () {
    echo '<div class="notice notice-info" id="cb-test-foreign-global-notice"><p>Cookie Banner test: foreign global notice.</p></div>';
});
