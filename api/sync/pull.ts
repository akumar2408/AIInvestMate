import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, hasDB } from "../db";
import { transactions, budgets, goals, profiles, aiLogs } from "../db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!hasDB || !db) {
    // demo fallback
    return res.status(200).json({ txns: [], budgets: [], goals: [] });
  }

  try {
    const [txns, bgs, gls, profileRows, aiLogRows] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, userId)),
      db.select().from(budgets).where(eq(budgets.userId, userId)),
      db.select().from(goals).where(eq(goals.userId, userId)),
      db.select().from(profiles).where(eq(profiles.userId, userId)),
      db.select().from(aiLogs).where(eq(aiLogs.userId, userId)),
    ]);
    // cast numerics to numbers
    const num = (v:any)=> (typeof v === "string" ? Number(v) : v);
    return res.status(200).json({
      txns: txns.map(t=>({ ...t, amount: num(t.amount) })),
      budgets: bgs.map(b=>({ ...b, limit: num(b.limit) })),
      goals: gls.map(g=>({ ...g, target: num(g.target), current: num(g.current) })),
      profile: profileRows[0] || null,
      aiLogs: aiLogRows.map(log => ({ ...log })),
    });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: "pull failed" });
  }
}