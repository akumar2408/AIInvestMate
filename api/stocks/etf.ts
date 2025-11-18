import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFinnhubETF, FinnhubError } from './finnhub.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbol = String(req.query.symbol || '');

  try {
    const payload = await fetchFinnhubETF(symbol);
    return res.status(200).json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('etf handler error', err);
    return res.status(500).json({ error: 'Failed to fetch ETF data' });
  }
}
