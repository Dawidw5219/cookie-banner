<?php
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_NAME']='127.0.0.1';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
if(empty($argv[1]))exit(1);
require rtrim($argv[1],'/').'/wp-load.php';
if(wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1')throw new Exception('Local only');
$users=get_users(['role'=>'administrator','number'=>1]);wp_set_current_user($users[0]->ID);
$original=get_option('cookie4_button_style',null);
try{
 delete_option('cookie4_button_style');
 if(cookie4_build_config()['buttonStyle']!=='equal')throw new Exception('Wrong frontend default');
 $settings=rest_do_request(new WP_REST_Request('GET','/cookie4/v1/settings'))->get_data();
 if($settings['settings']['button_style']!=='equal')throw new Exception('Wrong settings default');
 foreach(['standard','equal'] as $mode){
  $request=new WP_REST_Request('PUT','/cookie4/v1/settings');$request->set_header('Content-Type','application/json');$request->set_body(wp_json_encode(['button_style'=>$mode]));
  $response=rest_do_request($request);if($response->get_status()!==200)throw new Exception('Save rejected');
  if(get_option('cookie4_button_style')!==$mode||cookie4_build_config()['buttonStyle']!==$mode)throw new Exception('Save not reflected in frontend');
 }
 echo "PASS WordPress strict default, authenticated REST saves both styles and frontend reads saved style\n";
}finally{if($original===null)delete_option('cookie4_button_style');else update_option('cookie4_button_style',$original);}
