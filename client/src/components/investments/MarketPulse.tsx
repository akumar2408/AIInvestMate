import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockQuote } from "@/hooks/useStockData";

const TRACKED_SYMBOLS = ["SPY", "QQQ", "VOO"];

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type MarketPulseProps = {
  symbols?: string[];
};

export function MarketPulse({ symbols = TRACKED_SYMBOLS }: MarketPulseProps) {
  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Market pulse</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {symbols.map((symbol) => (
            <TickerCard key={symbol} symbol={symbol} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

type TickerCardProps = {
  symbol: string;
};

function TickerCard({ symbol }: TickerCardProps) {
  const { data, loading, error } = useStockQuote(symbol, { refreshMs: 60_000 });
  const change = data?.change ?? 0;
  const trendPositive = change >= 0;

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-4">
      <p className="text-sm text-slate-400">{symbol}</p>
      <p className="text-xl font-semibold text-white">
        {data ? currency.format(data.current) : loading ? "…" : "—"}
      </p>
      <p className={`text-sm ${trendPositive ? "text-emerald-400" : "text-red-400"}`}>
        {data ? `${trendPositive ? "+" : ""}${change.toFixed(2)} (${data.changePct >= 0 ? "+" : ""}${data.changePct.toFixed(2)}%)` : error ? "Unavailable" : "Awaiting data"}
      </p>
      {error && <p className="text-xs text-amber-400 mt-1">{error}</p>}
    </div>
  );
}
