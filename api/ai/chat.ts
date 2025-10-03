import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

type State = {
  txns?: { date:string; description:string; category:string; amount:number }[];
  budgets?: { month:string; category:string; limit:number }[];
  goals?: { name:string; target:number; current:number; deadline?:string }[];
};

const systemPrompt = `You are InvestMate, a world-class personal finance copilot.
Return concise, actionable advice formatted in Markdown with sections:
## Snapshot
- Key KPIs (income, spend, savings rate, top category)
## Insights
- 3-5 bullets tailored to the user's data
## Recommendations
- 3 next steps
Also, return a compact JSON object "insights" with keys: kpis {income, spend, savingsRate}, anomalies[], opportunities[], and actionItems[].`;

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
      const reply = `## Snapshot
- Income: $${kpis.income.toFixed(0)} | Spend: $${kpis.spend.toFixed(0)} | Savings Rate: ${kpis.savingsRate}%

## Insights
- You're spending most on categories without budgets. Add limits to control drift.
- Savings rate below 20%? Try paying yourself first via auto-transfer.

## Recommendations
- Set a budget for your top 2 categories.
- Automate transfers on payday.
- Review allocation quarterly.`;
      return res.status(200).json({ reply, extras: { tags:["finance","budget","insights"], riskLevel:"medium", nextActions:["Add budgets","Automate savings","Review quarterly"] }, insights: { kpis, anomalies:[], opportunities:[], actionItems:["Add budgets","Automate savings","Review quarterly"] } });
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
    return res.status(200).json({ reply, insights: { kpis, anomalies:[], opportunities:[], actionItems:[] } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}