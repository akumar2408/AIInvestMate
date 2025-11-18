import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { db, hasDB } from '../db';
import { budgets } from '../db/schema';
import { and, eq } from 'drizzle-orm';

const defaultBuckets = [
  { category: 'Rent', pct: 0.4 },
  { category: 'Living', pct: 0.3 },
  { category: 'Investing', pct: 0.2 },
  { category: 'Fun', pct: 0.1 },
];

function fallbackPlan(message: string, income: number) {
  const parsedIncome = income || Number(message.match(/\$?(\d+(?:\.\d+)?)/)?.[1] || 0);
  const base = parsedIncome || 2000;
  return defaultBuckets.map((bucket) => ({
    category: bucket.category,
    limit: Math.round(base * bucket.pct),
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, userId, month } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const targetMonth = typeof month === 'string' && month.length >= 7 ? month : new Date().toISOString().slice(0, 7);
    const apiKey = process.env.OPENAI_API_KEY;

    let plan: { category: string; limit: number }[];
    let notes = 'Drafted with heuristic 50/30/20 split';

    if (!apiKey) {
      plan = fallbackPlan(prompt || '', 0);
    } else {
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You turn natural-language budgeting requests into JSON. Respond with {"plan":[{"category":string,"limit":number}],"notes":string}. Limits are monthly USD amounts. Use envelope budgeting best practices.',
          },
          {
            role: 'user',
            content: `Create a budget for: ${prompt}. Month: ${targetMonth}.`,
          },
        ],
      });

      const payload = JSON.parse(response.choices?.[0]?.message?.content || '{}');
      plan = Array.isArray(payload.plan)
        ? payload.plan.map((row: any) => ({ category: String(row.category || 'General'), limit: Number(row.limit || 0) }))
        : fallbackPlan(prompt || '', 0);
      notes = payload.notes || 'AI generated plan';
    }

    if (!plan.length) plan = fallbackPlan(prompt || '', 0);

    let stored = plan;
    if (hasDB && db) {
      // Remove existing month budgets before inserting new envelopes so the wizard feels authoritative.
      await db.delete(budgets).where(and(eq(budgets.userId, userId), eq(budgets.month, targetMonth)));
      stored = plan.map((row) => ({
        id: randomUUID(),
        userId,
        month: targetMonth,
        category: row.category,
        limit: row.limit,
      }));
      if (stored.length) {
        await db.insert(budgets).values(stored);
      }
    } else {
      stored = plan.map((row) => ({
        id: randomUUID(),
        userId,
        month: targetMonth,
        category: row.category,
        limit: row.limit,
      }));
    }

    return res.status(200).json({ plan: stored, notes, month: targetMonth });
  } catch (error) {
    console.error('budget ai error', error);
    return res.status(500).json({ error: 'Failed to build budget' });
  }
}
