import type { VercelRequest, VercelResponse } from "@vercel/node";
import { finnhubGet } from "./utils";

type HeatmapItem = {
  sector: string;
  symbol: string;
  movePct: number;
};

const SECTOR_PROXIES = [
  { sector: "Technology", symbol: "XLK" },
  { sector: "Energy", symbol: "XLE" },
  { sector: "Financials", symbol: "XLF" },
  { sector: "Healthcare", symbol: "XLV" },
  { sector: "Consumer Discretionary", symbol: "XLY" },
  { sector: "Utilities", symbol: "XLU" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sectors: HeatmapItem[] = await Promise.all(
      SECTOR_PROXIES.map(async ({ sector, symbol }) => {
        try {
          const quote = await finnhubGet<{ dp?: number }>("quote", {
            symbol,
          });
          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          return { sector, symbol, movePct };
        } catch (error) {
          console.error("heatmap fetch error", symbol, error);
          return { sector, symbol, movePct: 0 };
        }
      })
    );

    return res.status(200).json({ sectors });
  } catch (error) {
    console.error("heatmap endpoint error", error);
    return res.status(500).json({ error: "Failed to fetch heat map data" });
  }
}
