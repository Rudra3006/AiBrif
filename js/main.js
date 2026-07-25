/* =========================================================
   AiBirf Market Pulse — app bootstrap & orchestration
   ========================================================= */
(function () {

  let watchlistCache = [];      // [{symbol, exch, yahoo, name}]
  let liveData = {};            // yahoo -> proxy response
  let activeDrawerYahoo = null;
  let refreshTimer = null;
  let countdownTimer = null;
  let nextRefreshAt = null;
  let quickRetryCount = 0;
  const MAX_QUICK_RETRIES = 3;
  const QUICK_RETRY_MS = 20000; // 20s — used only when data totally fails to load

  // ---------------- Init ----------------
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    watchlistCache = Watchlist.load();
    wireStaticEvents();
    await refreshEverything();
    scheduleAutoRefresh();
  }

  function wireStaticEvents() {
    document.getElementById("addSymbolBtn").addEventListener("click", () => {
      document.getElementById("addSymbolForm").classList.toggle("hidden");
    });
    document.getElementById("cancelAddBtn").addEventListener("click", () => {
      document.getElementById("addSymbolForm").classList.add("hidden");
    });
    document.getElementById("confirmAddBtn").addEventListener("click", handleAddSymbol);
    document.getElementById("newSymbolInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleAddSymbol();
    });
    document.getElementById("closeDrawerBtn").addEventListener("click", closeDrawer);
    document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);
    document.getElementById("removeSymbolBtn").addEventListener("click", handleRemoveActive);
    document.getElementById("dataBannerRetry").addEventListener("click", () => refreshEverything());
  }

  async function handleAddSymbol() {
    const input = document.getElementById("newSymbolInput");
    const exch = document.querySelector('input[name="exch"]:checked').value;
    const raw = input.value.trim();
    if (!raw) return;
    const entry = Watchlist.buildEntry(raw, exch);
    watchlistCache = Watchlist.add(entry);
    input.value = "";
    document.getElementById("addSymbolForm").classList.add("hidden");
    await refreshEverything();
  }

  function handleRemoveActive() {
    if (!activeDrawerYahoo) return;
    watchlistCache = Watchlist.remove(activeDrawerYahoo);
    closeDrawer();
    renderWatchlistSidebar();
    renderStockGrid();
  }

  // ---------------- Data refresh ----------------
  async function refreshEverything() {
    setSyncStatus("syncing");
    const jobs = [];

    // Watchlist stocks (full history for indicators + forecast)
    watchlistCache.forEach(s => {
      jobs.push(
        AiBirfAPI.fetchQuoteWithHistory(s.yahoo).then(data => { if (data) liveData[s.yahoo] = data; })
      );
    });

    // Indices (light)
    APP_CONFIG.INDICES.forEach(ix => {
      jobs.push(
        AiBirfAPI.fetchQuoteLite(ix.yahoo).then(data => { if (data) liveData[ix.yahoo] = data; })
      );
    });

    // Commodities (light)
    APP_CONFIG.COMMODITIES.forEach(c => {
      jobs.push(
        AiBirfAPI.fetchQuoteLite(c.yahoo).then(data => { if (data) liveData[c.yahoo] = data; })
      );
    });

    await Promise.all(jobs);

    renderTicker();
    renderWatchlistSidebar();
    renderStockGrid();
    renderCommodities();
    if (activeDrawerYahoo) renderDrawer(activeDrawerYahoo);

    const gotAnyData = Object.keys(liveData).length > 0;

    if (gotAnyData) {
      quickRetryCount = 0;
      hideDataBanner();
      setSyncStatus("live");
    } else {
      setSyncStatus("stale");
      const reason = AiBirfAPI.getLastError() || "Unknown error";
      showDataBanner(reason);

      // Self-heal: retry sooner a few times (e.g. a transient host/network
      // hiccup) before settling back into the normal 10-minute cadence.
      if (quickRetryCount < MAX_QUICK_RETRIES) {
        quickRetryCount++;
        setTimeout(refreshEverything, QUICK_RETRY_MS);
      }
    }
  }

  function showDataBanner(reason) {
    const banner = document.getElementById("dataBanner");
    const text = document.getElementById("dataBannerText");
    text.textContent = `Market data isn't loading (${reason}). If this doesn't clear up, open ` +
      `${APP_CONFIG.PROXY_URL}?health=1 in your browser to see why.`;
    banner.classList.remove("hidden");
  }

  function hideDataBanner() {
    document.getElementById("dataBanner").classList.add("hidden");
  }

  function scheduleAutoRefresh() {
    const intervalMs = APP_CONFIG.PRICE_REFRESH_MINUTES * 60 * 1000;
    if (refreshTimer) clearInterval(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    nextRefreshAt = Date.now() + intervalMs;
    refreshTimer = setInterval(async () => {
      await refreshEverything();
      nextRefreshAt = Date.now() + intervalMs;
    }, intervalMs);

    countdownTimer = setInterval(updateCountdownDisplay, 1000);
    updateCountdownDisplay();
  }

  function updateCountdownDisplay() {
    const el = document.getElementById("nextSync");
    if (!nextRefreshAt) { el.textContent = ""; return; }
    const remainingMs = Math.max(0, nextRefreshAt - Date.now());
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    el.textContent = `next update in ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function setSyncStatus(state) {
    const status = document.getElementById("syncStatus");
    const dot = document.getElementById("syncDot");
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (state === "syncing") {
      status.textContent = "Syncing…";
      dot.classList.add("stale");
    } else if (state === "stale") {
      status.textContent = `Data unavailable · retrying`;
      dot.classList.add("stale");
    } else {
      status.textContent = `Live · ${timeStr}`;
      dot.classList.remove("stale");
    }
  }

  // ---------------- Rendering: ticker ----------------
  function renderTicker() {
    const track = document.getElementById("tickerTrack");
    const items = APP_CONFIG.INDICES.map(ix => {
      const d = liveData[ix.yahoo];
      if (!d) return `<span class="ticker-item">${ix.label} …</span>`;
      const { changeAbs, changePct, tone } = computeChange(d);
      const arrow = tone === "up" ? "▲" : (tone === "down" ? "▼" : "•");
      return `<span class="ticker-item"><b>${ix.label}</b> ${fmt(d.regularPrice)} <span class="ticker-${tone}">${arrow} ${changePct.toFixed(2)}%</span></span>`;
    });
    // duplicate the list so the CSS marquee loops seamlessly
    track.innerHTML = items.join("") + items.join("");
  }

  // ---------------- Rendering: sidebar watchlist ----------------
  function renderWatchlistSidebar() {
    const ul = document.getElementById("watchlistUl");
    ul.innerHTML = "";
    watchlistCache.forEach(s => {
      const d = liveData[s.yahoo];
      const li = document.createElement("li");
      li.className = "watchlist__item";
      if (d) {
        const { changePct, tone } = computeChange(d);
        li.innerHTML = `
          <span><span class="watchlist__sym">${s.symbol}</span><span class="watchlist__exch">${s.exch}</span></span>
          <span class="watchlist__chg ${tone}">${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%</span>`;
      } else {
        li.innerHTML = `<span class="watchlist__sym">${s.symbol}</span><span class="muted small">…</span>`;
      }
      li.addEventListener("click", () => openDrawer(s.yahoo));
      ul.appendChild(li);
    });
  }

  // ---------------- Rendering: stock grid ----------------
  function renderStockGrid() {
    const grid = document.getElementById("stockGrid");
    const emptyState = document.getElementById("emptyState");
    grid.querySelectorAll(".stock-card").forEach(el => el.remove());

    if (watchlistCache.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    watchlistCache.forEach(s => {
      const d = liveData[s.yahoo];
      const card = document.createElement("div");
      card.className = "stock-card";
      card.dataset.yahoo = s.yahoo;

      if (!d || !d.closes || d.closes.length < 20) {
        card.innerHTML = `
          <div class="stock-card__top">
            <div><span class="stock-card__sym">${s.symbol}</span><span class="stock-card__exch">${s.exch}</span></div>
          </div>
          <div class="stock-card__price">Loading…</div>`;
        grid.appendChild(card);
        return;
      }

      const { changeAbs, changePct, tone } = computeChange(d);
      const signal = Indicators.computeSignal(d.closes);
      const badgeClass = signal.biasTone === "up" ? "badge-long" : (signal.biasTone === "down" ? "badge-short" : "badge-neutral");

      card.innerHTML = `
        <div class="stock-card__top">
          <div><span class="stock-card__sym">${s.symbol}</span><span class="stock-card__exch">${s.exch}</span></div>
          <span class="stock-card__badge ${badgeClass}">${signal.bias}</span>
        </div>
        <div class="stock-card__price">₹${fmt(d.regularPrice)}</div>
        <div class="stock-card__chg ${tone}">${changeAbs >= 0 ? "+" : ""}${fmt(changeAbs)} (${changePct.toFixed(2)}%)</div>
        <div class="stock-card__spark"><canvas id="spark-${s.symbol}" data-key="spark-${s.symbol}"></canvas></div>
      `;
      card.addEventListener("click", () => openDrawer(s.yahoo));
      grid.appendChild(card);

      requestAnimationFrame(() => {
        const canvas = document.getElementById(`spark-${s.symbol}`);
        if (canvas) Charts.renderSparkline(canvas, d.closes.slice(-30), tone);
      });
    });
  }

  // ---------------- Rendering: commodities ----------------
  function renderCommodities() {
    const strip = document.getElementById("commodityStrip");
    strip.innerHTML = "";
    APP_CONFIG.COMMODITIES.forEach(c => {
      const d = liveData[c.yahoo];
      const card = document.createElement("div");
      card.className = "commodity-card";
      if (!d) {
        card.innerHTML = `<div class="commodity-card__name">${c.label}</div><div class="commodity-card__price">Loading…</div>`;
      } else {
        const { changeAbs, changePct, tone } = computeChange(d);
        card.innerHTML = `
          <div class="commodity-card__name">${c.label}</div>
          <div class="commodity-card__price">$${fmt(d.regularPrice)}<span class="muted small"> ${c.unit}</span></div>
          <div class="commodity-card__chg ${tone}">${changeAbs >= 0 ? "+" : ""}${fmt(changeAbs)} (${changePct.toFixed(2)}%)</div>`;
      }
      strip.appendChild(card);
    });
  }

  // ---------------- Drawer (full technical breakdown) ----------------
  function openDrawer(yahooSymbol) {
    activeDrawerYahoo = yahooSymbol;
    renderDrawer(yahooSymbol);
    document.getElementById("detailDrawer").classList.add("show");
    document.getElementById("drawerOverlay").classList.add("show");
  }

  function closeDrawer() {
    document.getElementById("detailDrawer").classList.remove("show");
    document.getElementById("drawerOverlay").classList.remove("show");
    activeDrawerYahoo = null;
  }

  function renderDrawer(yahooSymbol) {
    const entry = watchlistCache.find(s => s.yahoo === yahooSymbol);
    const d = liveData[yahooSymbol];
    document.getElementById("drawerSymbol").textContent = entry ? entry.symbol : yahooSymbol;
    document.getElementById("drawerName").textContent = entry ? `${entry.name} · ${entry.exch}` : "";

    if (!d || !d.closes || d.closes.length < 20) {
      document.getElementById("drawerPrice").textContent = "Loading…";
      return;
    }

    const { changeAbs, changePct, tone } = computeChange(d);
    document.getElementById("drawerPrice").textContent = `₹${fmt(d.regularPrice)}`;
    const chgEl = document.getElementById("drawerChange");
    chgEl.textContent = `${changeAbs >= 0 ? "+" : ""}${fmt(changeAbs)} (${changePct.toFixed(2)}%)`;
    chgEl.className = `drawer__price-chg ${tone}`;

    const dates = d.timestamps.map(t => new Date(t * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
    const signal = Indicators.computeSignal(d.closes);

    Charts.renderPriceChart(document.getElementById("priceChart"), dates, d.closes, signal.series);

    const banner = document.getElementById("signalBanner");
    const valEl = document.getElementById("signalValue");
    valEl.textContent = signal.bias;
    valEl.className = `signal-banner__value ${signal.biasTone}`;

    const grid = document.getElementById("indicatorGrid");
    grid.innerHTML = "";
    signal.readouts.forEach(r => {
      const div = document.createElement("div");
      div.className = "indicator-card";
      div.innerHTML = `
        <div class="indicator-card__name">${r.name}</div>
        <div class="indicator-card__val">${r.val}</div>
        <div class="indicator-card__read ${r.tone}">${r.read}</div>`;
      grid.appendChild(div);
    });

    // Forecast
    const forecast = Forecast.getCachedOrCompute(yahooSymbol, d.closes);
    const trendWord = forecast.impliedTrend === "up" ? "upward" : (forecast.impliedTrend === "down" ? "downward" : "flat/sideways");
    document.getElementById("forecastMeta").textContent =
      `Recent trend: ${trendWord} · Daily volatility: ${forecast.dailyVolPct.toFixed(2)}% · Recomputed daily at ${APP_CONFIG.FORECAST_REFRESH_HOUR}:00 AM`;
    Charts.renderForecastChart(document.getElementById("forecastChart"), dates, d.closes, forecast.points);
  }

  // ---------------- Helpers ----------------
  function computeChange(d) {
    const prev = d.previousClose ?? d.closes[d.closes.length - 2] ?? d.regularPrice;
    const changeAbs = d.regularPrice - prev;
    const changePct = prev ? (changeAbs / prev) * 100 : 0;
    const tone = changeAbs > 0 ? "up" : (changeAbs < 0 ? "down" : "neutral");
    return { changeAbs, changePct, tone };
  }

  function fmt(num) {
    if (num == null || Number.isNaN(num)) return "—";
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

})();
