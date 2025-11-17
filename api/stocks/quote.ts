import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFinnhubQuote, FinnhubError } from '../../shared/finnhub';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const symbol = String(req.query.symbol || '');
    const payload = await fetchFinnhubQuote(symbol);
    return res.status(200).json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('quote handler error', err);
    return res.status(500).json({ error: 'Failed to fetch quote' });
  }
}
