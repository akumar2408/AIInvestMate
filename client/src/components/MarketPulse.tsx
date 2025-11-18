import { useState } from "react";
import { MarketCard } from "./MarketCard";

const DEFAULT_TICKERS = ["SPY", "QQQ", "VOO"];

export function MarketPulse() {
  const [input, setInput] = useState("");
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    if (!tickers.includes(symbol)) {
      setTickers((prev) => [...prev, symbol]);
    }
    setInput("");
  };

  const handleRemove = (symbol: string) => {
    setTickers((prev) => prev.filter((s) => s !== symbol));
  };

  return (
    <section className="rounded-3xl bg-slate-950/60 border border-slate-800/80 p-5 space-y-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.18em] text-slate-400 uppercase">Market Pulse</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track broad market ETFs or search for any ticker you care about.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/5">
          Realtime via Finnhub
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          className="bg-slate-900/70 border border-slate-700/70 rounded-xl px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 flex-1"
          placeholder="Add ticker (e.g. AAPL)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
        >
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tickers.map((symbol) => (
          <div key={symbol} className="relative group">
            <MarketCard symbol={symbol} />
            {!DEFAULT_TICKERS.includes(symbol) && (
              <button
                type="button"
                onClick={() => handleRemove(symbol)}
                className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-300 opacity-0 group-hover:opacity-100 transition"
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
