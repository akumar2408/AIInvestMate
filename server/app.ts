import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Minimal auth/user endpoint so UI doesn't break ---
app.get("/api/auth/user", (_req, res) => {
  res.json({
    id: "demo-user",
    name: "Aayush",
    email: "aayush@example.com",
    subscription: { plan: "free" }
  });
});

// --- AI Chat endpoint ---
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    const systemPrompt = `You are InvestMate, a concise, practical personal finance AI.
- Give clear, actionable answers.
- If asked for investments, include risk, fees, diversification.
- Be brief by default, use bullet points when useful.
- Return supplemental "extras" JSON with: tags (3-6), riskLevel (low/med/high), and 1-3 nextActions.`;

    // Fallback answer if no key
    if (!apiKey) {
      const reply = mockAIReply(message || "");
      return res.json(reply);
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${message || ""}` }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    const extras = smartExtrasFromText(content);

    return res.json({ reply: content, extras });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ error: "AI service unavailable." });
  }
});

// Serve client in production
const clientDist = path.resolve(__dirname, "../dist/public");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = parseInt(process.env.PORT || "5001", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

// ---- Helpers ----
function mockAIReply(message: string) {
  const lower = message.toLowerCase();
  let reply =
    "I'm running in demo mode (no API key). Here's a practical answer based on heuristics:\n";
  if (lower.includes("etf")) {
    reply += "- Broad-market ETF (e.g., VTI/VOO) for core exposure\n- Add international (VXUS) for diversification\n- Consider dollar-cost averaging\n- Hold long-term, minimize fees";
  } else if (lower.includes("budget") || lower.includes("spend")) {
    reply += "- 50/30/20 as a baseline\n- Cap fixed costs at ~50% net income\n- Track top 3 categories weekly\n- Automate savings transfers on payday";
  } else {
    reply += "- Set goal, timeline, and monthly contribution\n- Build 3–6 months emergency fund\n- Avoid high-interest debt before investing";
  }
  return { reply, extras: smartExtrasFromText(reply) };
}

function smartExtrasFromText(text: string) {
  // naive keyword tagging + risk guess
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
    "Review allocation quarterly"
  ];

  return { tags, riskLevel, nextActions };
}