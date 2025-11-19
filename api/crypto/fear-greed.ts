import type { VercelRequest, VercelResponse } from "@vercel/node";

type CoinGeckoResp = {
  usd?: number;
  usd_24h_change?: number;
};

async function fetchFearGreed() {
  const resp = await fetch("https://api.alternative.me/fng/?limit=1&format=json");
  if (!resp.ok) {
    throw new Error(`Fear & Greed index error ${resp.status}`);
  }
  const payload = await resp.json();
  const item = payload?.data?.[0];
  if (!item) {
    throw new Error("Fear & Greed returned no data");
  }
  return {
    value: Number(item.value) || 0,
    label: item.value_classification || "Unknown",
    source: "alternative.me",
    updatedAt: item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : undefined,
  };
}

async function fetchMarket() {
  try {
    const params = new URLSearchParams({
      ids: "bitcoin,ethereum",
      vs_currencies: "usd",
      include_24hr_change: "true",
    });
    const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params.toString()}`);
    if (!resp.ok) throw new Error(`CoinGecko responded ${resp.status}`);
    const json = (await resp.json()) as Record<string, CoinGeckoResp>;
    return {
      btc: json.bitcoin
        ? { priceUsd: json.bitcoin.usd ?? 0, change24h: json.bitcoin.usd_24h_change ?? 0 }
        : undefined,
      eth: json.ethereum
        ? { priceUsd: json.ethereum.usd ?? 0, change24h: json.ethereum.usd_24h_change ?? 0 }
        : undefined,
    };
  } catch (error) {
    console.error("CoinGecko fetch error", error);
    return undefined;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const index = await fetchFearGreed();
    const market = await fetchMarket();
    res.status(200).json({ index, market });
  } catch (error) {
    console.error("Crypto fear & greed error", error);
    res.status(500).json({ error: "Failed to load crypto fear & greed" });
  }
}
