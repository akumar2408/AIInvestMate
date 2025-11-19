// server/app.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import axios from "axios";
import {
  fetchFinnhubHistory,
  fetchFinnhubETF,
  fetchFinnhubQuote,
  fetchFinnhubCandles,
  FinnhubError,
  type CandleRange,
} from "../shared/finnhub";
import { aiService } from "./services/openai";
import redditRoutes from "./redditRoutes";
import cryptoRoutes from "./cryptoRoutes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY?.trim();
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const TIME_MACHINE_LOOKBACK: Record<string, number> = {
  "1y": 1,
  "5y": 5,
  "10y": 10,
};

const app = express();
app.use(express.json());
app.use(redditRoutes);
app.use(cryptoRoutes);

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
    subscription: { plan: "free" },
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
        { role: "user", content: `${message || ""}` },
      ],
      temperature: 0.2,
    });

    const content =
      response.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";
    const extras = smartExtrasFromText(content);

    return res.json({ reply: content, extras });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ error: "AI service unavailable." });
  }
});

// --- Market data: quote ---
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

// --- Market data: ETF overview ---
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

// --- Market data: history / sparkline ---
app.get("/api/stocks/history", async (req, res) => {
  try {
    // Accept ?range=1w|1m|3m|1y (defaults to 1w)
    const rawRange =
      typeof req.query.range === "string" ? req.query.range : "1w";
    const range = rawRange as CandleRange;

    const payload = await fetchFinnhubHistory(
      String(req.query.symbol || ""),
      range
    );
    return res.json(payload);
  } catch (err) {
    if (err instanceof FinnhubError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("history handler error", err);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

// --- Markets: sentiment watchlist ---
app.get("/api/markets/sentiment", async (req, res) => {
  try {
    const tickers = parseTickersParam(
      req.query.tickers,
      ["NVDA", "TSLA", "MSFT", "NFLX"]
    );

    const items = await Promise.all(
      tickers.map(async (symbol) => {
        try {
          const [quote, sentiment] = await Promise.all([
            finnhubGet<{ dp?: number }>("quote", { symbol }),
            finnhubGet<{ companyNewsScore?: number }>("news-sentiment", {
              symbol,
            }),
          ]);

          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          const sentimentScore =
            typeof sentiment?.companyNewsScore === "number"
              ? Number(sentiment.companyNewsScore)
              : null;
          return { symbol, movePct, sentimentScore };
        } catch (error) {
          console.error("sentiment fetch error", symbol, error);
          return { symbol, movePct: 0, sentimentScore: null };
        }
      })
    );

    res.json({ items });
  } catch (error) {
    console.error("sentiment endpoint error", error);
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
});

// --- Markets: sector heat map ---
app.get("/api/markets/heatmap", async (_req, res) => {
  const sectorProxies = [
    { sector: "Technology", symbol: "XLK" },
    { sector: "Energy", symbol: "XLE" },
    { sector: "Financials", symbol: "XLF" },
    { sector: "Healthcare", symbol: "XLV" },
    { sector: "Consumer Discretionary", symbol: "XLY" },
    { sector: "Utilities", symbol: "XLU" },
  ];

  try {
    const sectors = await Promise.all(
      sectorProxies.map(async ({ sector, symbol }) => {
        try {
          const quote = await finnhubGet<{ dp?: number }>("quote", { symbol });
          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          return { sector, symbol, movePct };
        } catch (error) {
          console.error("heatmap fetch error", symbol, error);
          return { sector, symbol, movePct: 0 };
        }
      })
    );
    res.json({ sectors });
  } catch (error) {
    console.error("heatmap endpoint error", error);
    res.status(500).json({ error: "Failed to fetch heat map data" });
  }
});

// --- Markets: earnings calendar ---
app.get("/api/markets/earnings", async (req, res) => {
  const tickers = parseTickersParam(
    req.query.tickers,
    ["AAPL", "MSFT", "SHOP", "V"]
  );
  const tickerSet = new Set(tickers.map((t) => t.toUpperCase()));

  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  try {
    const calendar = await finnhubGet<{
      earningsCalendar?: Array<{
        symbol?: string;
        date?: string;
        hour?: string;
        epsActual?: number;
        epsEstimate?: number;
      }>;
    }>("calendar/earnings", { from, to });

    const earnings =
      calendar.earningsCalendar
        ?.filter((entry) =>
          entry?.symbol ? tickerSet.has(entry.symbol.toUpperCase()) : false
        )
        .map((entry) => ({
          symbol: entry.symbol || "N/A",
          date: entry.date || "",
          hour: entry.hour || "",
          epsActual:
            typeof entry.epsActual === "number" ? entry.epsActual : null,
          epsEstimate:
            typeof entry.epsEstimate === "number" ? entry.epsEstimate : null,
        })) ?? [];

    res.json({ earnings });
  } catch (error) {
    console.error("earnings endpoint error", error);
    res.status(500).json({ error: "Failed to fetch earnings calendar" });
  }
});

// --- Markets: alerts ---
app.get("/api/markets/alerts", async (_req, res) => {
  const watchlist = ["NVDA", "TSLA", "MSFT", "AAPL"];
  try {
    const quotes = await Promise.all(
      watchlist.map(async (symbol) => {
        try {
          const quote = await finnhubGet<{ dp?: number }>("quote", { symbol });
          const movePct =
            typeof quote?.dp === "number" ? Number(quote.dp) : 0;
          return { symbol, movePct };
        } catch (error) {
          console.error("alert quote error", symbol, error);
          return { symbol, movePct: 0 };
        }
      })
    );

    const alerts = quotes.flatMap(({ symbol, movePct }) => {
      if (movePct >= 5) {
        return [
          {
            title: `${symbol} +${movePct.toFixed(1)}% intraday`,
            body: "Consider trimming / rebalancing exposure.",
          },
        ];
      }
      if (movePct <= -5) {
        return [
          {
            title: `${symbol} ${movePct.toFixed(1)}% vs prior close`,
            body: "Review stop / drawdown risk.",
          },
        ];
      }
      return [];
    });

    res.json({ alerts });
  } catch (error) {
    console.error("alerts endpoint error", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
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
async function finnhubGet<T>(
  path: string,
  params: Record<string, any> = {}
): Promise<T> {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not configured");
  }
  const cleanPath = path.replace(/^\//, "");
  const url = `${FINNHUB_BASE_URL}/${cleanPath}`;
  const response = await axios.get<T>(url, {
    params: { ...params, token: FINNHUB_API_KEY },
  });
  return response.data;
}

function parseTickersParam(
  raw: unknown,
  fallback: string[]
): string[] {
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  return fallback;
}

function mockAIReply(message: string) {
  const lower = message.toLowerCase();
  let snapshot = "Income steady | Spending trending normal | Savings on track";
  let insights = [
    "You're allocating most discretionary spend to dining and travel.",
    "Savings rate holds near 20%, which keeps goals on pace.",
  ];
  let next = ["Schedule a 5-minute weekly review", "Auto-transfer leftovers into HYSA"];
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
  const reply = `Snapshot:
- ${snapshot}
Insights:
- ${insights.join("\n- ")}
Next Actions:
- ${next.join("\n- ")}`;
  return { reply, extras: smartExtrasFromText(reply) };
}

function smartExtrasFromText(text: string) {
  // naive keyword tagging + risk guess
  const tags = Array.from(
    new Set(
      (
        text.match(
          /\b(etf|budget|dca|fees|diversification|risk|s&p|international|savings|emergency fund|goals)\b/gi
        ) || []
      ).map((t) => t.toLowerCase())
    )
  ).slice(0, 6);

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
