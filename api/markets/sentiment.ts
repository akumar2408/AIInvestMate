import type { VercelRequest, VercelResponse } from "@vercel/node";
import { finnhubGet, parseTickersParam } from "./utils";

type SentimentItem = {
  symbol: string;
  movePct: number;
  sentimentScore: number | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const tickers = parseTickersParam(
      req.query.tickers,
      ["NVDA", "TSLA", "MSFT", "NFLX"]
    );

    const items: SentimentItem[] = await Promise.all(
      tickers.map(async (symbol) => {
        try {
          const [quote, sentiment] = await Promise.all([
            finnhubGet<{ dp?: number }>("quote", { symbol }),
            finnhubGet<{ companyNewsScore?: number }>("news-sentiment", {
              symbol,
            }),
          ]);

          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          const sentimentScore =
            typeof sentiment?.companyNewsScore === "number"
              ? Number(sentiment.companyNewsScore)
              : null;

          return { symbol, movePct, sentimentScore };
        } catch (error) {
          console.error("sentiment fetch error", symbol, error);
          return { symbol, movePct: 0, sentimentScore: null };
        }
      })
    );

    return res.status(200).json({ items });
  } catch (error) {
    console.error("sentiment endpoint error", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch sentiment data" });
  }
}
