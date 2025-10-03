import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // If PLAID credentials exist, you would create a real link token here.
  // For now, return a mock token so the UI can demo.
  const hasKeys = !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  return res.status(200).json({ link_token: hasKeys ? "real-token-todo" : "mock-link-token" });
}