import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchFinnhubCandles, FinnhubError, type CandleRange } from '../../shared/finnhub';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbol = String(req.query.symbol || '');
  const range = (typeof req.query.range === 'string' ? req.query.range : undefined) as CandleRange | undefined;
  const resolution = typeof req.query.resolution === 'string' ? req.query.resolution : undefined;

  try {
    const payload = await fetchFinnhubCandles(symbol, { range, resolution });
    return res.status(200).json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('history handler error', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
}
