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
    <section className="w-full rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950/40 p-6 shadow-[0_35px_120px_rgba(2,6,23,0.65)]">
      {/* header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Market Pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Realtime view of the macro tape
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor flagship ETFs and layer in the tickers you care about for a quick trading desk snapshot.
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

      {/* stats row */}
      <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 text-sm text-slate-300 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Watchlist
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{tickers.length}</p>
          <p className="text-xs text-slate-500">symbols being tracked</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Default set
          </p>
          <p className="mt-2 text-lg font-medium text-white">
            {DEFAULT_TICKERS.join(" · ")}
          </p>
          <p className="text-xs text-slate-500">broad market coverage</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
            Status
          </p>
          <p className="mt-2 text-lg font-medium text-emerald-300">
            Synced · smooth
          </p>
          <p className="text-xs text-slate-500">refreshing every 60 seconds</p>
        </div>
      </div>

      {/* add-ticker form */}
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

      {/* quick add */}
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

      {/* watchlist grid – this is what keeps it compact instead of running down the whole page */}
      <div className="mt-6 max-h-[360px] grid grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {tickers.map((symbol) => (
          <div key={symbol} className="relative group">
            <MarketCard symbol={symbol} />
            {!DEFAULT_TICKERS.includes(symbol) && (
              <button
                type="button"
                onClick={() => handleRemove(symbol)}
                className="absolute -top-2 -right-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-white focus-visible:opacity-100"
              >
                remove
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
