<?php
header('Content-Type: text/plain');
header('X-LiteSpeed-Cache-Control: public,max-age=120');
header('Cache-Control: public,max-age=120');
header('X-LiteSpeed-Tag: cookie-banner-test-probe');
echo 'cache-capability-probe:' . microtime(true);
