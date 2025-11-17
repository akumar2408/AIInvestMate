// shared/finnhub.ts

export type FinnhubQuoteResponse = {
  c: number; // current
  d: number; // change
  dp: number; // change %
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp (unix)
};

type FinnhubCandleResponse = {
  c?: number[]; // close prices
  t?: number[]; // timestamps (unix)
  s: "ok" | "no_data" | string;
};

type FinnhubETFProfileResponse = {
  name?: string;
  description?: string;
  category?: string;
  expenseRatio?: number;
  isin?: string;
  exchange?: string;
};

type FinnhubETFHoldingsResponse = {
  holdings?: {
    symbol?: string;
    description?: string;
    weight?: number;
  }[];
};

export type QuotePayload = {
  symbol: string;
  current: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  timestamp: number | null;
};

export type HistoryPoint = {
  t: number; // ms timestamp
  c: number; // close price
};

export type HistoryPayload = {
  symbol: string;
  range: string;
  points: HistoryPoint[];
};

export type ETFOverview = {
  symbol: string;
  profile: {
    name?: string;
    category?: string;
    expenseRatio?: number;
    isin?: string;
    exchange?: string;
  };
  holdings: { symbol: string; description: string; weight: number }[];
};

export class FinnhubError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "FinnhubError";
  }
}

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const normalizeSymbol = (symbolRaw: string | null | undefined) =>
  String(symbolRaw || "").toUpperCase().trim();

const resolveApiKey = (override?: string | null) => {
  const key = override ?? process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new FinnhubError("Market data API key not configured", 500);
  }
  return key;
};

// -------- Quote --------

export async function fetchFinnhubQuote(
  symbolRaw: string,
  apiKey?: string | null
): Promise<QuotePayload> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }

  const key = resolveApiKey(apiKey);
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
    symbol
  )}&token=${key}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Finnhub quote error", resp.status, text);
    throw new FinnhubError("Failed to fetch quote", 502);
  }

  const raw = (await resp.json()) as FinnhubQuoteResponse;
  if (!raw || typeof raw.c !== "number" || raw.c === 0) {
    throw new FinnhubError("Symbol not found or no data", 404);
  }

  return {
    symbol,
    current: raw.c,
    change: raw.d,
    changePct: raw.dp,
    open: raw.o,
    high: raw.h,
    low: raw.l,
    prevClose: raw.pc,
    timestamp: raw.t ? raw.t * 1000 : null,
  };
}

// -------- History (for the little sparkline) --------

function rangeToWindow(range: string): { from: number; to: number; resolution: string } {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;

  switch (range) {
    case "1w":
      return { from: now - 7 * day, to: now, resolution: "30" }; // 30-min candles
    case "1m":
      return { from: now - 30 * day, to: now, resolution: "D" }; // daily
    case "3m":
      return { from: now - 90 * day, to: now, resolution: "D" };
    case "1y":
      return { from: now - 365 * day, to: now, resolution: "W" }; // weekly
    default:
      return { from: now - 30 * day, to: now, resolution: "D" };
  }
}

export async function fetchFinnhubHistory(
  symbolRaw: string,
  range: string,
  apiKey?: string | null
): Promise<HistoryPayload> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }

  const { from, to, resolution } = rangeToWindow(range);
  const key = resolveApiKey(apiKey);

  const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(
    symbol
  )}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Finnhub history error", resp.status, text);
    throw new FinnhubError("Failed to fetch history", 502);
  }

  const raw = (await resp.json()) as FinnhubCandleResponse;
  if (!raw || raw.s !== "ok" || !Array.isArray(raw.c) || !Array.isArray(raw.t)) {
    throw new FinnhubError("No historical data", 404);
  }

  const points: HistoryPoint[] = raw.c.map((close, i) => ({
    c: close,
    t: (raw.t![i] || 0) * 1000,
  }));

  return { symbol, range, points };
}

// -------- ETF Detail (optional, but already wired) --------

export async function fetchFinnhubETF(
  symbolRaw: string,
  apiKey?: string | null
): Promise<ETFOverview> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=VOO", 400);
  }

  const key = resolveApiKey(apiKey);
  const profileUrl = `${FINNHUB_BASE_URL}/etf/profile2?symbol=${encodeURIComponent(
    symbol
  )}&token=${key}`;
  const holdingsUrl = `${FINNHUB_BASE_URL}/etf/holdings?symbol=${encodeURIComponent(
    symbol
  )}&token=${key}`;

  const [profileResp, holdingsResp] = await Promise.all([
    fetch(profileUrl),
    fetch(holdingsUrl),
  ]);

  if (!profileResp.ok || !holdingsResp.ok) {
    console.error(
      "ETF profile/holdings error",
      profileResp.status,
      holdingsResp.status
    );
    throw new FinnhubError("Failed to fetch ETF data", 502);
  }

  const profileJson = (await profileResp.json()) as FinnhubETFProfileResponse;
  const holdingsJson = (await holdingsResp.json()) as FinnhubETFHoldingsResponse;

  const holdings = Array.isArray(holdingsJson?.holdings)
    ? holdingsJson.holdings.slice(0, 10).map((h) => ({
        symbol: String(h?.symbol || "").toUpperCase(),
        description: String(h?.description || ""),
        weight: Number(h?.weight || 0),
      }))
    : [];

  return {
    symbol,
    profile: {
      name: profileJson?.name ?? profileJson?.description ?? symbol,
      category: profileJson?.category,
      expenseRatio:
        typeof profileJson?.expenseRatio === "number"
          ? profileJson.expenseRatio
          : undefined,
      isin: profileJson?.isin,
      exchange: profileJson?.exchange,
    },
    holdings,
  };
}

