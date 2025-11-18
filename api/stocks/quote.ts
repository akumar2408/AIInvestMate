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

    const payload = await fetchFinnhubQuote(symbol);
    return res.status(200).json(payload);
  } catch (err: unknown) {
    if (err instanceof FinnhubError) {
      console.error('FinnhubError in /api/stocks/quote', err.message);
      return res.status(err.statusCode).json({ error: err.message });
    }

    console.error('Unhandled error in /api/stocks/quote', err);
    return res.status(500).json({ error: 'Internal error in /api/stocks/quote' });
  }
}
