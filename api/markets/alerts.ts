import type { VercelRequest, VercelResponse } from "@vercel/node";
import { finnhubGet } from "./utils";

type Alert = {
  title: string;
  body: string;
};

const WATCHLIST = ["NVDA", "TSLA", "MSFT", "AAPL"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const quotes = await Promise.all(
      WATCHLIST.map(async (symbol) => {
        try {
          const quote = await finnhubGet<{ dp?: number }>("quote", {
            symbol,
          });
          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          return { symbol, movePct };
        } catch (error) {
          console.error("alert quote error", symbol, error);
          return { symbol, movePct: 0 };
        }
      })
    );

    const alerts: Alert[] = quotes.flatMap(({ symbol, movePct }) => {
      if (movePct >= 5) {
        return [
          {
            title: `${symbol} +${movePct.toFixed(1)}% intraday`,
            body: "Consider trimming / rebalancing exposure.",
          },
        ];
      }
      if (movePct <= -5) {
        return [
          {
            title: `${symbol} ${movePct.toFixed(1)}% vs prior close`,
            body: "Review stop / drawdown risk.",
          },
        ];
      }
      return [];
    });

    return res.status(200).json({ alerts });
  } catch (error) {
    console.error("alerts endpoint error", error);
    return res.status(500).json({ error: "Failed to fetch alerts" });
  }
}
