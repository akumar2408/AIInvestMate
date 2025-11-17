import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { concepts } from '@shared/concepts';

type State = {
  txns?: { date:string; description:string; category:string; amount:number }[];
  budgets?: { month:string; category:string; limit:number }[];
  goals?: { name:string; target:number; current:number; deadline?:string }[];
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
  const income = tx.filter(t=>t.amount>0).reduce((a,b)=>a+b.amount,0);
  const spend = Math.abs(tx.filter(t=>t.amount<0).reduce((a,b)=>a+b.amount,0));
  const savingsRate = income ? Math.round(((income-spend)/income)*100) : 0;
  return { income, spend, savingsRate };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, context } = req.body || {};
    const parsed: State = (()=>{ try { return JSON.parse(context||"{}"); } catch { return {}; }})();
    const kpis = analyze(parsed);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const reply = `Snapshot:
- Income $${kpis.income.toFixed(0)} | Spend $${kpis.spend.toFixed(0)} | Savings ${kpis.savingsRate}%
Insights:
- You're spending most on categories without envelopes, so cash is drifting.
- Paying yourself first will lift savings above 20%.
Next actions:
- Add budgets for your top 2 categories.
- Automate transfers on payday.
- Review allocation quarterly.`;
      return res.status(200).json({ reply, extras: buildExtras(reply), insights: { kpis, anomalies:[], opportunities:[], actionItems:["Add budgets","Automate savings","Review quarterly"] } });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User question: ${String(message || '')}\n\nData JSON: ${JSON.stringify(parsed).slice(0,12000)}` },
      ],
      temperature: 0.2,
    });

    const reply = response.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return res.status(200).json({ reply, extras: buildExtras(reply), insights: { kpis, anomalies:[], opportunities:[], actionItems:[] } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}

function buildExtras(text: string) {
  const lower = text.toLowerCase();
  const tags = Array.from(
    new Set(
      (lower.match(/\b(savings|budget|etf|dca|invest|cash|debt|risk|allocation|goal|expense)\b/g) || []).map((tag) =>
        tag.toLowerCase()
      )
    )
  );

  const riskLevel = /conservative|cash|treasury/.test(lower)
    ? 'low'
    : /aggressive|leverage|options/.test(lower)
    ? 'high'
    : 'medium';

  const nextActions = Array.from(new Set((text.match(/(?<=-\s)(.*?)(?=\n|$)/g) || []).slice(-3)));

  const relatedConcepts = concepts.filter((concept) => {
    const needles = [concept.term, ...(concept.aliases || [])].map((term) => term.toLowerCase());
    return needles.some((term) => lower.includes(term));
  });

  return { tags, riskLevel, nextActions, concepts: relatedConcepts };
}