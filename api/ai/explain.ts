import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, context } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const serializedContext = context ? JSON.stringify(context).slice(0, 8000) : '';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        answer:
          'AI context explainers are offline. Review your transactions and compare category totals versus the planned budget to find the variance.',
      });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You explain personal finance activity crisply. Answer in 2–3 paragraphs max, highlight root causes and give one actionable recommendation.',
        },
        {
          role: 'user',
          content: `Question: ${prompt}\nContext JSON: ${serializedContext}`,
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content || 'No explanation generated.';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('ai explain error', error);
    return res.status(500).json({ error: 'Failed to generate explanation' });
  }
}
