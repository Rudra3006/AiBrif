/* =========================================================
   AiBirf Market Pulse — watchlist (user preference) manager
   Stored per-browser in localStorage. No backend/account needed.
   ========================================================= */
const Watchlist = (function () {
  const KEY = APP_CONFIG.LOCAL_STORAGE_KEYS.watchlist;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    // First run: seed with defaults
    save(APP_CONFIG.DEFAULT_WATCHLIST);
    return APP_CONFIG.DEFAULT_WATCHLIST.slice();
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch { /* storage unavailable — ignore */ }
  }

  function add(entry) {
    const list = load();
    const exists = list.some(s => s.yahoo.toUpperCase() === entry.yahoo.toUpperCase());
    if (exists) return list;
    list.push(entry);
    save(list);
    return list;
  }

  function remove(yahooSymbol) {
    const list = load().filter(s => s.yahoo.toUpperCase() !== yahooSymbol.toUpperCase());
    save(list);
    return list;
  }

  function buildEntry(rawSymbol, exch) {
    const clean = rawSymbol.trim().toUpperCase().replace(/\s+/g, "");
    return {
      symbol: clean,
      exch,
      yahoo: `${clean}.${exch}`,
      name: clean
    };
  }

  return { load, save, add, remove, buildEntry };
})();
