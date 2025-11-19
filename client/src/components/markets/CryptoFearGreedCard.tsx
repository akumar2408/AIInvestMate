import React, { useEffect, useMemo, useState } from "react";

type CryptoFearGreedResponse = {
  index: {
    value: number;
    label: string;
    source: string;
    updatedAt?: string;
  };
  market?: {
    btc?: { priceUsd: number; change24h: number };
    eth?: { priceUsd: number; change24h: number };
  };
};

function classifyMood(value: number) {
  if (value <= 24) {
    return { color: "text-rose-400", label: "Extreme Fear" };
  }
  if (value <= 44) {
    return { color: "text-amber-400", label: "Fear" };
  }
  if (value <= 55) {
    return { color: "text-slate-200", label: "Neutral" };
  }
  if (value <= 74) {
    return { color: "text-emerald-300", label: "Greed" };
  }
  return { color: "text-lime-300", label: "Extreme Greed" };
}

export function CryptoFearGreedCard() {
  const [data, setData] = useState<CryptoFearGreedResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/crypto/fear-greed");
        if (!res.ok) {
          throw new Error("Failed to load /api/crypto/fear-greed");
        }
        const body = (await res.json()) as CryptoFearGreedResponse;
        if (!active) return;
        setData(body);
        setStatus("ready");
      } catch (error) {
        console.error("Crypto fear & greed load failed", error);
        if (active) {
          setStatus("error");
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const mood = useMemo(() => classifyMood(data?.index?.value ?? 0), [data?.index?.value]);

  const MarketRow = ({ label, price, change }: { label: string; price: number; change: number }) => (
    <div className="flex items-center justify-between text-[13px] text-slate-300">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span>${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span className={change >= 0 ? "text-emerald-300" : "text-rose-400"}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 flex flex-col gap-4 text-slate-100 h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Crypto Fear & Greed</p>
          <p className="text-[13px] text-slate-500">Index powered by alternative.me</p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded-full border border-slate-600 bg-slate-800/60">
          Sentiment
        </span>
      </div>

      {status === "loading" && <p className="text-sm text-slate-400">Loading crypto sentiment…</p>}
      {status === "error" && (
        <p className="text-sm text-amber-300">Crypto sentiment is offline right now.</p>
      )}

      {status === "ready" && data && (
        <>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-bold text-white">{data.index?.value ?? "—"}</span>
            <div className="flex flex-col">
              <span className={`text-base font-semibold ${mood.color}`}>
                {data.index?.label || mood.label}
              </span>
              <span className="text-xs text-slate-400">
                {data.index?.updatedAt
                  ? new Date(data.index.updatedAt).toLocaleString()
                  : "Live data"}
              </span>
            </div>
          </div>

          {(data.market?.btc || data.market?.eth) && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 space-y-2">
              {data.market?.btc && (
                <MarketRow
                  label="BTC"
                  price={data.market.btc.priceUsd}
                  change={data.market.btc.change24h}
                />
              )}
              {data.market?.eth && (
                <MarketRow
                  label="ETH"
                  price={data.market.eth.priceUsd}
                  change={data.market.eth.change24h}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
