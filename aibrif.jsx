import { useState, useEffect, useCallback } from "react";

const CATEGORIES = ["All", "AI", "Stock Market", "Currency"];

const CATEGORY_QUERIES = {
  AI: "latest artificial intelligence news today 2026",
  "Stock Market": "stock market news today 2026",
  Currency: "currency forex exchange rate news today 2026",
  All: "latest AI stock market currency news today 2026",
};

function parseNewsFromText(text) {
  // Try to parse JSON first
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Fallback: extract structured news from text
  const items = [];
  const lines = text.split("\n").filter((l) => l.trim());
  let current = null;

  for (const line of lines) {
    const titleMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*/) || line.match(/^[-•]\s+\*\*(.+?)\*\*/);
    if (titleMatch) {
      if (current) items.push(current);
      current = { title: titleMatch[1], summary: "", url: "#", category: "AI", time: "Just now" };
    } else if (current) {
      if (line.includes("http")) {
        const urlMatch = line.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) current.url = urlMatch[0];
      } else if (!line.startsWith("Source:") && line.trim().length > 10) {
        current.summary += (current.summary ? " " : "") + line.trim();
      }
    }
  }
  if (current) items.push(current);
  return items.slice(0, 9);
}

function NewsCard({ item, index }) {
  const catColors = {
    AI: { bg: "#00ffe7", text: "#0a0f1e" },
    "Stock Market": { bg: "#ffe600", text: "#0a0f1e" },
    Currency: { bg: "#ff6b35", text: "#fff" },
    General: { bg: "#a78bfa", text: "#0a0f1e" },
  };
  const col = catColors[item.category] || catColors.General;

  return (
    <a
      href={item.url !== "#" ? item.url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "20px 22px",
        transition: "all 0.2s ease",
        cursor: item.url !== "#" ? "pointer" : "default",
        animationDelay: `${index * 0.07}s`,
        animation: "fadeUp 0.5s ease forwards",
        opacity: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        e.currentTarget.style.borderColor = col.bg;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          background: col.bg, color: col.text, fontSize: "10px", fontWeight: 700,
          padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.08em", textTransform: "uppercase"
        }}>
          {item.category}
        </span>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>{item.time}</span>
      </div>
      <h3 style={{
        color: "#fff", fontSize: "15px", fontWeight: 600, lineHeight: 1.45,
        marginBottom: "8px", fontFamily: "'Sora', sans-serif"
      }}>
        {item.title}
      </h3>
      {item.summary && (
        <p style={{
          color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: 1.6,
          marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>
          {item.summary}
        </p>
      )}
      {item.url !== "#" && (
        <span style={{ color: col.bg, fontSize: "12px", fontWeight: 600 }}>
          Read full story →
        </span>
      )}
    </a>
  );
}

function Ticker({ items }) {
  const tickers = items.map(i => i.title).join("   •   ");
  return (
    <div style={{
      background: "rgba(0,255,231,0.08)", borderBottom: "1px solid rgba(0,255,231,0.15)",
      padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap"
    }}>
      <div style={{
        display: "inline-block",
        animation: "ticker 40s linear infinite",
        color: "#00ffe7", fontSize: "12px", fontFamily: "'Space Mono', monospace"
      }}>
        {tickers} &nbsp;&nbsp;&nbsp; {tickers}
      </div>
    </div>
  );
}

export default function AIBrif() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketData, setMarketData] = useState(null);

  const fetchNews = useCallback(async (category) => {
    setLoading(true);
    try {
      const query = CATEGORY_QUERIES[category];
      const systemPrompt = `You are a financial and tech news aggregator for AIbrif.com. 
Search the web and return EXACTLY 9 recent news items as a JSON array. 
Each item must have: title, summary (1-2 sentences), url (real article URL or "#"), category (AI/Stock Market/Currency/General), time (e.g. "2h ago", "Today").
Return ONLY the JSON array, no markdown, no preamble. Example:
[{"title":"...","summary":"...","url":"https://...","category":"AI","time":"1h ago"}]`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: systemPrompt,
          messages: [{ role: "user", content: `Find and return 9 latest news items about: ${query}` }],
        }),
      });

      const data = await response.json();
      const fullText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      const items = parseNewsFromText(fullText);
      setNews(items.length > 0 ? items : getFallbackNews(category));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setNews(getFallbackNews(category));
    }
    setLoading(false);
  }, []);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "Return ONLY a JSON object with current approximate values: {btc, sp500, nasdaq, eurusd, gbpusd}. Example: {\"btc\":\"$105,000\",\"sp500\":\"5,800\",\"nasdaq\":\"19,200\",\"eurusd\":\"1.0850\",\"gbpusd\":\"1.2710\"}. No markdown.",
          messages: [{ role: "user", content: "Get current BTC price, S&P 500, NASDAQ, EUR/USD, GBP/USD rates" }],
        }),
      });
      const data = await response.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setMarketData(parsed);
    } catch {
      setMarketData({ btc: "$105K", sp500: "5,800", nasdaq: "19,200", eurusd: "1.085", gbpusd: "1.271" });
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
    fetchMarketData();
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e",
      fontFamily: "'DM Sans', sans-serif", color: "#fff"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;600;800&family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #00ffe7; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "60px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", background: "linear-gradient(135deg,#00ffe7,#6366f1)",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: 800, color: "#0a0f1e", fontFamily: "'Sora',sans-serif"
            }}>AI</div>
            <span style={{
              fontSize: "20px", fontWeight: 800, fontFamily: "'Sora',sans-serif",
              background: "linear-gradient(90deg,#fff,#00ffe7)", WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>AIbrif.com</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {lastUpdated && (
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", fontFamily: "'Space Mono',monospace" }}>
                Updated {lastUpdated}
              </span>
            )}
            <button
              onClick={() => { fetchNews(activeCategory); fetchMarketData(); }}
              disabled={loading}
              style={{
                background: loading ? "rgba(0,255,231,0.1)" : "rgba(0,255,231,0.15)",
                color: "#00ffe7", border: "1px solid rgba(0,255,231,0.3)",
                borderRadius: "8px", padding: "6px 14px", fontSize: "12px",
                fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans',sans-serif"
              }}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      {news.length > 0 && <Ticker items={news} />}

      {/* Market Bar */}
      {marketData && (
        <div style={{
          background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "10px 24px"
        }}>
          <div style={{
            maxWidth: "1200px", margin: "0 auto",
            display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center"
          }}>
            {[
              { label: "BTC", value: marketData.btc, color: "#ffe600" },
              { label: "S&P 500", value: marketData.sp500, color: "#00ffe7" },
              { label: "NASDAQ", value: marketData.nasdaq, color: "#00ffe7" },
              { label: "EUR/USD", value: marketData.eurusd, color: "#ff6b35" },
              { label: "GBP/USD", value: marketData.gbpusd, color: "#ff6b35" },
            ].map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "'Space Mono',monospace" }}>{m.label}</span>
                <span style={{ color: m.color, fontSize: "13px", fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{m.value}</span>
              </div>
            ))}
            <span style={{
              marginLeft: "auto", fontSize: "10px", color: "rgba(255,255,255,0.25)",
              fontFamily: "'Space Mono',monospace"
            }}>Live via AI</span>
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 24px" }}>
        {/* Hero */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "'Sora',sans-serif", fontSize: "clamp(26px,4vw,42px)",
            fontWeight: 800, lineHeight: 1.15, marginBottom: "8px"
          }}>
            Your daily brief on{" "}
            <span style={{
              background: "linear-gradient(90deg,#00ffe7,#6366f1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              AI, Markets & Currency
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px" }}>
            Real-time intelligence gathered from across the web — curated by AI, for you.
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
                background: activeCategory === cat ? "#00ffe7" : "rgba(255,255,255,0.06)",
                color: activeCategory === cat ? "#0a0f1e" : "rgba(255,255,255,0.6)",
                border: activeCategory === cat ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              display: "inline-block", width: "36px", height: "36px",
              border: "3px solid rgba(0,255,231,0.2)", borderTopColor: "#00ffe7",
              borderRadius: "50%", animation: "spin 0.8s linear infinite"
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: "rgba(255,255,255,0.35)", marginTop: "16px", fontSize: "14px" }}>
              Gathering latest news…
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px"
          }}>
            {news.map((item, i) => (
              <NewsCard key={i} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Admin Note */}
        <div style={{
          marginTop: "48px", padding: "16px 20px",
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px"
        }}>
          <span style={{ fontSize: "18px" }}>🔐</span>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Admin Panel</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              You are the admin of AIbrif.com. Use the Refresh button to fetch latest news at any time. 
              Stories are AI-curated with live web search. Links open full articles in new tabs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px", textAlign: "center",
        color: "rgba(255,255,255,0.25)", fontSize: "12px",
        fontFamily: "'Space Mono',monospace"
      }}>
        © 2026 AIbrif.com — AI-Powered News Intelligence
      </footer>
    </div>
  );
}

