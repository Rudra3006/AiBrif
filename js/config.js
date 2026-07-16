/* =========================================================
   AiBirf Market Pulse — configuration
   Edit this file to customise defaults. No API key needed:
   data is fetched through api/proxy.php (see README.md).
   ========================================================= */
const APP_CONFIG = {

  // How often live prices refresh, in minutes.
  PRICE_REFRESH_MINUTES: 10,

  // Forecast recompute time (24hr, local browser time) and how long it stays valid.
  FORECAST_REFRESH_HOUR: 7,   // 7 = 7:00 AM
  FORECAST_VALID_HOURS: 24,

  // Path to the server-side proxy that fetches Yahoo Finance data.
  // Must sit on the SAME domain as this page to avoid CORS issues.
  PROXY_URL: "api/proxy.php",

  // Default watchlist shown the first time someone opens the site.
  // symbol = ticker shown to the user, yahoo = the underlying Yahoo Finance symbol.
  DEFAULT_WATCHLIST: [
    { symbol: "RELIANCE", exch: "NS", yahoo: "RELIANCE.NS", name: "Reliance Industries" },
    { symbol: "TCS",      exch: "NS", yahoo: "TCS.NS",       name: "Tata Consultancy Services" },
    { symbol: "HDFCBANK", exch: "NS", yahoo: "HDFCBANK.NS",  name: "HDFC Bank" },
    { symbol: "INFY",     exch: "NS", yahoo: "INFY.NS",      name: "Infosys" }
  ],

  // Indices shown in the scrolling ticker bar at the top.
  INDICES: [
    { label: "NIFTY 50", yahoo: "^NSEI" },
    { label: "SENSEX",   yahoo: "^BSESN" },
    { label: "BANK NIFTY", yahoo: "^NSEBANK" }
  ],

  // Commodities strip (global USD benchmark futures — free tier has no MCX INR feed).
  COMMODITIES: [
    { label: "Gold",       yahoo: "GC=F", unit: "/oz" },
    { label: "Silver",     yahoo: "SI=F", unit: "/oz" },
    { label: "Crude Oil",  yahoo: "CL=F", unit: "/bbl" },
    { label: "Natural Gas",yahoo: "NG=F", unit: "/mmBtu" }
  ],

  // How many days of history to pull for indicators + forecast basis.
  HISTORY_DAYS: 180,

  // Trading days to project forward for the "4-week" forecast (≈ 20 trading days).
  FORECAST_TRADING_DAYS: 20,

  LOCAL_STORAGE_KEYS: {
    watchlist: "aibirf_watchlist_v1",
    forecastCache: "aibirf_forecast_cache_v1",
    priceCache: "aibirf_price_cache_v1"
  }
};
