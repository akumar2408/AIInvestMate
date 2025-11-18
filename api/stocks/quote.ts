// api/stocks/quote.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFinnhubQuote, FinnhubError } from './finnhub.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const symbol = String(req.query.symbol || '').toUpperCase().trim();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol query param required' });
    }

    const quote = await fetchFinnhubQuote(symbol);

    const cleanPayload = {
      symbol: quote.symbol,
      price: quote.current,
      change: quote.change,
      changePercent: quote.changePct,
      updatedAt: quote.timestamp ?? Date.now(),
    };

    return res.status(200).json({
      ...cleanPayload,
      current: quote.current,
      changePct: quote.changePct,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      prevClose: quote.prevClose,
      timestamp: quote.timestamp,
    });
  } catch (err: unknown) {
    if (err instanceof FinnhubError) {
      console.error('FinnhubError in /api/stocks/quote', err.message);
      return res.status(err.statusCode).json({ error: err.message });
    }

    console.error('Unhandled error in /api/stocks/quote', err);
    return res.status(500).json({ error: 'Internal error in /api/stocks/quote' });
  }
}