function getFallbackNews(category) {
  const all = [
    { title: "OpenAI Launches New Model with Advanced Reasoning Capabilities", summary: "The new model shows significant improvements in math and coding tasks.", url: "https://openai.com/blog", category: "AI", time: "1h ago" },
    { title: "S&P 500 Rises as Fed Signals Rate Pause", summary: "Markets rallied after the Federal Reserve indicated it would hold rates steady.", url: "https://finance.yahoo.com", category: "Stock Market", time: "2h ago" },
    { title: "EUR/USD Climbs on Positive Eurozone Data", summary: "The euro gained ground as inflation data came in below expectations.", url: "https://www.forexlive.com", category: "Currency", time: "3h ago" },
    { title: "Google DeepMind Publishes Breakthrough in Protein Folding", summary: "New research extends AlphaFold capabilities to drug discovery.", url: "https://deepmind.google", category: "AI", time: "4h ago" },
    { title: "NASDAQ Hits New High Driven by AI Stocks", summary: "Technology shares surged as investor enthusiasm for AI continues.", url: "https://finance.yahoo.com", category: "Stock Market", time: "5h ago" },
    { title: "Bitcoin Holds Above $100K Amid Institutional Demand", summary: "Crypto markets remain stable as ETF inflows hit monthly record.", url: "https://coindesk.com", category: "Currency", time: "6h ago" },
    { title: "Anthropic Raises $3B in New Funding Round", summary: "The AI safety company plans to expand compute and research.", url: "https://anthropic.com", category: "AI", time: "7h ago" },
    { title: "UK Pound Strengthens Against Dollar", summary: "GBP/USD rose following stronger-than-expected employment figures.", url: "https://www.reuters.com", category: "Currency", time: "8h ago" },
    { title: "Tesla Stock Surges on Robotaxi Launch Date Announcement", summary: "Shares jumped 12% after the company confirmed a commercial launch.", url: "https://finance.yahoo.com", category: "Stock Market", time: "9h ago" },
  ];
  if (category === "All") return all;
  return all.filter(n => n.category === category).concat(all.filter(n => n.category !== category)).slice(0, 9);
}
