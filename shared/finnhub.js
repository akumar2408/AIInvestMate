class FinnhubError extends Error {
  statusCode;
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "FinnhubError";
  }
}
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_KEY_ENV_ORDER = [
  "FINNHUB_API_KEY",
  "NEXT_PUBLIC_FINNHUB_API_KEY",
  "VITE_FINNHUB_API_KEY"
];
const HISTORY_WINDOWS = {
  "1d": { seconds: 60 * 60 * 24, resolution: "5" },
  "1w": { seconds: 60 * 60 * 24 * 7, resolution: "30" },
  "1m": { seconds: 60 * 60 * 24 * 30, resolution: "60" },
  "3m": { seconds: 60 * 60 * 24 * 90, resolution: "D" },
  "1y": { seconds: 60 * 60 * 24 * 365, resolution: "D" }
};
const normalizeSymbol = (symbolRaw) => String(symbolRaw || "").toUpperCase().trim();
const resolveApiKey = (override) => {
  const normalized = override?.trim();
  if (normalized) {
    return normalized;
  }
  for (const envName of FINNHUB_KEY_ENV_ORDER) {
    const candidate = process.env[envName];
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }
  throw new FinnhubError("Market data API key not configured", 500);
};
const resolveHistoryWindow = (range) => {
  if (range && HISTORY_WINDOWS[range]) {
    return { range, ...HISTORY_WINDOWS[range] };
  }
  return { range: "1w", ...HISTORY_WINDOWS["1w"] };
};
async function fetchFinnhubQuote(symbolRaw, apiKey) {
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
  const raw = await resp.json();
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
    timestamp: raw.t ? raw.t * 1e3 : null
  };
}
function rangeToWindow(range) {
  const now = Math.floor(Date.now() / 1e3);
  const day = 24 * 60 * 60;
  switch (range) {
    case "1w":
      return { from: now - 7 * day, to: now, resolution: "30" };
    case "1m":
      return { from: now - 30 * day, to: now, resolution: "D" };
    case "3m":
      return { from: now - 90 * day, to: now, resolution: "D" };
    case "1y":
      return { from: now - 365 * day, to: now, resolution: "W" };
    case "1d":
      return { from: now - 1 * day, to: now, resolution: "5" };
    default:
      return { from: now - 30 * day, to: now, resolution: "D" };
  }
}
async function fetchFinnhubHistory(symbolRaw, range, apiKey) {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }
  const { from, to, resolution } = rangeToWindow(range);
  const key = resolveApiKey(apiKey);
  const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Finnhub history error", resp.status, text);
    throw new FinnhubError("Failed to fetch history", 502);
  }
  const raw = await resp.json();
  if (!raw || raw.s !== "ok" || !Array.isArray(raw.c) || !Array.isArray(raw.t)) {
    throw new FinnhubError("No historical data", 404);
  }
  const points = raw.c.map((close, i) => ({
    c: close,
    t: (raw.t[i] || 0) * 1e3
  }));
  return { symbol, range, points };
}
async function fetchFinnhubCandles(symbolRaw, opts, apiKey) {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) {
    throw new FinnhubError("symbol query param required, e.g. ?symbol=SPY", 400);
  }
  const window = resolveHistoryWindow(opts?.range);
  const resolution = opts?.resolution || window.resolution;
  const to = opts?.to ?? Math.floor(Date.now() / 1e3);
  const from = opts?.from ?? to - window.seconds;
  const key = resolveApiKey(apiKey);
  const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Finnhub history error", resp.status, text);
    throw new FinnhubError("Failed to fetch history", 502);
  }
  const raw = await resp.json();
  if (!raw || raw.s !== "ok" || !raw.t || !raw.t.length) {
    throw new FinnhubError("No historical data for symbol", 404);
  }
  const points = raw.t.map((time, idx) => ({
    time: time * 1e3,
    open: raw.o?.[idx] ?? 0,
    high: raw.h?.[idx] ?? 0,
    low: raw.l?.[idx] ?? 0,
    close: raw.c?.[idx] ?? 0,
    volume: raw.v?.[idx] ?? 0
  }));
  return {
    symbol,
    range: window.range,
    resolution,
    points
  };
}
async function fetchFinnhubETF(symbolRaw, apiKey) {
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
    fetch(holdingsUrl)
  ]);
  if (!profileResp.ok || !holdingsResp.ok) {
    console.error(
      "ETF profile/holdings error",
      profileResp.status,
      holdingsResp.status
    );
    throw new FinnhubError("Failed to fetch ETF data", 502);
  }
  const profileJson = await profileResp.json();
  const holdingsJson = await holdingsResp.json();
  const holdings = Array.isArray(holdingsJson?.holdings) ? holdingsJson.holdings.slice(0, 10).map((h) => ({
    symbol: String(h?.symbol || "").toUpperCase(),
    description: String(h?.description || ""),
    weight: Number(h?.weight || 0)
  })) : [];
  return {
    symbol,
    profile: {
      name: profileJson?.name ?? profileJson?.description ?? symbol,
      category: profileJson?.category,
      expenseRatio: typeof profileJson?.expenseRatio === "number" ? profileJson.expenseRatio : void 0,
      isin: profileJson?.isin,
      exchange: profileJson?.exchange
    },
    holdings
  };
}
export {
  FinnhubError,
  fetchFinnhubCandles,
  fetchFinnhubETF,
  fetchFinnhubHistory,
  fetchFinnhubQuote
};
