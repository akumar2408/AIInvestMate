import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, hasDB } from "../db";
import { transactions, budgets, goals } from "../db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userId, txns = [], budgets: bgs = [], goals: gls = [] } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!hasDB || !db) {
    return res.status(200).json({ ok: true, mode: "demo" });
  }

  try {
    // naive upsert: delete existing user rows then insert current snapshot
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(budgets).where(eq(budgets.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));

    if (txns.length) await db.insert(transactions).values(txns.map((t:any)=>({ ...t, userId })));
    if (bgs.length) await db.insert(budgets).values(bgs.map((b:any)=>({ ...b, userId })));
    if (gls.length) await db.insert(goals).values(gls.map((g:any)=>({ ...g, userId })));

    return res.status(200).json({ ok: true });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: "push failed" });
  }
}