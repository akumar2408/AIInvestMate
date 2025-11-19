import React, { useEffect, useState } from "react";
import AIChat from "./components/AIChat";
import "./styles.css";

const quickActions = [
  "Add transaction",
  "Set a spending rule",
  "Create a new goal",
  "Import CSV",
  "Schedule call with advisor"
];

const pulseMetrics = [
  { label: "Net worth", value: "$182,400", trend: "+6.2% MoM" },
  { label: "30‑day spend", value: "$4,280", trend: "‑12% vs avg" },
  { label: "Invested", value: "$118,900", trend: "+$1,200 today" }
];

const insightTiles = [
  {
    title: "Cash runway",
    value: "8.3 months",
    detail: "Covering lifestyle, loans, and investments"
  },
  {
    title: "Saving rate",
    value: "42%",
    detail: "Ahead of your FIRE target by 3 months"
  },
  {
    title: "Diversification",
    value: "Balanced",
    detail: "Equities 54%, Fixed income 28%, Alt 18%"
  }
];

const agenda = [
  { title: "Rebalance growth portfolio", time: "Today · 2:00p", type: "task" },
  { title: "Mortgage payment", time: "Due in 4 days", type: "reminder" },
  { title: "Review emergency fund", time: "Next check‑in", type: "insight" }
];

export default function App() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="app-shell">
      <div className="plasma plasma-one" aria-hidden />
      <div className="plasma plasma-two" aria-hidden />
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-badge">💹</div>
            <div>
              <p className="eyebrow">AI InvestMate</p>
              <h1>Personal wealth copilot</h1>
            </div>
          </div>
          <div className="header-actions">
            <div className="live-clock" aria-live="polite">
              <span className="live-dot" aria-hidden />
              <span className="live-label">Live</span>
              <span className="live-sep">•</span>
              <span className="live-date">{dateLabel}</span>
              <span className="live-sep">·</span>
              <span className="live-time">{timeLabel}</span>
            </div>
            <nav className="nav">
              <a href="#">Dashboard</a>
              <a href="#">Cash flow</a>
              <a href="#">Investing</a>
              <a href="#">Goals</a>
              <button className="glow-btn">Upgrade</button>
            </nav>
          </div>
        </header>

        <section className="hero-grid">
          <div className="panel hero-panel">
            <p className="eyebrow">Welcome back, Aayush 👋</p>
            <h2>Clarity across every account, with AI superpowers built‑in.</h2>
            <p className="muted">
              Streamline spending reviews, visualize your investment runway, and ask InvestMate for scenario planning on the fly.
            </p>
            <div className="hero-actions">
              <button className="btn">Ask the assistant</button>
              <button className="ghost">Start what‑if</button>
            </div>
            <div className="pulse-grid">
              {pulseMetrics.map(metric => (
                <div key={metric.label} className="pulse-card">
                  <span className="muted tiny">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <span className="trend">{metric.trend}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel overview-panel">
            <div className="glow-card">
              <div>
                <p className="muted tiny">Total assets</p>
                <h3>$248,920</h3>
              </div>
              <div className="sparkline" aria-hidden />
            </div>
            <div className="agenda">
              {agenda.map(item => (
                <div key={item.title} className={`agenda-item ${item.type}`}>
                  <div>
                    <p>{item.title}</p>
                    <span className="muted tiny">{item.time}</span>
                  </div>
                  <span className="pill">{item.type}</span>
                </div>
              ))}
            </div>
            <div className="quick-actions">
              <p className="muted tiny">Quick actions</p>
              <div className="suggest">
                {quickActions.map(action => (
                  <button key={action} className="chip">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="insight-grid">
          {insightTiles.map(tile => (
            <div key={tile.title} className="panel insight">
              <p className="muted tiny">{tile.title}</p>
              <h3>{tile.value}</h3>
              <p className="muted">{tile.detail}</p>
            </div>
          ))}
        </section>

        <section className="chat-section">
          <div className="panel">
            <AIChat />
          </div>
          <div className="panel secondary">
            <div className="secondary-header">
              <p className="eyebrow">Moments</p>
              <span className="muted tiny">Live updates</span>
            </div>
            <ul className="timeline">
              <li>
                <span className="muted tiny">Now</span>
                <p>InvestMate auto‑categorized 6 new transactions</p>
              </li>
              <li>
                <span className="muted tiny">1h ago</span>
                <p>Portfolio drifted +3.4% vs target, consider rebalancing</p>
              </li>
              <li>
                <span className="muted tiny">Yesterday</span>
                <p>Savings goal “Lisbon remote year” hit 78% funded</p>
              </li>
              <li>
                <span className="muted tiny">This week</span>
                <p>Cash flow alert · Dining up 18% week over week</p>
              </li>
            </ul>
            <div className="panel footer-card">
              <p className="muted">Need a human touch? Share your chat transcript with your advisor in one click.</p>
              <button className="glow-btn full">Share securely</button>
            </div>
          </div>
        </section>

        <footer className="footer">© {new Date().getFullYear()} AI InvestMate · Crafted with care</footer>
      </div>
    </div>
  );
}
