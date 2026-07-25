/* =========================================================
   AiBirf Market Pulse — technical indicators
   Pure functions operating on an array of closing prices.
   ========================================================= */
const Indicators = (function () {

  function sma(values, period) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) sum -= values[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  function ema(values, period) {
    const out = new Array(values.length).fill(null);
    const k = 2 / (period + 1);
    let prev = null;
    for (let i = 0; i < values.length; i++) {
      if (values[i] == null) continue;
      if (prev === null) {
        // seed with SMA of first `period` values
        if (i >= period - 1) {
          const slice = values.slice(i - period + 1, i + 1);
          prev = slice.reduce((a, b) => a + b, 0) / period;
          out[i] = prev;
        }
      } else {
        prev = values[i] * k + prev * (1 - k);
        out[i] = prev;
      }
    }
    return out;
  }

  function rsi(values, period = 14) {
    // Wilder's smoothing method.
    const out = new Array(values.length).fill(null);
    let avgGain = null, avgLoss = null;
    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      if (i < period) continue;
      if (i === period) {
        let g = 0, l = 0;
        for (let j = 1; j <= period; j++) {
          const c = values[j] - values[j - 1];
          g += Math.max(c, 0);
          l += Math.max(-c, 0);
        }
        avgGain = g / period;
        avgLoss = l / period;
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
      }
      out[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }
    return out;
  }

  function macd(values, fast = 12, slow = 26, signalPeriod = 9) {
    const emaFast = ema(values, fast);
    const emaSlow = ema(values, slow);
    const macdLine = values.map((_, i) =>
      (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null
    );
    const cleanForSignal = macdLine.map(v => (v == null ? 0 : v));
    const signalLine = ema(cleanForSignal, signalPeriod).map((v, i) => macdLine[i] == null ? null : v);
    const histogram = macdLine.map((v, i) => (v != null && signalLine[i] != null) ? v - signalLine[i] : null);
    return { macdLine, signalLine, histogram };
  }

  function bollinger(values, period = 20, mult = 2) {
    const middle = sma(values, period);
    const upper = new Array(values.length).fill(null);
    const lower = new Array(values.length).fill(null);
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
      const sd = Math.sqrt(variance);
      upper[i] = mean + mult * sd;
      lower[i] = mean - mult * sd;
    }
    return { middle, upper, lower };
  }

  function lastValid(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] != null && !Number.isNaN(arr[i])) return arr[i];
    }
    return null;
  }

  /**
   * Confluence scoring across SMA50/200 crossover, RSI, MACD and
   * Bollinger position. Returns a bias label + per-indicator readouts.
   * This is a rules-based technical read, not a guarantee of direction.
   */
  function computeSignal(closes) {
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const macdRes = macd(closes);
    const bb = bollinger(closes, 20, 2);

    const price = lastValid(closes);
    const lSma20 = lastValid(sma20);
    const lSma50 = lastValid(sma50);
    const lRsi = lastValid(rsi14);
    const lMacd = lastValid(macdRes.macdLine);
    const lSignal = lastValid(macdRes.signalLine);
    const lHist = lastValid(macdRes.histogram);
    const lUpper = lastValid(bb.upper);
    const lLower = lastValid(bb.lower);
    const lMid = lastValid(bb.middle);

    let score = 0;
    const readouts = [];

    // Trend: price vs moving averages
    if (price != null && lSma20 != null && lSma50 != null) {
      if (price > lSma20 && lSma20 > lSma50) { score += 2; readouts.push({ name: "Trend (MA)", val: "Uptrend", read: "Price above SMA20 & SMA50", tone: "up" }); }
      else if (price < lSma20 && lSma20 < lSma50) { score -= 2; readouts.push({ name: "Trend (MA)", val: "Downtrend", read: "Price below SMA20 & SMA50", tone: "down" }); }
      else { readouts.push({ name: "Trend (MA)", val: "Mixed", read: "Price between moving averages", tone: "neutral" }); }
    }

    // RSI
    if (lRsi != null) {
      let read = "Neutral", tone = "neutral";
      if (lRsi >= 70) { score -= 1; read = "Overbought"; tone = "down"; }
      else if (lRsi <= 30) { score += 1; read = "Oversold — potential rebound zone"; tone = "up"; }
      else if (lRsi > 50) { score += 0.5; read = "Above midline"; tone = "up"; }
      else { score -= 0.5; read = "Below midline"; tone = "down"; }
      readouts.push({ name: "RSI (14)", val: lRsi.toFixed(1), read, tone });
    }

    // MACD
    if (lMacd != null && lSignal != null) {
      if (lMacd > lSignal && lHist > 0) { score += 1.5; readouts.push({ name: "MACD", val: lMacd.toFixed(2), read: "Bullish crossover", tone: "up" }); }
      else if (lMacd < lSignal && lHist < 0) { score -= 1.5; readouts.push({ name: "MACD", val: lMacd.toFixed(2), read: "Bearish crossover", tone: "down" }); }
      else { readouts.push({ name: "MACD", val: lMacd.toFixed(2), read: "No clear crossover", tone: "neutral" }); }
    }

    // Bollinger position
    if (price != null && lUpper != null && lLower != null) {
      const pct = (price - lLower) / (lUpper - lLower);
      if (pct > 0.85) { score -= 1; readouts.push({ name: "Bollinger Bands", val: `${(pct * 100).toFixed(0)}% of band`, read: "Near upper band — stretched", tone: "down" }); }
      else if (pct < 0.15) { score += 1; readouts.push({ name: "Bollinger Bands", val: `${(pct * 100).toFixed(0)}% of band`, read: "Near lower band — compressed", tone: "up" }); }
      else { readouts.push({ name: "Bollinger Bands", val: `${(pct * 100).toFixed(0)}% of band`, read: "Trading within normal range", tone: "neutral" }); }
    }

    let bias = "Neutral", biasTone = "neutral";
    if (score >= 2.5) { bias = "Long bias"; biasTone = "up"; }
    else if (score <= -2.5) { bias = "Short bias"; biasTone = "down"; }
    else if (score > 0) { bias = "Mild long lean"; biasTone = "up"; }
    else if (score < 0) { bias = "Mild short lean"; biasTone = "down"; }

    return {
      bias, biasTone, score,
      readouts,
      series: { sma20, sma50, rsi14, macd: macdRes, bollinger: bb }
    };
  }

  return { sma, ema, rsi, macd, bollinger, computeSignal, lastValid };
})();
