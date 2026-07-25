<?php
/**
 * AiBirf Market Pulse — data proxy
 * ---------------------------------
 * Fetches quote + historical data from Yahoo Finance's public chart
 * endpoint server-side (so the browser never hits a cross-origin
 * request) and returns a small, clean JSON payload to the frontend.
 *
 * v2 — IMPORTANT FIX: Yahoo now blocks most chart requests coming from
 * server/datacenter IPs unless they carry a valid session cookie + a
 * "crumb" token. Without it you get a 401/999 response on nearly every
 * shared host, which looks like "nothing ever loads". This version
 * fetches and caches that cookie+crumb pair automatically and retries
 * once if Yahoo invalidates it. See getCrumb() below.
 *
 * Usage from the frontend:
 *   GET /api/proxy.php?symbol=RELIANCE.NS&range=6mo&interval=1d
 *
 * Diagnostics (open directly in your browser to debug your host):
 *   GET /api/proxy.php?health=1
 *
 * NOTE: Yahoo's endpoint is undocumented/unofficial. It is widely used
 * for personal & educational projects but can change or rate-limit
 * without notice. If it ever stops responding entirely, swap in a paid
 * provider (e.g. Twelve Data) by editing fetchYahoo() below.
 */

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

$cacheDir = __DIR__ . '/_cache';
if (!is_dir($cacheDir)) { @mkdir($cacheDir, 0755, true); }

// ---------------------------------------------------------------
// Health check mode: /api/proxy.php?health=1
// Diagnoses the most common causes of "nothing loads" without
// needing to open the browser console on a phone, etc.
// ---------------------------------------------------------------
if (isset($_GET['health'])) {
    $checks = [];

    $checks['curl_extension_loaded'] = function_exists('curl_init');
    $checks['cache_dir_writable']    = is_writable($cacheDir);

    $crumbInfo = getCrumb($cacheDir, true /* forceReport */);
    $checks['cookie_crumb_obtained'] = $crumbInfo['ok'];
    $checks['cookie_crumb_detail']   = $crumbInfo['detail'];

    $testSymbol = 'RELIANCE.NS';
    $test = fetchYahoo($testSymbol, '5d', '1d', $cacheDir, $debug);
    $checks['test_symbol'] = $testSymbol;
    $checks['test_fetch_ok'] = ($test !== null);
    $checks['test_fetch_debug'] = $debug;

    echo json_encode(["health_check" => $checks, "generated_at" => date('c')], JSON_PRETTY_PRINT);
    exit;
}

$symbol   = isset($_GET['symbol'])   ? preg_replace('/[^A-Za-z0-9\.\^=\-]/', '', $_GET['symbol']) : '';
$range    = isset($_GET['range'])    ? preg_replace('/[^a-z0-9]/', '', $_GET['range'])    : '6mo';
$interval = isset($_GET['interval']) ? preg_replace('/[^a-z0-9]/', '', $_GET['interval']) : '1d';

if (!$symbol) {
    http_response_code(400);
    echo json_encode(["error" => "Missing symbol parameter"]);
    exit;
}

// ---- Tiny file-based cache (60 seconds) to be gentle on Yahoo & speed up repeat loads ----
$cacheKey  = md5($symbol . $range . $interval);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheTtl  = 60; // seconds

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    echo file_get_contents($cacheFile);
    exit;
}

$debug = null;
$result = fetchYahoo($symbol, $range, $interval, $cacheDir, $debug);

if ($result === null) {
    // Serve stale cache rather than nothing, if we have it.
    if (file_exists($cacheFile)) {
        echo file_get_contents($cacheFile);
        exit;
    }
    http_response_code(502);
    echo json_encode([
        "error" => "Upstream data source unavailable for $symbol",
        "debug" => $debug, // safe to expose: no secrets, just HTTP status/reason
        "hint"  => "Open api/proxy.php?health=1 in your browser to diagnose."
    ]);
    exit;
}

file_put_contents($cacheFile, json_encode($result));
echo json_encode($result);


/**
 * Gets (and caches) a Yahoo session cookie + crumb token.
 * Yahoo requires this pairing for most chart requests originating
 * from server IPs. Cached for 12 hours; regenerated on demand if a
 * chart request later comes back 401/999 (see fetchYahoo()).
 */
function getCrumb($cacheDir, $forceReport = false) {
    $cookieJar = $cacheDir . '/cookies.txt';
    $crumbFile = $cacheDir . '/crumb.json';
    $ttl = 12 * 3600;

    if (!$forceReport && file_exists($crumbFile) && (time() - filemtime($crumbFile) < $ttl)) {
        $cached = json_decode(file_get_contents($crumbFile), true);
        if (!empty($cached['crumb'])) {
            return ['ok' => true, 'crumb' => $cached['crumb'], 'cookieJar' => $cookieJar, 'detail' => 'cached'];
        }
    }

    return refreshCrumb($cacheDir);
}

