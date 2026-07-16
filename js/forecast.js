/* =========================================================
   AiBirf Market Pulse — forecast engine
   Projects a trend + volatility band ~20 trading days (4 weeks)
   forward using linear regression on log-prices. This is a
   statistical extrapolation of recent behaviour, NOT a prediction
   of what the price will actually do. Always labelled as such.
   ========================================================= */
const Forecast = (function () {

  function linearRegression(y) {
    const n = y.length;
    const x = y.map((_, i) => i);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - xMean) * (y[i] - yMean);
      den += (x[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    return { slope, intercept };
  }

  function stdDev(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * closes: array of recent daily closing prices (most recent last)
   * daysForward: trading days to project (default from config)
   */
  function project(closes, daysForward = APP_CONFIG.FORECAST_TRADING_DAYS) {
    const lookback = Math.min(closes.length, 60); // use last ~3 months for the trend line
    const recent = closes.slice(-lookback);
    const logPrices = recent.map(v => Math.log(v));

    const { slope, intercept } = linearRegression(logPrices);

    // Daily log returns, for volatility-based confidence bands
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      returns.push(Math.log(recent[i] / recent[i - 1]));
    }
    const dailyVol = returns.length ? stdDev(returns) : 0.01;

    const lastIndex = logPrices.length - 1;
    const lastPrice = recent[recent.length - 1];

    const points = [];
    for (let d = 1; d <= daysForward; d++) {
      const projectedLog = intercept + slope * (lastIndex + d);
      const central = Math.exp(projectedLog);
      // Band widens with sqrt(time) per standard random-walk volatility scaling.
      const bandWidth = central * dailyVol * Math.sqrt(d) * 1.28; // ~80% confidence
      points.push({
        day: d,
        central: central,
        upper: central + bandWidth,
        lower: Math.max(central - bandWidth, 0)
      });
    }

    const trendPctPerDay = (Math.exp(slope) - 1) * 100;
    const impliedTrend = trendPctPerDay > 0.03 ? "up" : (trendPctPerDay < -0.03 ? "down" : "flat");

    return {
      lastPrice,
      dailyVolPct: dailyVol * 100,
      trendPctPerDay,
      impliedTrend,
      points
    };
  }

  // ---- Daily cache gated to a 7 AM refresh, valid for 24 hours ----
  function getCachedOrCompute(symbolKey, closes) {
    const store = _loadCache();
    const now = new Date();
    const cached = store[symbolKey];

    if (cached && _isCacheStillValid(cached.computedAt, now)) {
      return cached.data;
    }

    const data = project(closes);
    store[symbolKey] = { computedAt: now.toISOString(), data };
    _saveCache(store);
    return data;
  }

  function _isCacheStillValid(computedAtISO, now) {
    const computedAt = new Date(computedAtISO);
    const todayRefresh = new Date(now);
    todayRefresh.setHours(APP_CONFIG.FORECAST_REFRESH_HOUR, 0, 0, 0);

    // The most recent scheduled refresh point at/before `now`.
    let lastScheduled = todayRefresh;
    if (now < todayRefresh) {
      lastScheduled = new Date(todayRefresh);
      lastScheduled.setDate(lastScheduled.getDate() - 1);
    }
    // Valid if the cached forecast was computed at/after the last scheduled refresh.
    return computedAt >= lastScheduled;
  }

  function _loadCache() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.forecastCache);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function _saveCache(store) {
    try {
      localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.forecastCache, JSON.stringify(store));
    } catch { /* storage full or unavailable — fail silently, recompute next time */ }
  }

  return { project, getCachedOrCompute };
})();
