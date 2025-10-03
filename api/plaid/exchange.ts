import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { public_token } = req.body || {};
  // Exchange would happen here; we mock it.
  return res.status(200).json({ item_id: "mock-item", access_token: "mock-access-token" });
}