// api/stocks/history.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchFinnhubHistory, FinnhubError } from "../../shared/finnhub";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const symbol = String(req.query.symbol || "");
  const range = String(req.query.range || "1m");

  try {
    const payload = await fetchFinnhubHistory(symbol, range);
    return res.status(200).json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("history handler error", err);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
}
