import React, { useEffect, useMemo, useState } from "react";
import { MarketPulse } from "@/components/MarketPulse";
import { SimulatorPage } from "./simulator";

type MarketsPageProps = {
  panel?: string;
};

const sentimentWatchlist = [
  { symbol: "NVDA", move: "+2.8%", sentiment: "Bullish momentum", score: 82 },
  { symbol: "TSLA", move: "-1.2%", sentiment: "Volatile · earnings soon", score: 58 },
  { symbol: "MSFT", move: "+0.9%", sentiment: "AI strength holding", score: 76 },
  { symbol: "NFLX", move: "+1.4%", sentiment: "Subscriber beat follow-through", score: 71 },
];

const heatMap = [
  { sector: "Technology", change: "+1.8%", tone: "Bullish" },
  { sector: "Energy", change: "-0.6%", tone: "Taking a breather" },
  { sector: "Financials", change: "+0.4%", tone: "Neutral" },
  { sector: "Healthcare", change: "+0.9%", tone: "Rotation in play" },
  { sector: "Consumer Discretionary", change: "+0.7%", tone: "Reopening strength" },
  { sector: "Utilities", change: "-0.3%", tone: "Rates pressure" },
];

const earningsCalendar = [
  { company: "Apple", date: "Jan 25", focus: "iPhone demand commentary" },
  { company: "Microsoft", date: "Jan 26", focus: "Azure & Copilot run-rate" },
  { company: "Shopify", date: "Jan 27", focus: "GMV + margins" },
  { company: "Visa", date: "Jan 28", focus: "Cross-border volumes" },
];

const alertFeed = [
  { title: "Watchlist breach", detail: "NVDA +5% intraday · trim to rebalance?", type: "positive" },
  { title: "Drawdown risk", detail: "TSLA -12% vs 50dma · consider stop review", type: "negative" },
  { title: "Sentiment spike", detail: "Semiconductors heat-map 92/100", type: "positive" },
];

const commentaryStrip = [
  "FOMC odds now pricing 2 cuts by September.",
  "AI megacap basket pacing for 14% YTD.",
  "Energy lagging as crude slips below $70.",
  "Credit spreads remain calm – risk-on backdrop.",
];

const backtests = [
  { name: "AI Leaders", cagr: "12.4%", drawdown: "-9%", insight: "Outperformed SPY by 320 bps" },
  { name: "Dividend Shield", cagr: "8.1%", drawdown: "-4%", insight: "Max drawdown 50% lower than market" },
  { name: "Green Energy", cagr: "10.2%", drawdown: "-11%", insight: "Momentum returning over last 60d" },
];

