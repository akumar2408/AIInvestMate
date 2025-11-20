import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MarketPulse } from "@/components/MarketPulse";
import { CryptoFearGreedCard } from "@/components/markets/CryptoFearGreedCard";
import { SimulatorPage } from "./simulator";

type MarketsPageProps = {
  panel?: string;
};

type SentimentItem = {
  symbol: string;
  movePct: number;
  sentimentScore: number | null;
};

type EarningsItem = {
  symbol: string;
  date: string;
  hour: string;
  epsActual: number | null;
  epsEstimate: number | null;
};

type AlertItem = {
  title: string;
  body: string;
};

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

function AnalystPanel({ watchlist = [] }: { watchlist?: SentimentItem[] }) {
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
            watchlist,
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
  const [simModalOpen, setSimModalOpen] = useState(panel === "sim");
  const [earnings, setEarnings] = useState<EarningsItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  useEffect(() => {
    setSimModalOpen(panel === "sim");
  }, [panel]);

  const openSimulator = () => {
    setSimModalOpen(true);
    window.location.hash = "#markets?panel=sim";
  };

  const closeSimulator = () => {
    setSimModalOpen(false);
    if (window.location.hash.includes("panel=sim")) {
      window.location.hash = "#markets";
    }
  };

  const loadMarketData = useCallback(async () => {
    const fetchJson = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load ${url}`);
      }
      return res.json();
    };

    const [earningsRes, alertsRes] = await Promise.all([
      fetchJson("/api/markets/earnings"),
      fetchJson("/api/markets/alerts"),
    ]);

    return {
      earnings: Array.isArray(earningsRes?.earnings) ? earningsRes.earnings : [],
      alerts: Array.isArray(alertsRes?.alerts) ? alertsRes.alerts : [],
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setMarketLoading(true);
      try {
        const data = await loadMarketData();
        if (!active) return;
        setEarnings(data.earnings);
        setAlerts(data.alerts);
      } catch (error) {
        if (active) {
          console.error("Markets data load failed", error);
          setEarnings([]);
          setAlerts([]);
        }
      } finally {
        if (active) {
          setMarketLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadMarketData]);

  return (
    <section style={{ marginTop: 12 }}>
      <div className="card pad">
        <div className="title">Markets 🔥 workspace</div>
        <p className="subtle">
          Bloomberg-light view of everything that matters: live pulse, crypto sentiment, earnings, alerts, AI commentary, and backtests.
        </p>
        <div className="pill-row" style={{ marginTop: 16 }}>
          {[
            { label: "MarketPulse", target: "pulse" },
            { label: "Crypto sentiment", target: "crypto-sentiment" },
            { label: "Earnings", target: "earnings" },
            { label: "Backtests & simulator", target: "backtests" },
            { label: "AI analyst", target: "analyst" },
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

          <CryptoFearGreedCard id="crypto-sentiment" />

          <div className="card pad" id="alerts">
            <div className="title">Alert center</div>
            {alerts.length ? (
              <ul className="list-clean">
                {alerts.map((alert) => (
                  <li key={alert.title}>
                    <strong className={alert.title.includes("-") ? "status-negative" : "status-positive"}>
                      {alert.title}
                    </strong>
                    <p className="muted tiny">{alert.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted tiny">
                {marketLoading ? "Watching for live alerts…" : "No alerts detected right now."}
              </p>
            )}
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad" id="earnings">
            <div className="title">Earnings calendar</div>
            {earnings.length ? (
              <div className="timeline-grid">
                {earnings.map((event) => (
                  <div key={`${event.symbol}-${event.date}-${event.hour}`} className="timeline-row">
                    <div>
                      <strong>{event.symbol}</strong>
                      <p className="muted tiny">
                        {event.date} · {event.hour || "TBD"} · {formatEarningsLine(event)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted tiny">
                {marketLoading ? "Fetching earnings window…" : "No upcoming earnings in the next 30 days."}
              </p>
            )}
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
            <button className="glow-btn" style={{ marginTop: 16 }} onClick={openSimulator}>
              Launch simulator
            </button>
          </div>

          <AnalystPanel />

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

      {simModalOpen && (
        <div className="sim-modal-overlay" role="dialog" aria-modal="true">
          <div className="sim-modal">
            <div className="sim-modal__header">
              <div>
                <h3>Portfolio simulator</h3>
                <p className="muted tiny">Model contributions, returns, and goal timelines without leaving Markets.</p>
              </div>
              <button className="ghost" onClick={closeSimulator}>
                Close
              </button>
            </div>
            <div className="sim-modal__body">
              <SimulatorPage />
            </div>
          </div>
        </div>
      )}
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

function formatEarningsLine(event: EarningsItem) {
  if (event.epsActual != null && event.epsEstimate != null) {
    return `EPS ${event.epsActual.toFixed(2)} vs ${event.epsEstimate.toFixed(2)}`;
  }
  if (event.epsEstimate != null) {
    return `EPS est ${event.epsEstimate.toFixed(2)}`;
  }
  return "EPS TBA";
}
