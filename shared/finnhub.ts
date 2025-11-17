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

const resolveApiKey = (apiKey?: string | null) => {
  const key = apiKey ?? process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new FinnhubError("Market data API key not configured", 500);
  }
  return key;
};

export async function fetchFinnhubQuote(symbolRaw: string, apiKey?: string | null): Promise<QuotePayload> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }

  const key = resolveApiKey(apiKey);
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Finnhub quote error", resp.status, text);
    throw new FinnhubError("Failed to fetch quote", 502);
  }

  const raw = (await resp.json()) as FinnhubQuoteResponse;
  if (!raw || !raw.c) {
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

export async function fetchFinnhubETF(symbolRaw: string, apiKey?: string | null): Promise<ETFOverview> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=VOO", 400);
  }

  const key = resolveApiKey(apiKey);
  const profileUrl = `${FINNHUB_BASE_URL}/etf/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`;
  const holdingsUrl = `${FINNHUB_BASE_URL}/etf/holdings?symbol=${encodeURIComponent(symbol)}&token=${key}`;

  const [profileResp, holdingsResp] = await Promise.all([fetch(profileUrl), fetch(holdingsUrl)]);

  if (!profileResp.ok) {
    console.error("ETF profile error", profileResp.status, await profileResp.text());
  }
  if (!holdingsResp.ok) {
    console.error("ETF holdings error", holdingsResp.status, await holdingsResp.text());
  }

  if (!profileResp.ok || !holdingsResp.ok) {
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
      expenseRatio: typeof profileJson?.expenseRatio === "number" ? profileJson.expenseRatio : undefined,
      isin: profileJson?.isin,
      exchange: profileJson?.exchange,
    },
    holdings,
  };
}
