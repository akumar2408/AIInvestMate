import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import {
  fetchFinnhubHistory,
  fetchFinnhubETF,
  fetchFinnhubQuote,
  FinnhubError,
  type CandleRange,
} from "../shared/finnhub";

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

app.get("/api/stocks/quote", async (req, res) => {
  try {
    const quote = await fetchFinnhubQuote(String(req.query.symbol || ""));
    return res.json(quote);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("quote handler error", err);
    return res.status(500).json({ error: "Failed to fetch quote" });
  }
});

app.get("/api/stocks/etf", async (req, res) => {
  try {
    const payload = await fetchFinnhubETF(String(req.query.symbol || ""));
    return res.json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("etf handler error", err);
    return res.status(500).json({ error: "Failed to fetch ETF data" });
  }
});

app.get("/api/stocks/history", async (req, res) => {
  try {
    const range = (typeof req.query.range === "string" ? req.query.range : undefined) as CandleRange | undefined;
    const resolution = typeof req.query.resolution === "string" ? req.query.resolution : undefined;
    const payload = await fetchFinnhubCandles(String(req.query.symbol || ""), { range, resolution });
    return res.json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("history handler error", err);
    return res.status(500).json({ error: "Failed to fetch history" });
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
  let snapshot = "Income steady | Spending trending normal | Savings on track";
  let insights = [
    "You're allocating most discretionary spend to dining and travel.",
    "Savings rate holds near 20%, which keeps goals on pace.",
  ];
  let next = [
    "Schedule a 5-minute weekly review",
    "Auto-transfer leftovers into HYSA",
  ];
  if (lower.includes("etf")) {
    snapshot = "Core ETF plan ready";
    insights = [
      "Pair a broad US ETF (VTI/VOO) with international (VXUS) for balance.",
      "Keep fees low and stick to the plan regardless of headlines.",
    ];
    next = ["Set a recurring buy", "Rebalance annually", "Note tax lots"];
  } else if (lower.includes("budget") || lower.includes("spend")) {
    snapshot = "Budget baseline built";
    insights = [
      "Cap essentials near 50% of take-home pay.",
      "Give every dollar a job across needs, wants, and goals.",
    ];
    next = ["Lock envelopes for top categories", "Automate payday transfers"];
  }
  const reply = `Snapshot:\n- ${snapshot}\nInsights:\n- ${insights.join("\n- ")}\nNext Actions:\n- ${next.join("\n- ")}`;
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
