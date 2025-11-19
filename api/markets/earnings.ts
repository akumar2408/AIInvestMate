import type { VercelRequest, VercelResponse } from "@vercel/node";
import { finnhubGet, parseTickersParam } from "./utils";

type EarningsEntry = {
  symbol: string;
  date: string;
  hour: string;
  epsActual: number | null;
  epsEstimate: number | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tickers = parseTickersParam(
    req.query.tickers,
    ["AAPL", "MSFT", "SHOP", "V"]
  );
  const tickerSet = new Set(tickers.map((t) => t.toUpperCase()));

  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const calendar = await finnhubGet<{
      earningsCalendar?: Array<{
        symbol?: string;
        date?: string;
        hour?: string;
        epsActual?: number;
        epsEstimate?: number;
      }>;
    }>("calendar/earnings", { from, to });

    const earnings: EarningsEntry[] =
      calendar.earningsCalendar
        ?.filter((entry) =>
          entry?.symbol ? tickerSet.has(entry.symbol.toUpperCase()) : false
        )
        .map((entry) => ({
          symbol: entry.symbol || "N/A",
          date: entry.date || "",
          hour: entry.hour || "",
          epsActual:
            typeof entry.epsActual === "number" ? entry.epsActual : null,
          epsEstimate:
            typeof entry.epsEstimate === "number" ? entry.epsEstimate : null,
        })) ?? [];

    return res.status(200).json({ earnings });
  } catch (error) {
    console.error("earnings endpoint error", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch earnings calendar" });
  }
}
