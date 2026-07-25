/* =========================================================
   AiBirf Market Pulse — API layer
   Wraps calls to api/proxy.php with basic error handling.
   ========================================================= */
const AiBirfAPI = (function () {

  let lastError = null; // most recent failure message, surfaced by main.js if EVERY fetch fails

  async function fetchSeries(yahooSymbol, { range = "6mo", interval = "1d" } = {}) {
    const url = `${APP_CONFIG.PROXY_URL}?symbol=${encodeURIComponent(yahooSymbol)}&range=${range}&interval=${interval}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        const msg = (data && data.error) ? data.error : `Proxy returned HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      lastError = err.message || String(err);
      console.error(`[AiBirfAPI] Failed to fetch ${yahooSymbol}:`, lastError);
      return null;
    }
  }

  function getLastError() {
    return lastError;
  }

  // Convenience: fetch just enough history for indicators + forecast.
  function fetchQuoteWithHistory(yahooSymbol) {
    return fetchSeries(yahooSymbol, { range: "1y", interval: "1d" });
  }

  // Lighter call for index ticker / commodity strip (less history needed).
  function fetchQuoteLite(yahooSymbol) {
    return fetchSeries(yahooSymbol, { range: "5d", interval: "1d" });
  }

  return { fetchSeries, fetchQuoteWithHistory, fetchQuoteLite, getLastError };
})();
