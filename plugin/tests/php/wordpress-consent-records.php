<?php
$root=$argv[1]??'';
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
require getenv('COOKIE4_TEST_WP_BOOTSTRAP') ?: rtrim($root,'/').'/wp-load.php';
if(wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1')throw new Exception('Isolated local fixture required');
function verify_record($ok,$message){if(!$ok)throw new Exception($message);echo "PASS $message\n";}
add_filter('cookie4_config', function($config){
 $config['lang']='zz';$config['controller']=['name'=>'Local QA'];$config['purposes']='Play requested videos';$config['privacyPolicyUrl']=home_url('/privacy/');
 $config['serviceDisclosures']=['youtube'=>['description'=>'Play requested video','privacyUrl'=>'https://policies.google.com/privacy','retention'=>'Session']];return $config;
});
cookie4_install_receipts();
update_option('cookie4_receipts_schema','1',false);cookie4_install_receipts();
verify_record(get_option('cookie4_receipts_schema')==='2','existing receipt schema upgrades to transactional bounded storage');
$id=wp_generate_uuid4();$config=cookie4_build_config();
$body=['id'=>$id,'version'=>$config['noticeVersion'],'categories'=>['essential'=>true,'analytics'=>false,'marketing'=>false],'services'=>['youtube'=>true]];
function request_record($body){$request=new WP_REST_Request('POST','/cookie4/v1/consent-receipts');$request->set_header('content-type','application/json');$request->set_body(wp_json_encode($body));return cookie4_record_consent($request);}
global $wpdb;$table=cookie4_receipts_table();
try{
 $result=request_record($body);verify_record(!is_wp_error($result),'valid consent record retained'.(is_wp_error($result)?': '.$result->get_error_code().' '.$result->get_error_message():''));
 $route=new WP_REST_Request('POST','/cookie4/v1/consent-receipts');$route->set_header('content-type','application/json');$route->set_body(wp_json_encode($body));
 verify_record(rest_do_request($route)->get_status()>=400,'REST route rejects missing nonce');
 $route->set_header('X-WP-Nonce',wp_create_nonce('wp_rest'));
 verify_record(rest_do_request($route)->get_status()===200,'REST route accepts public nonce and valid receipt');
 $export=new WP_REST_Request('GET','/cookie4/v1/consent-receipts');verify_record(rest_do_request($export)->get_status()>=400,'anonymous client cannot export consent records');
 $stored=$wpdb->get_var($wpdb->prepare("SELECT receipt FROM $table WHERE id=%s",$id));
 verify_record(json_decode($stored,true)['services']['youtube']===true,'provider choice is in the server record');
 $duplicate=$body;$duplicate['services']['youtube']=false;request_record($duplicate);
 verify_record($wpdb->get_var($wpdb->prepare("SELECT receipt FROM $table WHERE id=%s",$id))===$stored,'a repeated receipt ID cannot rewrite evidence');
 $invalid=$body;$invalid['version']='outdated';verify_record(is_wp_error(request_record($invalid)),'outdated notice record rejected');
 $invalid=$body;$invalid['services']=['external-unreviewed.test'=>true];verify_record(is_wp_error(request_record($invalid)),'undisclosed provider grant rejected');
 $invalid=$body;$invalid['categories']['analytics']='yes';verify_record(is_wp_error(request_record($invalid)),'non-boolean category rejected');
 $invalid=$body;$invalid['categories']['extra']=['nested'=>str_repeat('x',3000)];verify_record(is_wp_error(request_record($invalid)),'unknown category including nested payload rejected');
 $invalid=$body;$invalid['categories']='essential';verify_record(is_wp_error(request_record($invalid)),'scalar categories rejected without PHP error');
 $invalid=$body;$invalid['categories']['essential']=false;verify_record(is_wp_error(request_record($invalid)),'essential false rejected');
 $limit=fn()=>1;add_filter('cookie4_receipt_max_records',$limit);
 $invalid=$body;$invalid['id']=wp_generate_uuid4();
 verify_record(is_wp_error(request_record($invalid)),'global retained-record ceiling blocks new UUIDs');
 verify_record(!is_wp_error(request_record($body)),'existing receipt remains idempotent at capacity');
 remove_filter('cookie4_receipt_max_records',$limit);
 $bucket=hexdec(substr(hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'local',wp_salt('nonce')),0,2));
 $budget=$table.'_budget';$row=$wpdb->get_row($wpdb->prepare("SELECT * FROM $budget WHERE name=%s",'ip_'.$bucket),ARRAY_A);
 $wpdb->update($budget,['window_id'=>(int)floor(time()/60),'used'=>120],['name'=>'ip_'.$bucket]);
 verify_record(is_wp_error(request_record($body)),'atomic per-bucket quota rejects excessive requests');
 if($row)$wpdb->update($budget,$row,['name'=>'ip_'.$bucket]);
 $wpdb->update($table,['recorded_at'=>gmdate('Y-m-d H:i:s',time()-181*DAY_IN_SECONDS)],['id'=>$id]);
 cookie4_expire_receipts();verify_record(!$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%s",$id)),'expired evidence is deleted at the configured retention limit');
 verify_record((bool)wp_next_scheduled('cookie4_expire_receipts'),'daily evidence expiry is scheduled');
 // A full store containing only expired evidence must recover without WP-Cron.
 $fresh=$body;$fresh['id']=wp_generate_uuid4();$max=(int)$wpdb->get_var("SELECT used FROM $budget WHERE name='capacity'")+1;
 $limit=fn()=>$max;add_filter('cookie4_receipt_max_records',$limit);
 verify_record(!is_wp_error(request_record($fresh)),'remaining capacity accepts an ordinary record');
 $wpdb->update($table,['recorded_at'=>gmdate('Y-m-d H:i:s',time()-181*DAY_IN_SECONDS)],['id'=>$fresh['id']]);
 $next=$body;$next['id']=wp_generate_uuid4();
 try{verify_record(!is_wp_error(request_record($next)),'at-capacity expiry makes room without waiting for cron');}
 finally{$deleted=$wpdb->delete($table,['id'=>$next['id']]);if($deleted)cookie4_receipt_release_capacity($deleted);$wpdb->delete($table,['id'=>$fresh['id']]);remove_filter('cookie4_receipt_max_records',$limit);}

}finally{$deleted=$wpdb->delete($table,['id'=>$id]);if($deleted)cookie4_receipt_release_capacity($deleted);}
