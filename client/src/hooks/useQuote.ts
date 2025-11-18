import { useEffect, useState } from "react";

export type QuoteData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: number;
};

export function useQuote(symbol: string, refreshMs = 60_000) {
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    let timer: number | undefined;

    const fetchQuote = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as QuoteData;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load quote");
          setLoading(false);
        }
      } finally {
        if (!cancelled && refreshMs > 0) {
          timer = window.setTimeout(fetchQuote, refreshMs);
        }
      }
    };

    fetchQuote();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [symbol, refreshMs]);

  return { data, loading, error };
}
