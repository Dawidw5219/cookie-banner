<?php
$_SERVER['HTTP_HOST']='127.0.0.1:9403';$_SERVER['SERVER_PORT']='9403';$_SERVER['REQUEST_URI']='/';
require getenv('COOKIE4_TEST_WP_BOOTSTRAP') ?: rtrim($argv[1]??'','/').'/wp-load.php';
if(wp_parse_url(home_url(),PHP_URL_HOST)!=='127.0.0.1')throw new Exception('Isolated localhost fixture required');
cookie4_install_receipts();
if(($argv[2]??'')==='crash-worker'){
 global $wpdb;$wpdb->query('START TRANSACTION');
 if(!cookie4_receipt_reserve('capacity',0,100000))exit(2);
 exit; // Connection closes without COMMIT, as with a terminated worker.
}
if(($argv[2]??'')==='capacity-worker'){
 $wins=0;for($i=0;$i<20;$i++){
  $record=['id'=>wp_generate_uuid4(),'version'=>$argv[3]];
  if(cookie4_insert_receipt($record,'{}',(int)$argv[4])===1)$wins++;
 }
 echo $wins;exit;
}
if(($argv[2]??'')==='worker'){
 $wins=0;for($i=0;$i<20;$i++)if(cookie4_receipt_reserve('qa_parallel',123,17))$wins++;
 echo $wins;exit;
}
global $wpdb;$table=cookie4_receipts_table().'_budget';$wpdb->delete($table,['name'=>'qa_parallel']);
$workers=[];
try {
 for($i=0;$i<8;$i++){
  $pipes=[];$process=proc_open([PHP_BINARY,__FILE__,$argv[1],'worker'],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
  if(!is_resource($process))throw new Exception('Could not start concurrent worker');
  fclose($pipes[0]);$workers[]=[$process,$pipes];
 }
 $total=0;foreach($workers as [$process,$pipes]){
  $out=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
  if(proc_close($process)!==0||!ctype_digit($out))throw new Exception('Worker failure: '.$error.$out);
  $total+=(int)$out;
 }
 if($total!==17)throw new Exception('Concurrent reservations bypassed quota: '.$total);
 echo "PASS 160 attempts in 8 concurrent PHP workers: exactly 17 atomic reservations\n";
 if(!cookie4_receipt_reserve('qa_parallel',124,17))throw new Exception('Next fixed window did not reset');
 echo "PASS next window can accept legitimate traffic\n";
 if(cookie4_receipt_reserve('qa_parallel',123,17))throw new Exception('A stale window rewound the counter');
 for($i=0;$i<16;$i++)if(!cookie4_receipt_reserve('qa_parallel',124,17))throw new Exception('Current window rejected valid reservation');
 if(cookie4_receipt_reserve('qa_parallel',124,17))throw new Exception('Window was reset by stale request');
 echo "PASS stale requests cannot rewind or reset the current window\n";
 $before=(int)$wpdb->get_var("SELECT used FROM $table WHERE name='capacity'");
 $wpdb->query('START TRANSACTION');cookie4_receipt_reserve('capacity',0,$before+10);$wpdb->query('ROLLBACK');
 if((int)$wpdb->get_var("SELECT used FROM $table WHERE name='capacity'")!==$before)throw new Exception('Rolled-back reservation leaked storage capacity');
 echo "PASS interrupted transaction does not consume storage capacity\n";
 $pipes=[];$process=proc_open([PHP_BINARY,__FILE__,$argv[1],'crash-worker'],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
 if(!is_resource($process))throw new Exception('Crash worker did not start');fclose($pipes[0]);
 $out=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
 if(proc_close($process)!==0||$out!==''||$error!=='')throw new Exception('Crash worker failed: '.$error.$out);
 if((int)$wpdb->get_var("SELECT used FROM $table WHERE name='capacity'")!==$before)throw new Exception('Worker disconnect leaked capacity');
 echo "PASS worker exit without commit rolls back its capacity reservation\n";

 $receipt_table=cookie4_receipts_table();$version='qa-concurrency-'.wp_generate_uuid4();
 $limit=(int)$wpdb->get_var("SELECT COUNT(*) FROM $receipt_table")+17;$parallel=[];
 try {
  for($i=0;$i<8;$i++){
   $pipes=[];$process=proc_open([PHP_BINARY,__FILE__,$argv[1],'capacity-worker',$version,(string)$limit],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
   if(!is_resource($process))throw new Exception('Capacity worker failed to start');fclose($pipes[0]);$parallel[]=[$process,$pipes];
  }
  $writes=0;foreach($parallel as [$process,$pipes]){
   $out=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
   if(proc_close($process)!==0||!ctype_digit($out))throw new Exception('Capacity worker failure: '.$error.$out);$writes+=(int)$out;
  }
  if($writes!==17)throw new Exception('Parallel inserts exceeded or lost capacity: '.$writes);
  if((int)$wpdb->get_var("SELECT used FROM $table WHERE name='capacity'")!==(int)$wpdb->get_var("SELECT COUNT(*) FROM $receipt_table"))throw new Exception('Capacity drifted from actual evidence');
  echo "PASS 160 concurrent inserts: exactly 17 records, budget equals retained rows\n";
 }finally{$deleted=$wpdb->delete($receipt_table,['notice_version'=>$version]);if($deleted)cookie4_receipt_release_capacity($deleted);}

}finally{$wpdb->delete($table,['name'=>'qa_parallel']);}
