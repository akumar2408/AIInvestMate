import { useEffect, useState } from "react";
import { MarketCard } from "./MarketCard";

const DEFAULT_TICKERS = ["SPY", "QQQ", "VOO"];
const QUICK_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "BTC-USD", "GLD"];

// how many symbols to show per "page"
const PAGE_SIZE = 3;

export function MarketPulse() {
  const [input, setInput] = useState("");
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [page, setPage] = useState(0);

  // Ensure the current page is always valid when tickers change
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(tickers.length / PAGE_SIZE) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [tickers, page]);

  const addTicker = (rawSymbol: string) => {
    const symbol = rawSymbol.trim().toUpperCase();
    if (!symbol) return;
    if (!tickers.includes(symbol)) {
      setTickers((prev) => [...prev, symbol]);
      // jump to the last page so the new symbol is visible
      const nextLength = tickers.length + 1;
      const nextPage = Math.ceil(nextLength / PAGE_SIZE) - 1;
      setPage(nextPage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTicker(input);
    setInput("");
  };

  const handleRemove = (symbol: string) => {
    // don’t allow deleting the very last ticker
    setTickers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s !== symbol);
    });
  };

  const totalPages = Math.max(1, Math.ceil(tickers.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageTickers = tickers.slice(start, end);

  return (
    <section className="w-full rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950/40 p-6 shadow-[0_35px_120px_rgba(2,6,23,0.65)]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Market Pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white tracking-tight">
            Realtime view of the macro tape
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor flagship ETFs and layer in the tickers you care about for a quick trading
            desk snapshot.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-emerald-300">
            Realtime via Finnhub
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-slate-400">
            Auto-refresh · 60s cadence
          </span>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 text-sm text-slate-300 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Watchlist</p>
          <p className="mt-2 text-2xl font-semibold text-white">{tickers.length}</p>
          <p className="text-xs text-slate-500">symbols being tracked</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Default set</p>
          <p className="mt-2 text-lg font-medium text-white">{DEFAULT_TICKERS.join(" · ")}</p>
          <p className="text-xs text-slate-500">broad market coverage</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Status</p>
          <p className="mt-2 text-lg font-medium text-emerald-300">Synced · smooth</p>
          <p className="text-xs text-slate-500">refreshing every 60 seconds</p>
        </div>
      </div>

      {/* Add ticker form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 shadow-inner shadow-black/20 sm:flex-row sm:items-center"
      >
        <div className="flex-1">
          <label className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Add ticker
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Type a symbol like AAPL or BTC-USD"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:brightness-105"
        >
          Add to watchlist
        </button>
      </form>

      {/* Quick add row */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
          Quick add
        </span>
        {QUICK_TICKERS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => addTicker(symbol)}
            className="rounded-full border border-slate-700/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300 transition hover:border-emerald-400/70 hover:text-white"
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* Watchlist cards (paged + capped height) */}
      <div className="mt-6 space-y-4">
        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {pageTickers.map((symbol) => (
            <div key={symbol} className="relative group">
              <MarketCard symbol={symbol} />
              <button
                type="button"
                onClick={() => handleRemove(symbol)}
                className="absolute -top-2 -right-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 opacity-0 transition hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                remove
              </button>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-slate-700 px-3 py-1 font-semibold uppercase tracking-[0.15em] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page === totalPages - 1}
                className="rounded-full border border-slate-700 px-3 py-1 font-semibold uppercase tracking-[0.15em] disabled:opacity-40"
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`h-2 w-2 rounded-full ${
                    i === page ? "bg-emerald-400" : "bg-slate-700"
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

