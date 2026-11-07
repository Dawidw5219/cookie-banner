<?php
$root=$argv[1]??'';
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
require rtrim($root,'/').'/wp-load.php';
if(wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1')throw new Exception('Isolated local fixture required');
function verify_record($ok,$message){if(!$ok)throw new Exception($message);echo "PASS $message\n";}
cookie4_install_receipts();
$id=wp_generate_uuid4();$config=cookie4_build_config();
$body=['id'=>$id,'version'=>$config['noticeVersion'],'categories'=>['essential'=>true,'analytics'=>false,'marketing'=>false],'services'=>['youtube'=>true]];
function request_record($body){$request=new WP_REST_Request('POST','/cookie4/v1/consent-receipts');$request->set_header('content-type','application/json');$request->set_body(wp_json_encode($body));return cookie4_record_consent($request);}
global $wpdb;$table=cookie4_receipts_table();
try{
 $result=request_record($body);verify_record(!is_wp_error($result),'valid consent record retained');
 $stored=$wpdb->get_var($wpdb->prepare("SELECT receipt FROM $table WHERE id=%s",$id));
 verify_record(json_decode($stored,true)['services']['youtube']===true,'provider choice is in the server record');
 $duplicate=$body;$duplicate['services']['youtube']=false;request_record($duplicate);
 verify_record($wpdb->get_var($wpdb->prepare("SELECT receipt FROM $table WHERE id=%s",$id))===$stored,'a repeated receipt ID cannot rewrite evidence');
 $invalid=$body;$invalid['version']='outdated';verify_record(is_wp_error(request_record($invalid)),'outdated notice record rejected');
 $invalid=$body;$invalid['services']=['external-unreviewed.test'=>true];verify_record(is_wp_error(request_record($invalid)),'undisclosed provider grant rejected');
 $invalid=$body;$invalid['categories']['analytics']='yes';verify_record(is_wp_error(request_record($invalid)),'non-boolean category rejected');
 $rate='cookie4_receipt_rate_'.hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'local',wp_salt('nonce'));
 $before=get_transient($rate);set_transient($rate,120,MINUTE_IN_SECONDS);
 verify_record(is_wp_error(request_record($body)),'excessive public receipt writes are rate limited');
 if($before===false)delete_transient($rate);else set_transient($rate,$before,MINUTE_IN_SECONDS);
 $wpdb->update($table,['recorded_at'=>gmdate('Y-m-d H:i:s',time()-181*DAY_IN_SECONDS)],['id'=>$id]);
 cookie4_expire_receipts();verify_record(!$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%s",$id)),'expired evidence is deleted at the configured retention limit');
 verify_record((bool)wp_next_scheduled('cookie4_expire_receipts'),'daily evidence expiry is scheduled');
}finally{$wpdb->delete($table,['id'=>$id]);}
