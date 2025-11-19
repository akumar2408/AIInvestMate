import express from "express";

type FearGreedIndex = {
  value: number;
  label: string;
  source: string;
  updatedAt?: string;
};

type CoinGeckoPrice = {
  usd: number;
  usd_24h_change: number;
};

const cryptoRouter = express.Router();

async function fetchFearGreed(): Promise<FearGreedIndex> {
  const resp = await fetch("https://api.alternative.me/fng/?limit=1&format=json");
  if (!resp.ok) {
    throw new Error(`Fear & Greed API responded ${resp.status}`);
  }

  const payload = await resp.json();
  const first = payload?.data?.[0];

  if (!first) {
    throw new Error("Fear & Greed API returned no data");
  }

  const value = Number(first.value) || 0;
  const updatedAt = first.timestamp
    ? new Date(Number(first.timestamp) * 1000).toISOString()
    : undefined;

  return {
    value,
    label: first.value_classification || "Unknown",
    source: "alternative.me",
    updatedAt,
  };
}

async function fetchCryptoMarket() {
  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
    );
    if (!resp.ok) {
      throw new Error(`CoinGecko responded ${resp.status}`);
    }

    const data = (await resp.json()) as Record<string, CoinGeckoPrice>;
    return {
      btc: data.bitcoin
        ? {
            priceUsd: data.bitcoin.usd ?? 0,
            change24h: data.bitcoin.usd_24h_change ?? 0,
          }
        : undefined,
      eth: data.ethereum
        ? {
            priceUsd: data.ethereum.usd ?? 0,
            change24h: data.ethereum.usd_24h_change ?? 0,
          }
        : undefined,
    };
  } catch (error) {
    console.error("CoinGecko fetch error", error);
    return undefined;
  }
}

cryptoRouter.get("/api/crypto/fear-greed", async (_req, res) => {
  try {
    const index = await fetchFearGreed();
    const market = await fetchCryptoMarket();

    res.json({
      index,
      market,
    });
  } catch (error) {
    console.error("Crypto fear & greed error", error);
    res.status(500).json({ error: "Failed to load crypto fear & greed" });
  }
});

export default cryptoRouter;
