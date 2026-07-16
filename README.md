# AiBirf Market Pulse

A live NSE/BSE stock dashboard with a personal watchlist, commodity prices,
full technical breakdowns (RSI, MACD, moving averages, Bollinger Bands),
a long/short bias signal, and a 4-week trend projection — ready to upload
to **AiBirf.com**.

---

## 1. What's in this package

```
aibirf-dashboard/
├── index.html          → the whole page
├── css/style.css        → all styling
├── js/
│   ├── config.js        → EDIT THIS for defaults, refresh timing, symbols
│   ├── api.js            → talks to api/proxy.php
│   ├── indicators.js     → RSI / MACD / SMA / Bollinger math
│   ├── forecast.js       → 4-week trend projection logic
│   ├── watchlist.js      → saves each visitor's chosen stocks (localStorage)
│   ├── charts.js         → all Chart.js rendering
│   └── main.js           → wires everything together, 10-min auto-refresh
├── api/
│   └── proxy.php         → server-side data fetcher (see below — important)
└── README.md             → this file
```

## 2. How the data works (read this first)

Real-time NSE/BSE data from most providers (Twelve Data, Alpha Vantage, etc.)
**requires a paid plan** once you go beyond a handful of US symbols — their
free tiers don't include India. Instead, this build uses **Yahoo Finance's
public chart endpoint**, which is free, needs no signup or API key, and
already covers NSE (`.NS`) and BSE (`.BO`) tickers as well as global indices
and commodity futures.

Browsers can't call that endpoint directly (Yahoo blocks cross-origin
requests), so `api/proxy.php` sits on your own server, fetches the data,
and hands your page a clean JSON response. This is why the site needs
**PHP hosting**, which almost every shared host (Hostinger, GoDaddy,
Bluehost, cPanel-based hosts, etc.) provides by default.

**Important caveat:** Yahoo's endpoint is unofficial and undocumented. It's
widely used for personal/educational dashboards like this one, but it isn't
a guaranteed commercial data feed — it can occasionally rate-limit or change
format without warning. If you later want a contractually-supported feed,
swap the `fetchYahoo()` function in `api/proxy.php` for a paid provider
(Twelve Data's "Grow" plan is the most straightforward one that covers NSE).

## 3. Uploading to AiBirf.com

1. Confirm your hosting plan supports **PHP** (it almost certainly does).
2. Upload the entire `aibirf-dashboard` folder contents to your site's
   web root (often `public_html/`) via FTP, or your host's File Manager.
3. Visit `https://AiBirf.com/` — the dashboard should load with the
   default watchlist (Reliance, TCS, HDFC Bank, Infosys).
4. If prices don't load, open your browser's console (F12) — it will show
   whether `api/proxy.php` is reachable and what error Yahoo returned.
   Common fixes:
   - Make sure `api/proxy.php` uploaded correctly and PHP is enabled.
   - Make sure the `api/_cache` folder can be created (PHP needs write
     permission in that directory — most hosts allow this by default).
   - Some hosts block outbound cURL by default; if so, contact your host
     to allow outbound HTTPS requests from PHP.

No build step, no npm install, no database — it's plain HTML/CSS/JS plus
one PHP file.

## 4. Customizing

Open **`js/config.js`** — everything you're likely to want to change lives
there:

- `DEFAULT_WATCHLIST` — the stocks shown to first-time visitors.
- `INDICES` — what shows in the scrolling ticker bar.
- `COMMODITIES` — which futures show in the commodities strip.
- `PRICE_REFRESH_MINUTES` — currently `10`, matching your request.
- `FORECAST_REFRESH_HOUR` — currently `7` (7:00 AM, visitor's local time),
  matching your request that forecasts refresh each morning and hold for
  24 hours.

To find a stock's Yahoo symbol: it's the NSE/BSE ticker plus `.NS` or `.BO`
— e.g. Tata Motors is `TATAMOTORS.NS`, State Bank of India is `SBIN.NS`.
Visitors can also add any symbol themselves from the "+ Add" button in the
sidebar — that's saved locally in their own browser, not shared site-wide.

## 5. What the "long/short" signal and forecast actually are

- **Signal / bias badge**: a rules-based score combining moving-average
  trend, RSI, MACD crossover and Bollinger Band position. It's a standard
  technical-analysis read, shown as "Long bias / Short bias / Neutral" —
  useful context, not a recommendation to trade.
- **4-week projection**: a linear trend line fitted to recent closing
  prices (log scale), extended forward ~20 trading days, with a shaded
  range that widens over time based on the stock's recent volatility.
  It shows *"if the recent trend and volatility continue, here's a
  plausible range"* — it is a statistical extrapolation, not a prediction,
  and markets frequently move against established trends. This is stated
  directly on the page as well.

**None of this is financial advice.** Consider adding your own disclaimer
page/terms if AiBirf.com will have real visitors relying on it.

## 6. Auto-update behavior (as requested)

- **Prices**: refresh automatically every 10 minutes while the page is
  open, with a live countdown shown in the top bar. Each visitor's browser
  does its own refresh — there's no server-side cron needed.
- **Forecasts**: recomputed the first time a visitor opens a stock's detail
  view after 7:00 AM local time, then cached in that visitor's browser for
  24 hours so it doesn't recalculate on every click.

## 7. Limitations to know about

- This uses each visitor's **own browser storage** for their watchlist —
  there's no login system, so preferences don't sync across devices. If
  you want accounts + a shared database later, that's a bigger project
  (real backend + user auth) — happy to help scope that separately.
- Commodity prices are **global USD benchmark futures** (gold, silver,
  crude, natural gas) since a free INR-denominated MCX feed isn't
  available without a paid data license.
- Yahoo's free endpoint is best-effort, as noted above.
