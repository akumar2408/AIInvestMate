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

type CryptoFearGreedCardProps = {
  id?: string;
};

function classifyMood(value: number) {
  if (value <= 24) {
    return { tone: "status-negative", label: "Extreme Fear" };
  }
  if (value <= 44) {
    return { tone: "status-negative", label: "Fear" };
  }
  if (value <= 55) {
    return { tone: "", label: "Neutral" };
  }
  if (value <= 74) {
    return { tone: "status-positive", label: "Greed" };
  }
  return { tone: "status-positive", label: "Extreme Greed" };
}

export function CryptoFearGreedCard({ id }: CryptoFearGreedCardProps) {
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

  const hasMarket = Boolean(data?.market?.btc || data?.market?.eth);

  const renderCoinCard = (
    label: string,
    stats?: { priceUsd: number; change24h: number }
  ) => {
    if (!stats) return null;
    const changeClass = stats.change24h >= 0 ? "market-change pos" : "market-change neg";
    return (
      <div key={label} className="market-card">
        <div className="market-symbol">
          <span>{label}</span>
          <span className="badge">24h</span>
        </div>
        <div className="market-price-row">
          <div>
            <p className="muted tiny">Spot</p>
            <div className="market-price">
              ${stats.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={changeClass}>
            {stats.change24h >= 0 ? "+" : ""}
            {stats.change24h.toFixed(2)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card pad" id={id}>
      <div className="title">Crypto fear &amp; greed</div>
      <p className="muted tiny">
        Live index plus BTC/ETH snapshots powered by alternative.me and CoinGecko.
      </p>

      {status === "loading" && (
        <p className="muted tiny" style={{ marginTop: 12 }}>
          Loading crypto sentiment…
        </p>
      )}
      {status === "error" && (
        <p className="status-negative tiny" style={{ marginTop: 12 }}>
          Crypto sentiment is offline right now.
        </p>
      )}

      {status === "ready" && data && (
        <>
          <div className="stat-grid" style={{ marginTop: 18 }}>
            <div className="stat-card">
              <p className="label">Index value</p>
              <div className="value">{data.index?.value ?? "—"}</div>
              <p className={`${mood.tone || "muted"} tiny`}>
                {data.index?.label || mood.label}
              </p>
            </div>
            <div className="stat-card">
              <p className="label">Last update</p>
              <div className="value" style={{ fontSize: "1.1rem" }}>
                {data.index?.updatedAt
                  ? new Date(data.index.updatedAt).toLocaleString()
                  : "Live data"}
              </div>
              <p className="muted tiny">Source {data.index?.source || "alternative.me"}</p>
            </div>
          </div>

          {hasMarket && (
            <>
              <p className="muted tiny" style={{ marginTop: 20 }}>
                Coin snapshots
              </p>
              <div className="market-grid">
                {renderCoinCard("BTC", data.market?.btc)}
                {renderCoinCard("ETH", data.market?.eth)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
