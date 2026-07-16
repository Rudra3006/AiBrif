<?php
/**
 * AiBirf Market Pulse — data proxy
 * ---------------------------------
 * Fetches quote + historical data from Yahoo Finance's public chart
 * endpoint server-side (so the browser never hits a cross-origin
 * request) and returns a small, clean JSON payload to the frontend.
 *
 * No API key, no signup, no cost. Works on any host with PHP + cURL
 * (standard on virtually all shared hosting: cPanel, Hostinger, etc.)
 *
 * Usage from the frontend:
 *   GET /api/proxy.php?symbol=RELIANCE.NS&range=6mo&interval=1d
 *
 * NOTE: Yahoo's endpoint is undocumented/unofficial. It is widely used
 * for personal & educational projects but can change or rate-limit
 * without notice. If it ever stops responding, swap in a paid
 * provider (e.g. Twelve Data) by editing fetchYahoo() below.
 */

header("Content-Type: application/json; charset=utf-8");
// Only allow this proxy to be called from pages on the same site.
// If your frontend lives on a different subdomain, adjust this.
header("Access-Control-Allow-Origin: *");

$symbol   = isset($_GET['symbol'])   ? preg_replace('/[^A-Za-z0-9\.\^=\-]/', '', $_GET['symbol']) : '';
$range    = isset($_GET['range'])    ? preg_replace('/[^a-z0-9]/', '', $_GET['range'])    : '6mo';
$interval = isset($_GET['interval']) ? preg_replace('/[^a-z0-9]/', '', $_GET['interval']) : '1d';

if (!$symbol) {
    http_response_code(400);
    echo json_encode(["error" => "Missing symbol parameter"]);
    exit;
}

// ---- Tiny file-based cache (60 seconds) to be gentle on Yahoo & speed up repeat loads ----
$cacheDir = __DIR__ . '/_cache';
if (!is_dir($cacheDir)) { @mkdir($cacheDir, 0755, true); }
$cacheKey  = md5($symbol . $range . $interval);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheTtl  = 60; // seconds

if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    echo file_get_contents($cacheFile);
    exit;
}

$result = fetchYahoo($symbol, $range, $interval);

if ($result === null) {
    // Serve stale cache rather than nothing, if we have it.
    if (file_exists($cacheFile)) {
        echo file_get_contents($cacheFile);
        exit;
    }
    http_response_code(502);
    echo json_encode(["error" => "Upstream data source unavailable for $symbol"]);
    exit;
}

file_put_contents($cacheFile, json_encode($result));
echo json_encode($result);


function fetchYahoo($symbol, $range, $interval) {
    $url = "https://query1.finance.yahoo.com/v8/finance/chart/"
         . rawurlencode($symbol)
         . "?range={$range}&interval={$interval}&includePrePost=false";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_USERAGENT      => "Mozilla/5.0 (compatible; AiBirfMarketPulse/1.0)",
        CURLOPT_HTTPHEADER     => ["Accept: application/json"],
    ]);
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$raw || $status !== 200) return null;

    $data = json_decode($raw, true);
    $result = $data['chart']['result'][0] ?? null;
    if (!$result) return null;

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
