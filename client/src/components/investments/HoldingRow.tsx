import { Badge } from "@/components/ui/badge";
import { Quote, useStockQuote } from "@/hooks/useStockData";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Investment } from "@shared/schema";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type HoldingRowProps = {
  investment: Investment;
  badgeClass: string;
};

const formatChange = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

const lastUpdated = (quote: Quote | null) => {
  if (!quote?.timestamp) return "";
  return new Date(quote.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export function HoldingRow({ investment, badgeClass }: HoldingRowProps) {
  const { data: quote, loading, error } = useStockQuote(investment.symbol || null, { refreshMs: 60_000 });

  const quantity = Number(investment.quantity ?? 0);
  const fallbackPrice = Number(investment.costBasis ?? 0);
  const price = quote?.current ?? fallbackPrice;
  const currentValue = quantity * price;
  const change = quote?.change ?? 0;
  const changePct = quote?.changePct ?? 0;
  const trendPositive = change >= 0;

  const TrendIcon = trendPositive ? TrendingUp : TrendingDown;

  return (
    <div
      data-testid={`row-investment-${investment.id}`}
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4 px-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">{investment.symbol.slice(0, 2)}</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-white font-medium">{investment.symbol}</p>
            <Badge className={badgeClass}>{(investment.type || 'other').replace('_', ' ')}</Badge>
          </div>
          <p className="text-slate-400 text-sm">{investment.name || investment.symbol}</p>
          {quote?.timestamp && (
            <p className="text-slate-500 text-xs">Updated {lastUpdated(quote)}</p>
          )}
        </div>
      </div>

      <div className="text-right space-y-1">
        <div className="flex items-center justify-end space-x-2">
          <TrendIcon className={`w-4 h-4 ${trendPositive ? "text-emerald-400" : "text-red-400"}`} />
          <p className="text-white font-semibold">{currency.format(currentValue)}</p>
        </div>
        <p className="text-slate-400 text-sm">
          {quantity.toFixed(4)} shares @ {currency.format(price)}
        </p>
        <p className={`text-sm ${trendPositive ? "text-emerald-400" : "text-red-400"}`}>
          {formatChange(change)} ({formatChange(changePct)}%)
          {loading && <span className="text-slate-400 ml-1">• updating…</span>}
        </p>
        {error && <p className="text-amber-400 text-xs">Realtime data unavailable: {error}</p>}
      </div>
    </div>
  );
}
