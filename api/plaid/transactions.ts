import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // With real PLAID keys, fetch recent txns.
  // Mock sample:
  return res.status(200).json({ transactions: [
    { id: "plaid_1", date: "2025-09-01", description: "Coffee Shop", category: "Dining", amount: -4.5, account: "Chase" },
    { id: "plaid_2", date: "2025-09-02", description: "Paycheck", category: "Income", amount: 1200, account: "Employer" },
  ]});
}