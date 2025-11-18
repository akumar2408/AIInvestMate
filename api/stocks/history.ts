// api/stocks/history.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFinnhubHistory, FinnhubError } from './finnhub';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const symbol = String(req.query.symbol || '').toUpperCase().trim();
    const range = String(req.query.range || '1m');

    if (!symbol) {
      return res.status(400).json({ error: 'symbol query param required' });
    }

    const payload = await fetchFinnhubHistory(symbol, range);
    return res.status(200).json(payload);
  } catch (err: unknown) {
    if (err instanceof FinnhubError) {
      console.error('FinnhubError in /api/stocks/history', err.message);
      return res.status(err.statusCode).json({ error: err.message });
    }

    console.error('Unhandled error in /api/stocks/history', err);
    return res.status(500).json({ error: 'Internal error in /api/stocks/history' });
  }
}
