// Vercel Serverless Function for AI chat
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const systemPrompt = `You are InvestMate, a concise, practical personal finance AI.
- Give clear, actionable answers.
- If asked for investments, include risk, fees, diversification.
- Be brief by default; use bullets when useful.
- Return supplemental "extras" JSON with: tags (3-6), riskLevel (low/med/high), and 1-3 nextActions.`;

function smartExtrasFromText(text: string) {
  const tags = Array.from(new Set(
    (text.match(/\b(etf|budget|dca|fees|diversification|risk|s&p|international|savings|emergency fund|goals)\b/gi) || [])
      .map(t => t.toLowerCase())
  )).slice(0, 6);

  const riskLevel = /high risk|leverage|options/i.test(text)
    ? "high"
    : /bond|treasury|cash/i.test(text)
    ? "low"
    : "medium";

  const nextActions = [
    "Define goal + timeline",
    "Enable automatic contributions",
    "Review allocation quarterly",
  ];
  return { tags, riskLevel, nextActions };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    // Demo fallback if no key
    if (!apiKey) {
      const reply =
        "I'm in demo mode. Quick tips:\n" +
        "- Broad-market ETF for core exposure (VTI/VOO)\n" +
        "- DCA monthly; minimize fees\n" +
        "- Build 3–6 months emergency fund\n" +
        "- Review allocation quarterly";
      return res.status(200).json({ reply, extras: smartExtrasFromText(reply) });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: String(message || '') },
      ],
      temperature: 0.2,
    });

    const reply = response.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return res.status(200).json({ reply, extras: smartExtrasFromText(reply) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}
