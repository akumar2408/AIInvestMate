import { useState } from "react";
import { MarketCard } from "./MarketCard";

const DEFAULT_TICKERS = ["SPY", "QQQ", "VOO"];
const QUICK_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "BTC-USD", "GLD"];

export function MarketPulse() {
  const [input, setInput] = useState("");
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);

  const addTicker = (rawSymbol: string) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) return;
    if (!tickers.includes(symbol)) {
      setTickers((prev) => [...prev, symbol]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTicker(input);
    setInput("");
  };

  const handleRemove = (symbol: string) => {
    setTickers((prev) => prev.filter((s) => s !== symbol));
  };

  return (
    <section className="card pad market-pulse">
      <div className="market-pulse__header">
        <div>
          <p className="eyebrow">Market Pulse</p>
          <h2 className="market-pulse__headline">Realtime view of the macro tape</h2>
          <p className="muted">
            Monitor flagship ETFs and layer in the tickers you care about for a quick trading desk snapshot.
          </p>
        </div>
        <div className="market-pulse__badges">
          <span className="badge">Realtime via Finnhub</span>
          <span className="badge subtle">Auto-refresh · 60s cadence</span>
        </div>
      </div>

      <div className="market-pulse__stat-grid">
        <article className="market-pulse__stat">
          <p className="eyebrow tiny">Watchlist</p>
          <div className="market-pulse__stat-value">{tickers.length}</div>
          <p className="muted tiny">symbols being tracked</p>
        </article>
        <article className="market-pulse__stat">
          <p className="eyebrow tiny">Default set</p>
          <div className="market-pulse__stat-value">{DEFAULT_TICKERS.join(" · ")}</div>
          <p className="muted tiny">broad market coverage</p>
        </article>
        <article className="market-pulse__stat">
          <p className="eyebrow tiny">Status</p>
          <div className="market-pulse__stat-value status-positive">Synced · smooth</div>
          <p className="muted tiny">refreshing every 60 seconds</p>
        </article>
      </div>

      <form onSubmit={handleSubmit} className="market-pulse__form">
        <label className="eyebrow tiny" htmlFor="ticker-input">
          Add ticker
        </label>
        <div className="market-pulse__form-row">
          <input
            id="ticker-input"
            className="market-pulse__input"
            placeholder="Type a symbol like AAPL or BTC-USD"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="glow-btn">
            Add to watchlist
          </button>
        </div>
      </form>

      <div className="market-pulse__quick-add">
        <span className="eyebrow tiny">Quick add</span>
        {QUICK_TICKERS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => addTicker(symbol)}
            className="market-pulse__chip"
          >
            {symbol}
          </button>
        ))}
      </div>

      <div className="watch-grid">
        {tickers.map((symbol) => (
          <div key={symbol} className="watch-grid__item">
            <MarketCard symbol={symbol} />
            {!DEFAULT_TICKERS.includes(symbol) && (
              <button
                type="button"
                onClick={() => handleRemove(symbol)}
                className="market-pulse__remove"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
