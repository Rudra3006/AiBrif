<?php
/**
 * Minimal PHP smoke test — upload this alongside proxy.php and visit
 * https://AiBirf.com/api/test.php in your browser.
 *
 * - If you see "PHP IS WORKING" below, PHP execution is fine on this
 *   domain, and any remaining issue is inside proxy.php itself (in
 *   which case: re-check the file uploaded correctly and re-run
 *   api/proxy.php?health=1).
 * - If you instead see the raw text of this file (starting with
 *   "<?php"), PHP is NOT being executed for this domain/folder at
 *   all — that's a hosting configuration issue, not a code issue.
 *   Go to cPanel → MultiPHP Manager, find this domain, and assign it
 *   a PHP version (e.g. 8.1 or 8.2), then reload this page.
 */
header("Content-Type: text/plain; charset=utf-8");
echo "PHP IS WORKING\n";
echo "PHP version: " . phpversion() . "\n";
echo "curl extension loaded: " . (function_exists('curl_init') ? "yes" : "NO — ask your host to enable it") . "\n";
echo "Server time: " . date('c') . "\n";
