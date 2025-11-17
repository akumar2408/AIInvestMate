import { useEffect, useState } from "react";
import type { CandleRange, StockHistoryPayload } from "@shared/finnhub";

async function readJsonSafely<T = unknown>(resp: Response): Promise<T> {
  const clone = resp.clone();
  try {
    return (await resp.json()) as T;
  } catch (err) {
    const fallback = await clone.text();
    const snippet = fallback?.trim()?.slice(0, 200);
    const message =
      snippet?.length
        ? snippet
        : `Unexpected response from server (status ${resp.status})`;
    throw new Error(message);
  }
}

export type Quote = {
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

export type ETFProfile = {
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

export type CandlePoint = StockHistoryPayload["points"][number];

type ApiResponse<T> = T & { error?: string };

export function useStockQuote(symbol: string | null, opts?: { refreshMs?: number }) {
  const [data, setData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    let timer: number | undefined;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
        const json = await readJsonSafely<ApiResponse<Quote>>(resp);
        if (!resp.ok) {
          throw new Error(json.error || "Failed to load quote");
        }
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error loading quote");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuote();

    if (opts?.refreshMs && opts.refreshMs > 0) {
      timer = window.setInterval(fetchQuote, opts.refreshMs);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [symbol, opts?.refreshMs]);

  return { data, loading, error };
}

export function useETFOverview(symbol: string | null) {
  const [data, setData] = useState<ETFProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    const fetchETF = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/stocks/etf?symbol=${encodeURIComponent(symbol)}`);
        const json = await readJsonSafely<ApiResponse<ETFProfile>>(resp);
        if (!resp.ok) throw new Error(json.error || "Failed to load ETF data");
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error loading ETF");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchETF();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return { data, loading, error };
}

export function useStockHistory(
  symbol: string | null,
  opts?: { range?: CandleRange; resolution?: string; refreshMs?: number }
) {
  const [data, setData] = useState<StockHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    let timer: number | undefined;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ symbol });
        if (opts?.range) params.set("range", opts.range);
        if (opts?.resolution) params.set("resolution", opts.resolution);
        const resp = await fetch(`/api/stocks/history?${params.toString()}`);
        const json = await readJsonSafely<ApiResponse<StockHistoryPayload>>(resp);
        if (!resp.ok) throw new Error(json.error || "Failed to load history");
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error loading history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();

    if (opts?.refreshMs && opts.refreshMs > 0) {
      timer = window.setInterval(fetchHistory, opts.refreshMs);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [symbol, opts?.range, opts?.resolution, opts?.refreshMs]);

  return { data, loading, error };
}
