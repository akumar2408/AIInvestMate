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
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/60 to-slate-950/60 p-4 text-sm">
        <div className="flex items-center justify-between text-rose-200">
          <span className="tracking-[0.18em] uppercase text-[10px]">{label ?? symbol}</span>
          <span className="text-[10px]">offline</span>
        </div>
        <p className="mt-4 text-rose-200/80">Error loading quote</p>
      </div>
    );
  }

  const price = data?.price != null ? data.price.toFixed(2) : loading ? "…" : "--";
  const change = data?.change ?? 0;
  const changePct = data?.changePercent ?? 0;
  const isUp = change >= 0;
  const pillColor = isUp
    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
    : "bg-rose-500/10 border-rose-500/30 text-rose-200";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 shadow-[0_20px_50px_rgba(2,6,23,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-400/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{symbol}</p>
          <p className="text-xs text-slate-400 mt-1">{label ?? "Tracked equity"}</p>
        </div>
        {data?.updatedAt && <LastUpdated timestamp={data.updatedAt} />}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-white tracking-tight">{data ? <>${price}</> : price}</p>
          <p className="text-xs text-slate-500 mt-1">Spot price · refreshed every 60s</p>
        </div>

        {data && (
          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${pillColor}`}>
            <span className="sr-only">Change</span>
            {isUp ? "+" : "-"}
            {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-500/5 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
