/* =========================================================
   AiBirf Market Pulse — API layer
   Wraps calls to api/proxy.php with basic error handling.
   ========================================================= */
const AiBirfAPI = (function () {

  async function fetchSeries(yahooSymbol, { range = "6mo", interval = "1d" } = {}) {
    const url = `${APP_CONFIG.PROXY_URL}?symbol=${encodeURIComponent(yahooSymbol)}&range=${range}&interval=${interval}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error(`[AiBirfAPI] Failed to fetch ${yahooSymbol}:`, err.message);
      return null;
    }
  }

  // Convenience: fetch just enough history for indicators + forecast.
  function fetchQuoteWithHistory(yahooSymbol) {
    return fetchSeries(yahooSymbol, { range: "1y", interval: "1d" });
  }

  // Lighter call for index ticker / commodity strip (less history needed).
  function fetchQuoteLite(yahooSymbol) {
    return fetchSeries(yahooSymbol, { range: "5d", interval: "1d" });
  }

  return { fetchSeries, fetchQuoteWithHistory, fetchQuoteLite };
})();
