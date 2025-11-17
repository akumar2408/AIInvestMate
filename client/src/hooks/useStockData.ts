import { useEffect, useState } from "react";

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
        const json = await resp.json();
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
        const json = await resp.json();
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
