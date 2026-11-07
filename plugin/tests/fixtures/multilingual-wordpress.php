<?php
// Local, reversible Polylang integration fixture. Keep backup private outside the repo.
if (empty($argv[1]) || empty($argv[2])) { exit(1); }
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_NAME']='127.0.0.1';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
if ($argv[2]==='configure' || $argv[2]==='restore') { define('WP_ADMIN',true); }
require rtrim($argv[1],'/').'/wp-load.php';
if (wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1') { throw new Exception('Local fixture only'); }
$file='/tmp/cb-multilingual-options.json';
$keys=['cookie4_variant','permalink_structure','active_plugins','polylang','WPLANG','cookie4_lang','cookie4_controller_name','cookie4_purposes','cookie4_privacy_policy_url','cookie4_custom_texts','cookie4_service_disclosures','cookie4_localizations'];
if ($argv[2]==='activate') {
 if(file_exists($file))throw new Exception('Restore previous fixture first');
 $backup=['options'=>[],'pages'=>[],'languages'=>[]];foreach($keys as $key)$backup['options'][$key]=get_option($key,null);
 file_put_contents($file,wp_json_encode($backup));chmod($file,0600);
 require_once ABSPATH.'wp-admin/includes/plugin.php';
 $result=activate_plugin('polylang/polylang.php');if(is_wp_error($result))throw new Exception($result->get_error_message());
 echo "Activated official Polylang; private backup retained\n";exit;
}
$backup=json_decode(file_get_contents($file),true);
if($argv[2]==='restore') {
 foreach($backup['pages'] as $id)wp_delete_post($id,true);
 foreach($backup['languages'] as $id)PLL()->model->languages->delete($id);
 foreach($backup['options'] as $key=>$value){if($value===null)delete_option($key);else update_option($key,$value,false);}
 unlink($file);echo "Restored original options, removed fixture pages/languages\n";exit;
}
if($argv[2]!=='configure')exit(1);
foreach(['en'=>'en_US','pl'=>'pl_PL','de'=>'de_DE'] as $slug=>$locale){
 $lang=PLL()->model->get_language($slug);
 if(!$lang){$lang=PLL()->model->languages->add(['slug'=>$slug,'locale'=>$locale,'name'=>$slug,'rtl'=>false,'no_default_cat'=>true]);if(is_wp_error($lang))throw new Exception($lang->get_error_message());$backup['languages'][]=$lang->term_id;file_put_contents($file,wp_json_encode($backup));}
}
update_option('permalink_structure', '');
flush_rewrite_rules(false);
PLL()->options['default_lang']='en';PLL()->options['force_lang']=0;PLL()->options['browser']=0;PLL()->options->save();
wp_set_current_user(1);
$pages=[];$policies=[];
foreach(['en','pl','de'] as $lang){
 $id=wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_title'=>'Multilingual privacy '.$lang,'post_content'=>'Policy '.$lang]);pll_set_post_language($id,$lang);$policies[$lang]=$id;$backup['pages'][]=$id;
 $page=wp_insert_post(['post_type'=>'page','post_status'=>'publish','post_title'=>'Multilingual consent '.$lang,'post_content'=>'<p>Language integration test</p><iframe hidden data-cb-service="youtube" data-cb-src="https://www.youtube.com/embed/multilingual-probe" title="Video"></iframe>']);pll_set_post_language($page,$lang);$pages[$lang]=$page;$backup['pages'][]=$page;
 file_put_contents($file,wp_json_encode($backup));
}
pll_save_post_translations($pages);pll_save_post_translations($policies);
update_option('cookie4_variant','modal');update_option('cookie4_lang','auto');update_option('cookie4_controller_name','QA controller');update_option('cookie4_purposes','QA base purpose');update_option('cookie4_privacy_policy_url',get_permalink($policies['en']));
update_option('cookie4_custom_texts','');update_option('cookie4_service_disclosures',['youtube'=>['description'=>'Video source','privacyUrl'=>'https://policies.google.com/privacy','retention'=>'Session']]);
$locales=[];foreach(['en','pl','de'] as $lang)$locales[$lang]=['purposes'=>'Purpose '.$lang,'customTexts'=>['overlay.title'=>'Banner '.$lang],'serviceDisclosures'=>['youtube'=>['description'=>'Video '.$lang,'retention'=>'Retention '.$lang]]];
update_option('cookie4_localizations',wp_json_encode($locales));
cookie4_register_translatable_content();
$mo = new PLL_MO();$german = PLL()->model->get_language('de');$mo->import_from_db($german);
$mo->add_entry(['singular' => 'QA controller', 'translations' => ['Verantwortlicher aus Polylang']]);$mo->export_to_db($german);
$backup['testPages']=$pages;$backup['testPolicies']=$policies;file_put_contents($file,wp_json_encode($backup));
echo "Configured EN/PL/DE translated pages and privacy pages\n";
