<?php
if(empty($argv[1]))exit(1);
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_NAME']='127.0.0.1';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
require rtrim($argv[1],'/').'/wp-load.php';
if(wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1')throw new Exception('Local fixture only');
$original=get_option('cookie4_scanned_cookies',null);
$dictionary=json_decode(file_get_contents(COOKIE4_PLUGIN_DIR.'includes/translations.json'),true);
try{
 update_option('cookie4_scanned_cookies',[['name'=>'qa_cookie','platform'=>'QA provider','description'=>'QA purpose','retention'=>'Session','category'=>'Functional']]);
 foreach($dictionary as $lang=>$copy){
  $override=fn()=>$lang;add_filter('cookie4_request_language',$override);
  try{
   $link=cookie4_shortcode_preferences_link([]);$table=cookie4_shortcode_policy_table([]);
   foreach([$copy['policy']['name'],$copy['policy']['retention'],$copy['policy']['functional'],$copy['policy']['session']] as $text){if(!str_contains($table,esc_html($text)))throw new Exception('Missing translated shortcode '.$lang.': '.$text);}
   if(!str_contains($link,esc_html($copy['floatingIcon']['label'])))throw new Exception('Missing translated link '.$lang);
   echo "PASS $lang translated table headings, category, session retention and preference link\n";
  }finally{remove_filter('cookie4_request_language',$override);}
 }
}finally{if($original===null)delete_option('cookie4_scanned_cookies');else update_option('cookie4_scanned_cookies',$original,false);}