function refreshCrumb($cacheDir) {
    $cookieJar = $cacheDir . '/cookies.txt';
    $crumbFile = $cacheDir . '/crumb.json';

    if (!function_exists('curl_init')) {
        return ['ok' => false, 'crumb' => null, 'cookieJar' => $cookieJar, 'detail' => 'curl extension not available on this host'];
    }

    // Step 1: hit a Yahoo page to establish session cookies.
    $ch = curl_init('https://fc.yahoo.com');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_COOKIEJAR      => $cookieJar,
        CURLOPT_COOKIEFILE     => $cookieJar,
        CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Step 2: request the crumb using those cookies.
    $ch = curl_init('https://query2.finance.yahoo.com/v1/test/getcrumb');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_COOKIEJAR      => $cookieJar,
        CURLOPT_COOKIEFILE     => $cookieJar,
        CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    ]);
    $crumb = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    $crumb = is_string($crumb) ? trim($crumb) : '';

    if ($status === 200 && $crumb !== '' && strlen($crumb) < 40 && strpos($crumb, '<') === false) {
        file_put_contents($crumbFile, json_encode(['crumb' => $crumb, 'fetchedAt' => time()]));
        return ['ok' => true, 'crumb' => $crumb, 'cookieJar' => $cookieJar, 'detail' => "obtained fresh crumb (HTTP $status)"];
    }

    return [
        'ok' => false,
        'crumb' => null,
        'cookieJar' => $cookieJar,
        'detail' => "failed to obtain crumb — HTTP $status" . ($err ? ", curl error: $err" : '') . " — outbound HTTPS from this host to Yahoo may be blocked; contact your hosting provider."
    ];
}

function fetchYahoo($symbol, $range, $interval, $cacheDir, &$debug = null) {
    $crumbInfo = getCrumb($cacheDir);

    // Attempt 1: with crumb + cookie (what Yahoo expects from server IPs today).
    // Attempt 2 (fallback): plain request, in case this host's IP doesn't need one.
    $attempts = [];
    if ($crumbInfo['ok']) {
        $attempts[] = ['useCrumb' => true, 'crumb' => $crumbInfo['crumb'], 'cookieJar' => $crumbInfo['cookieJar']];
    }
    $attempts[] = ['useCrumb' => false];

    foreach ($attempts as $i => $attempt) {
        $base = "https://query2.finance.yahoo.com/v8/finance/chart/" . rawurlencode($symbol);
        $url = $base . "?range={$range}&interval={$interval}&includePrePost=false";
        if (!empty($attempt['useCrumb'])) {
            $url .= "&crumb=" . rawurlencode($attempt['crumb']);
        }

        $curlOpts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            CURLOPT_HTTPHEADER     => ["Accept: application/json"],
        ];
        if (!empty($attempt['useCrumb'])) {
            $curlOpts[CURLOPT_COOKIEFILE] = $attempt['cookieJar'];
            $curlOpts[CURLOPT_COOKIEJAR]  = $attempt['cookieJar'];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, $curlOpts);
        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($raw && $status === 200) {
            $data = json_decode($raw, true);
            $result = $data['chart']['result'][0] ?? null;
            if ($result) {
                return buildPayload($result, $symbol);
            }
        }

        $debug = "attempt " . ($i + 1) . " (" . (!empty($attempt['useCrumb']) ? 'with crumb' : 'no crumb') . "): HTTP $status" . ($err ? ", curl error: $err" : '');

        // If crumb attempt failed with auth-style status, refresh crumb once for next call.
        if (!empty($attempt['useCrumb']) && in_array($status, [401, 403, 999])) {
            refreshCrumb($cacheDir);
        }
    }

    return null;
}

function buildPayload($result, $symbol) {
    $meta = $result['meta'] ?? [];
    $timestamps = $result['timestamp'] ?? [];
    $quote = $result['indicators']['quote'][0] ?? [];

    // Build clean, aligned arrays (drop nulls that Yahoo sometimes injects for holidays)
    $closes = []; $opens = []; $highs = []; $lows = []; $volumes = []; $times = [];
    foreach ($timestamps as $i => $t) {
        if (!isset($quote['close'][$i]) || $quote['close'][$i] === null) continue;
        $times[]    = $t;
        $opens[]    = $quote['open'][$i]   ?? null;
        $highs[]    = $quote['high'][$i]   ?? null;
        $lows[]     = $quote['low'][$i]    ?? null;
        $closes[]   = $quote['close'][$i];
        $volumes[]  = $quote['volume'][$i] ?? null;
    }

    return [
        "symbol"        => $meta['symbol'] ?? $symbol,
        "currency"      => $meta['currency'] ?? "INR",
        "regularPrice"  => $meta['regularMarketPrice'] ?? end($closes),
        "previousClose" => $meta['chartPreviousClose'] ?? ($meta['previousClose'] ?? null),
        "exchangeName"  => $meta['exchangeName'] ?? "",
        "timestamps"    => $times,
        "opens"         => $opens,
        "highs"         => $highs,
        "lows"          => $lows,
        "closes"        => $closes,
        "volumes"       => $volumes,
        "fetchedAt"     => time(),
    ];
}
