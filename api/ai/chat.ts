import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

type State = {
  txns?: { date: string; description: string; category: string; amount: number }[];
  budgets?: { month: string; category: string; limit: number }[];
  goals?: { name: string; target: number; current: number; deadline?: string }[];
  profile?: { riskComfort?: string; goalFocus?: string };
};

const systemPrompt = `You are InvestMate, a world-class personal finance copilot.
Answer with three sections using bold labels instead of markdown headers.
Example format:
Snapshot:
- Income $X | Spend $Y | Savings Z%
Insights:
- ...
Next Actions:
- ...
No hashtags or "##" headings. Keep it conversational yet punchy.`;

function analyze(state: State) {
  const tx = state.txns || [];
  const income = tx.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const spend = Math.abs(tx.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0));
  const savingsRate = income ? Math.round(((income - spend) / income) * 100) : 0;
  return { income, spend, savingsRate };
}

function fallbackReply(kpis: { income: number; spend: number; savingsRate: number }) {
  return `Snapshot:
- Income $${kpis.income.toFixed(0)} | Spend $${kpis.spend.toFixed(0)} | Savings ${kpis.savingsRate}%
Insights:
- You're spending most on categories without envelopes, so cash is drifting.
- Paying yourself first will lift savings above 20%.
Next actions:
- Add budgets for your top 2 categories.
- Automate transfers on payday.
- Review allocation quarterly.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = (req.body || {}) as { message?: string; context?: unknown };

    // Safely parse context whether it comes as a JSON string or an object
    let parsed: State = {};
    if (typeof context === 'string') {
      try {
        parsed = JSON.parse(context || '{}');
      } catch {
        parsed = {};
      }
    } else if (context && typeof context === 'object') {
      parsed = context as State;
    }

    const kpis = analyze(parsed);
    const apiKey = process.env.OPENAI_API_KEY;

    // If there is no API key, always use the offline fallback
    if (!apiKey) {
      const reply = fallbackReply(kpis);
      return res.status(200).json({
        reply,
        extras: buildExtras(reply),
        insights: {
          kpis,
          anomalies: [],
          opportunities: [],
          actionItems: ['Add budgets', 'Automate savings', 'Review quarterly'],
        },
      });
    }

    let reply: string;

    try {
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `User question: ${String(message || '')}\n\nData JSON: ${JSON.stringify(parsed).slice(0, 12000)}`,
          },
        ],
        temperature: 0.2,
      });

      reply = response.choices?.[0]?.message?.content?.trim() || fallbackReply(kpis);
    } catch (apiError) {
      console.error('OpenAI error in InvestMate handler:', apiError);
      reply = fallbackReply(kpis);
    }

    return res.status(200).json({
      reply,
      extras: buildExtras(reply),
      insights: { kpis, anomalies: [], opportunities: [], actionItems: [] },
    });
  } catch (err) {
    console.error('Unexpected error in InvestMate AI handler:', err);

    // Last-resort fallback
    const safeReply =
      'Snapshot:\n- I had trouble reading your data, but we can still talk through your plan.\n' +
      'Insights:\n- Focus on tracking your biggest 2–3 categories.\n' +
      'Next actions:\n- Add or update your budgets, then ask me again.';

    return res.status(200).json({
      reply: safeReply,
      extras: buildExtras('Focus on tracking your biggest 2–3 categories and updating your budgets.'),
      insights: { kpis: { income: 0, spend: 0, savingsRate: 0 }, anomalies: [], opportunities: [], actionItems: [] },
    });
  }
}

function buildExtras(text: string) {
  const lower = text.toLowerCase();
  const tags = Array.from(
    new Set(
      (lower.match(/\b(savings|budget|etf|dca|invest|cash|debt|risk|allocation|goal|expense)\b/g) || []).map((tag) =>
        tag.toLowerCase(),
      ),
    ),
  );

  const riskLevel = /conservative|cash|treasury/.test(lower)
    ? 'low'
    : /aggressive|leverage|options/.test(lower)
    ? 'high'
    : 'medium';

  const nextActions = Array.from(new Set((text.match(/(?<=-\s)(.*?)(?=\n|$)/g) || []).slice(-3)));

  // TEMP: don’t use shared/concepts on the server to avoid module-load crashes
  const relatedConcepts: any[] = [];

  return { tags, riskLevel, nextActions, concepts: relatedConcepts };
}
