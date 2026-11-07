<?php
// Integration contract test against a real isolated WP, with WPML's documented filters.
if (empty($argv[1])) { exit(1); }
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_NAME']='127.0.0.1';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
require rtrim($argv[1],'/').'/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') { throw new Exception('Local fixture only'); }
if (function_exists('pll_current_language')) { throw new Exception('Run WPML filter test with Polylang inactive'); }
$keys=['cookie4_lang','cookie4_controller_name','cookie4_purposes','cookie4_privacy_policy_url','cookie4_custom_texts','cookie4_service_disclosures','cookie4_localizations'];
$backup=[];foreach($keys as $key){$backup[$key]=get_option($key,null);}
function multi_check($ok,$label){if(!$ok)throw new Exception($label);echo "PASS $label\n";}
$lang='de';$registered=[];
$language_filter=function()use(&$lang){return $lang;};
$translate=function($value,$domain,$name,$language){return $name==='purposes' ? 'Zweck aus WPML' : ($name==='customTexts.overlay.title' ? 'Titel aus WPML' : $value);};
$register=function($domain,$name,$value)use(&$registered){$registered[$name]=$value;};
add_filter('wpml_current_language',$language_filter);
add_filter('wpml_translate_single_string',$translate,10,4);
add_action('wpml_register_single_string',$register,10,3);
try{
 update_option('cookie4_lang','auto');update_option('cookie4_controller_name','QA Controller');update_option('cookie4_purposes','Source purpose');update_option('cookie4_privacy_policy_url',home_url('/privacy'));
 update_option('cookie4_custom_texts',wp_json_encode(['overlay.title'=>'Source title']));
 update_option('cookie4_service_disclosures',['youtube'=>['description'=>'Source video','privacyUrl'=>'https://policies.google.com/privacy','retention'=>'Session','cleanup'=>['cookies'=>['exact_cookie']]]]);
 update_option('cookie4_localizations','{}');
 cookie4_register_translatable_content();
 multi_check(isset($registered['purposes'],$registered['customTexts.overlay.title'],$registered['serviceDisclosures.youtube.retention']),'WPML source strings registered with stable names');
 $config=cookie4_build_config();
 multi_check($config['lang']==='de' && $config['purposes']==='Zweck aus WPML' && $config['customTexts']['overlay']['title']==='Titel aus WPML','WPML current-language and string translation filters used');
 multi_check($config['serviceDisclosures']->youtube['cleanup']['cookies']===['exact_cookie'],'translation does not alter cleanup identifiers');
 $version=$config['noticeVersion'];$lang='fr';
 multi_check(cookie4_build_config()['noticeVersion']!==$version,'different displayed language has a different evidence/CSP version');
 $payload=['de'=>['purposes'=>'Lokaler Zweck','privacyPolicyUrl'=>home_url('/de/datenschutz'),'customTexts'=>['content.allowPlay'=>'Video erlauben'],'serviceDisclosures'=>['youtube'=>['description'=>'Lokales Video','retention'=>'Eine Sitzung']]],'de-DE'=>['controller'=>['name'=>'Lokaler Verantwortlicher']]];
 $validated=cookie4_validate_localizations(wp_json_encode($payload));multi_check(!is_wp_error($validated),'regional language payload accepted');
 update_option('cookie4_localizations',$validated);$lang='de-DE';$config=cookie4_build_config();
 multi_check($config['controller']['name']==='Lokaler Verantwortlicher' && $config['purposes']==='Lokaler Zweck' && $config['privacyPolicyUrl']===home_url('/de/datenschutz'),'base and regional content override translated source values');
 multi_check($config['customTexts']['content']['allowPlay']==='Video erlauben' && $config['serviceDisclosures']->youtube['description']==='Lokales Video','blocker overrides and service disclosures localized');
 foreach(['[]','{"de":{"privacyPolicyUrl":"javascript:alert(1)"}}','{"de":{"scripts":[]}}','{"de":{"controller":"bad"}}','{"de":{"purposes":[]}}','{"de":{"customTexts":{"__proto__":"bad"}}}','{"de":{"serviceDisclosures":{"youtube":{"urls":["https://bad.test"]}}}}'] as $bad){multi_check(is_wp_error(cookie4_validate_localizations($bad)),'reject malformed or unsafe locale data');}
 $request=new WP_REST_Request('PUT','/cookie4/v1/settings');$request->set_header('Content-Type','application/json');$request->set_body(wp_json_encode(['purposes'=>'Must not save','localizations'=>'broken']));
 multi_check(is_wp_error(cookie4_rest_put_settings($request)) && get_option('cookie4_purposes')==='Source purpose','invalid translation save is atomic');
 update_option('cookie4_lang','pl');multi_check(cookie4_build_config()['lang']==='pl','explicit language selection overrides automatic page language');
 echo "WPML adapter contracts verified; this does not claim an installed WPML plugin was tested.\n";
}finally{
 foreach($backup as $key=>$value){if($value===null)delete_option($key);else update_option($key,$value,false);}
 remove_filter('wpml_current_language',$language_filter);remove_filter('wpml_translate_single_string',$translate);remove_action('wpml_register_single_string',$register);
}
