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
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  s: "ok" | "no_data";
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

export type CandlePoint = {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockHistoryPayload = {
  symbol: string;
  range: CandleRange;
  resolution: string;
  points: CandlePoint[];
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

export type CandleRange = "1d" | "1w" | "1m" | "3m" | "1y";

const HISTORY_WINDOWS: Record<CandleRange, { seconds: number; resolution: string }> = {
  "1d": { seconds: 60 * 60 * 24, resolution: "5" },
  "1w": { seconds: 60 * 60 * 24 * 7, resolution: "30" },
  "1m": { seconds: 60 * 60 * 24 * 30, resolution: "60" },
  "3m": { seconds: 60 * 60 * 24 * 90, resolution: "D" },
  "1y": { seconds: 60 * 60 * 24 * 365, resolution: "D" },
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const QUOTE_CACHE_TTL_MS = 15_000;
const ETF_CACHE_TTL_MS = 5 * 60_000;
const HISTORY_CACHE_TTL_MS = 2 * 60_000;

const quoteCache = new Map<string, CacheEntry<QuotePayload>>();
const etfCache = new Map<string, CacheEntry<ETFOverview>>();
const historyCache = new Map<string, CacheEntry<StockHistoryPayload>>();

const pooledKeys = (process.env.FINNHUB_API_KEYS || "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

const fallbackKey = process.env.FINNHUB_FALLBACK_API_KEY;
let poolIndex = 0;
let fallbackWarned = false;

const normalizeSymbol = (symbolRaw: string | null | undefined) =>
  String(symbolRaw || "").toUpperCase().trim();

const resolveApiKey = (apiKey?: string | null) => {
  if (apiKey) return apiKey;
  if (process.env.FINNHUB_API_KEY) {
    return process.env.FINNHUB_API_KEY;
  }
  if (pooledKeys.length) {
    const key = pooledKeys[poolIndex];
    poolIndex = (poolIndex + 1) % pooledKeys.length;
    return key;
  }
  if (fallbackKey) {
    if (!fallbackWarned) {
      console.warn("FINNHUB_FALLBACK_API_KEY in use. Configure FINNHUB_API_KEY or FINNHUB_API_KEYS for production.");
      fallbackWarned = true;
    }
    return fallbackKey;
  }
  throw new FinnhubError("Market data API key not configured", 500);
};

const getCachedValue = async <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> => {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.data;
  }
  const data = await loader();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
};

export async function fetchFinnhubQuote(symbolRaw: string, apiKey?: string | null): Promise<QuotePayload> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }

  const cacheKey = `quote:${symbol}:${apiKey ? "manual" : "auto"}`;
  return getCachedValue(quoteCache, cacheKey, QUOTE_CACHE_TTL_MS, async () => {
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
  });
}

export async function fetchFinnhubETF(symbolRaw: string, apiKey?: string | null): Promise<ETFOverview> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=VOO", 400);
  }

  const cacheKey = `etf:${symbol}:${apiKey ? "manual" : "auto"}`;
  return getCachedValue(etfCache, cacheKey, ETF_CACHE_TTL_MS, async () => {
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
  });
}

const resolveHistoryWindow = (range?: CandleRange) => {
  if (range && HISTORY_WINDOWS[range]) {
    return { range, ...HISTORY_WINDOWS[range] };
  }
  return { range: "1w" as CandleRange, ...HISTORY_WINDOWS["1w"] };
};

export async function fetchFinnhubCandles(
  symbolRaw: string,
  opts?: { range?: CandleRange; resolution?: string; from?: number; to?: number },
  apiKey?: string | null
): Promise<StockHistoryPayload> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }

  const window = resolveHistoryWindow(opts?.range);
  const resolution = opts?.resolution || window.resolution;
  const to = opts?.to ?? Math.floor(Date.now() / 1000);
  const from = opts?.from ?? to - window.seconds;

  const cacheKey = `hist:${symbol}:${window.range}:${resolution}:${from}:${to}`;
  return getCachedValue(historyCache, cacheKey, HISTORY_CACHE_TTL_MS, async () => {
    const key = resolveApiKey(apiKey);
    const url =
      `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Finnhub history error", resp.status, text);
      throw new FinnhubError("Failed to fetch history", 502);
    }

    const raw = (await resp.json()) as FinnhubCandleResponse;
    if (raw?.s !== "ok" || !raw?.t?.length) {
      throw new FinnhubError("No historical data for symbol", 404);
    }

    const points: CandlePoint[] = raw.t.map((time, idx) => ({
      time: time * 1000,
      open: raw.o?.[idx] ?? 0,
      high: raw.h?.[idx] ?? 0,
      low: raw.l?.[idx] ?? 0,
      close: raw.c?.[idx] ?? 0,
      volume: raw.v?.[idx] ?? 0,
    }));

    return {
      symbol,
      range: window.range,
      resolution,
      points,
    };
  });
}