function AnalystPanel() {
  const [question, setQuestion] = useState("What is sentiment saying about my watchlist?");
  const [answer, setAnswer] = useState("Tap ask to get the latest AI analyst briefing.");
  const [loading, setLoading] = useState(false);

  const ask = async (prompt?: string) => {
    const text = (prompt ?? question).trim();
    if (!text) return;
    setLoading(true);
    setAnswer("Analyzing live signals…");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          context: {
            watchlist: sentimentWatchlist,
            macro: commentaryStrip,
          },
        }),
      });
      const data = await res.json();
      setAnswer(data.answer || "No commentary generated.");
    } catch (error) {
      console.error(error);
      setAnswer("AI analyst is offline. Try again soon.");
    } finally {
      setLoading(false);
    }
  };

  const formattedAnswer = useMemo(() => formatAnalystAnswer(answer), [answer]);

  return (
    <div className="card pad" id="analyst">
      <div className="title">AI analyst mini-chat</div>
      <p className="muted">
        Ask the copilot for insight on sentiment, alerts, or positioning without leaving the markets desk.
      </p>
      <div className="composer" style={{ flexWrap: "wrap", marginTop: 16 }}>
        <input
          className="input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your watchlist…"
        />
        <button className="btn" onClick={() => ask()} disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
      <div className="pill-row" style={{ marginTop: 12 }}>
        {[
          "Is tech still leading?",
          "Any alerts I should respond to?",
          "Summarize growth vs value today",
        ].map((prompt) => (
          <button key={prompt} className="chip" onClick={() => ask(prompt)} disabled={loading}>
            {prompt}
          </button>
        ))}
      </div>
      <div className="callout" style={{ marginTop: 18 }}>
        <strong>Analyst reply</strong>
        {formattedAnswer.length ? (
          <ul className="list-clean" style={{ marginTop: 6 }}>
            {formattedAnswer.map((line, index) => (
              <li key={`${line}-${index}`}>
                <p className="muted tiny">{line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted tiny" style={{ marginTop: 6 }}>
            {answer}
          </p>
        )}
      </div>
    </div>
  );
}

export function MarketsPage({ panel }: MarketsPageProps) {
  const highlightSimulator = panel === "sim";
  const [showSimulator, setShowSimulator] = useState(panel === "sim");

  useEffect(() => {
    setShowSimulator(panel === "sim");
  }, [panel]);

  const openSimulator = () => {
    setShowSimulator(true);
    window.location.hash = "#markets?panel=sim";
  };

  const closeSimulator = () => {
    setShowSimulator(false);
    if (window.location.hash.includes("panel=sim")) {
      window.location.hash = "#markets";
    }
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="card pad">
        <div className="title">Markets 🔥 workspace</div>
        <p className="subtle">
          Bloomberg-light view of everything that matters: watchlists, heat map, earnings, alerts, AI commentary, and backtests.
        </p>
        <div className="pill-row" style={{ marginTop: 16 }}>
          {[
            { label: "MarketPulse", target: "pulse" },
            { label: "Sentiment watchlist", target: "watchlist" },
            { label: "Heat map", target: "heatmap" },
            { label: "Backtests & simulator", target: "backtests" },
          ].map((link) => (
            <button
              key={link.target}
              className="chip"
              onClick={() =>
                document.getElementById(link.target)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-split" style={{ marginTop: 22 }}>
        <div className="page-stack">
          <div id="pulse">
            <MarketPulse />
          </div>

          <div className="card pad" id="watchlist">
            <div className="title">Sentiment-powered watchlist</div>
            <div className="market-grid">
              {sentimentWatchlist.map((row) => (
                <div key={row.symbol} className="market-card">
                  <div className="market-symbol">
                    <span>{row.symbol}</span>
                    <span className="badge">{row.sentiment}</span>
                  </div>
                  <div className="market-price-row">
                    <div>
                      <p className="muted tiny">Move</p>
                      <div className="market-price">{row.move}</div>
                    </div>
                    <div className={`market-change ${row.move.includes("-") ? "neg" : "pos"}`}>
                      Score {row.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad" id="heatmap">
            <div className="title">Market heat map</div>
            <div className="heatmap">
              {heatMap.map((tile) => (
                <div key={tile.sector} className="heat-tile">
                  <strong>{tile.sector}</strong>
                  <p className={tile.change.includes("-") ? "status-negative" : "status-positive"}>{tile.change}</p>
                  <p className="muted tiny">{tile.tone}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Alert center</div>
            <ul className="list-clean">
              {alertFeed.map((alert) => (
                <li key={alert.title}>
                  <strong className={alert.type === "negative" ? "status-negative" : "status-positive"}>
                    {alert.title}
                  </strong>
                  <p className="muted tiny">{alert.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad" id="earnings">
            <div className="title">Earnings calendar</div>
            <div className="timeline-grid">
              {earningsCalendar.map((event) => (
                <div key={event.company} className="timeline-row">
                  <div>
                    <strong>{event.company}</strong>
                    <p className="muted tiny">{event.focus}</p>
                  </div>
                  <span>{event.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="card pad"
            id="backtests"
            style={
              highlightSimulator
                ? {
                    borderColor: "rgba(52, 211, 153, 0.7)",
                    boxShadow: "0 20px 45px rgba(16, 185, 129, 0.35)",
                  }
                : undefined
            }
          >
            <div className="title">Backtests & simulator</div>
            <p className="muted">
              Quickly compare strategy CAGR and drawdowns, then jump into the simulator for deeper what-ifs.
            </p>
            <div className="timeline-grid">
              {backtests.map((row) => (
                <div key={row.name} className="timeline-row">
                  <div>
                    <strong>{row.name}</strong>
                    <p className="muted tiny">{row.insight}</p>
                  </div>
                  <span>
                    <span className="status-positive">{row.cagr}</span> ·{" "}
                    <span className="status-negative">{row.drawdown}</span>
                  </span>
                </div>
              ))}
            </div>
            <button
              className="glow-btn"
              style={{ marginTop: 16 }}
              onClick={openSimulator}
            >
              Launch simulator
            </button>
          </div>

          <AnalystPanel />

          {showSimulator && (
            <div className="card pad" id="simulator-panel">
              <div className="title">
                Portfolio simulator
                <button
                  className="ghost"
                  onClick={closeSimulator}
                  style={{ marginLeft: "auto", fontSize: 12, padding: "4px 8px" }}
                >
                  Close
                </button>
              </div>
              <div className="simulator-embed" style={{ marginTop: 12, maxHeight: 620, overflowY: "auto" }}>
                <SimulatorPage />
              </div>
            </div>
          )}

          <div className="card pad">
            <div className="title">Predictive commentary</div>
            <div className="pill-row">
              {commentaryStrip.map((note) => (
                <span key={note} className="pill">
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatAnalystAnswer(raw: string) {
  if (!raw) return [];
  return raw
    .split(/[.\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}
