import { LastUpdated } from "./LastUpdated";
import { useQuote } from "@/hooks/useQuote";

type MarketCardProps = {
  symbol: string;
  label?: string;
};

export function MarketCard({ symbol, label }: MarketCardProps) {
  const { data, loading, error } = useQuote(symbol);

  if (error) {
    return (
      <div className="rounded-2xl bg-slate-900/70 p-4 flex flex-col justify-between border border-rose-500/30">
        <div className="text-sm text-slate-400">{label ?? symbol}</div>
        <div className="text-xs text-rose-400 mt-4">Error loading quote</div>
      </div>
    );
  }

  const price = data?.price != null ? data.price.toFixed(2) : loading ? "…" : "--";
  const change = data?.change ?? 0;
  const changePct = data?.changePercent ?? 0;
  const changeColor = change >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="rounded-2xl bg-slate-900/70 p-4 flex flex-col justify-between shadow-md shadow-slate-900/40 border border-slate-800/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold tracking-[0.12em] text-slate-400">{symbol}</span>
        {data?.updatedAt && <LastUpdated timestamp={data.updatedAt} />}
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="text-2xl font-semibold text-slate-50">
          {data ? <>${price}</> : price}
        </div>
        {data && (
          <div className={`text-sm font-medium ${changeColor}`}>
            {change.toFixed(2)} ({changePct.toFixed(2)}%)
          </div>
        )}
      </div>
    </div>
  );
}
