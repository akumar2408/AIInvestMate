import { useState } from "react";
import { MarketCard } from "./MarketCard";

const DEFAULT_TICKERS = ["SPY", "QQQ", "VOO"];
const QUICK_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "BTC-USD", "GLD"];

// How many cards per “page” in the desk
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
      // jump to the last page so the new symbol is visible
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
    <section className="card pad">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow">Market Pulse</p>
          <h2 className="hero-panel h2 text-[1.7rem] font-semibold leading-tight">
            Realtime view of the macro tape
          </h2>
          <p className="muted">
            Monitor flagship ETFs and layer in the tickers you care about for a quick trading desk snapshot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <span className="badge">Realtime via Finnhub</span>
          <span className="badge subtle">Auto-refresh · 60s cadence</span>
        </div>
      </div>

      {/* Stat row */}
      <div className="market-pulse__stat-grid stat-grid mt-5">
        <article className="stat-card">
          <p className="label">Watchlist</p>
          <div className="value">{tickers.length}</div>
          <p className="muted tiny">symbols being tracked</p>
        </article>

        <article className="stat-card">
          <p className="label">Default set</p>
          <div className="value text-base md:text-lg">
            {DEFAULT_TICKERS.join(" · ")}
          </div>
          <p className="muted tiny">broad market coverage</p>
          <button
            type="button"
            onClick={handleResetDesk}
            className="mt-3 inline-flex items-center rounded-full border border-slate-600/60 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
          >
            Reset to default desk
          </button>
        </article>

        <article className="stat-card">
          <p className="label">Status</p>
          <div className="value status-positive">Synced · smooth</div>
          <p className="muted tiny">refreshing every 60 seconds</p>
          <p className="muted tiny mt-2">
            Page {page} of {totalPages}
          </p>
        </article>
      </div>

      {/* Add ticker form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 md:flex-row md:items-center"
      >
        <div className="flex-1">
          <label className="muted tiny block mb-1">Add ticker</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
            placeholder="Type a symbol like AAPL or BTC-USD"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="glow-btn px-5 py-2.5 text-sm font-semibold"
        >
          Add to watchlist
        </button>
      </form>

      {/* Quick add chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="muted tiny">Quick add</span>
        {QUICK_TICKERS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => addTicker(symbol)}
            className="rounded-full border border-slate-600/70 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-emerald-400/70 hover:text-emerald-100"
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Cards – kept compact with internal scroll + pagination */}
      <div className="mt-5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {visibleTickers.map((symbol) => (
          <div key={symbol} className="relative group">
            <MarketCard symbol={symbol} />
            <button
              type="button"
              onClick={() => handleRemove(symbol)}
              className="absolute -top-2 -right-2 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-slate-100"
            >
              remove
            </button>
          </div>
        ))}

        {visibleTickers.length === 0 && (
          <p className="muted text-sm">
            No symbols on this desk yet. Add a ticker above to get started.
          </p>
        )}
      </div>

      {/* Pager controls */}
      <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => canGoPrev && setPage((p) => p - 1)}
          className={`rounded-full border px-3 py-1 ${
            canGoPrev
              ? "border-slate-600 hover:border-emerald-400 hover:text-emerald-200"
              : "border-slate-800 opacity-40 cursor-not-allowed"
          }`}
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
          className={`rounded-full border px-3 py-1 ${
            canGoNext
              ? "border-slate-600 hover:border-emerald-400 hover:text-emerald-200"
              : "border-slate-800 opacity-40 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </section>
  );
}
