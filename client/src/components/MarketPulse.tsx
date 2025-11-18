import { useState } from "react";
import { MarketCard } from "./MarketCard";

const DEFAULT_TICKERS = ["SPY", "QQQ", "VOO"];
const QUICK_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "PLTR", "GLD"];

// 1long
const PAGE_SIZE = 3;

export function MarketPulse() {
  const [input, setInput] = useState("");
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(tickers.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visibleTickers = tickers.slice(start, start + PAGE_SIZE);

  const addTicker = (rawSymbol: string) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) return;

    setTickers((prev) => {
      if (prev.includes(symbol)) return prev;
      const next = [...prev, symbol];
      const newTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      // jump to last page so the new symbol is visible
      setPage(newTotalPages);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTicker(input);
    setInput("");
  };

  const handleRemove = (symbol: string) => {
    setTickers((prev) => {
      const next = prev.filter((s) => s !== symbol);
      const newTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setPage((current) => Math.min(current, newTotalPages));
      return next;
    });
  };

  const handleResetDesk = () => {
    setTickers(DEFAULT_TICKERS);
    setPage(1);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <section className="card pad market-pulse">
      {/* Header */}
      <div className="market-pulse__header">
        <div>
          <p className="eyebrow">Market Pulse</p>
          <h2 className="market-pulse__title">
            Realtime view of the macro tape
          </h2>
          <p className="muted">
            Monitor flagship ETFs and layer in the tickers you care about for a
            quick trading desk snapshot.
          </p>
        </div>
        <div className="market-pulse__badges">
          <span className="badge">Realtime via Finnhub</span>
          <span className="badge subtle">Auto-refresh · 60s cadence</span>
        </div>
      </div>

      {/* Add ticker form starts immediately after header */}
      <form onSubmit={handleSubmit} className="market-pulse__form">
        <label className="watchlist-field">
          <span>Add ticker</span>
          <input
            className="market-pulse__input"
            placeholder="Type a symbol like AAPL or BTC-USD"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Add ticker symbol"
          />
        </label>
        <button type="submit" className="glow-btn market-pulse__submit">
          Add to watchlist
        </button>
      </form>


      {/* Quick add chips */}
      <div className="market-pulse__chips">
        <span className="muted tiny">Quick add</span>
        <div className="market-pulse__chip-row">
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
      </div>

      {/* Cards */}
      <div className="market-pulse__grid-shell">
        {visibleTickers.length > 0 ? (
          <div className="market-pulse__grid">
            {visibleTickers.map((symbol) => (
              <div key={symbol} className="market-pulse__card">
                {/* MarketCard owns its own remove button */}
                <MarketCard symbol={symbol} onRemove={() => handleRemove(symbol)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="market-pulse__empty">
            <p>No symbols on this desk yet.</p>
            <p className="muted tiny">
              Add a ticker above or reset the desk to bring back the defaults.
            </p>
            <button
              type="button"
              onClick={handleResetDesk}
              className="market-pulse__meta-reset"
            >
              Reset to default desk
            </button>
          </div>
        )}
      </div>

      {/* Pager controls */}
      {totalPages > 1 && (
        <div className="market-pulse__pagination">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => canGoPrev && setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => canGoNext && setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
