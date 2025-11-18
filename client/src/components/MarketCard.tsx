import { LastUpdated } from "./LastUpdated";
import { useQuote } from "@/hooks/useQuote";

type MarketCardProps = {
  symbol: string;
  label?: string;
  onRemove?: () => void;
};

export function MarketCard({ symbol, label, onRemove }: MarketCardProps) {
  const { data, loading, error } = useQuote(symbol);

  const hasQuote = data != null;
  const price = hasQuote ? `$${data.price.toFixed(2)}` : loading ? "Fetching…" : error ? "Offline" : "—";
  const change = data?.change ?? 0;
  const changePct = data?.changePercent ?? 0;
  const isUp = change >= 0;

  const changeLabel = hasQuote
    ? `${isUp ? "+" : "−"}${Math.abs(change).toFixed(2)} (${isUp ? "+" : "−"}${Math.abs(changePct).toFixed(2)}%)`
    : error
    ? "Quote offline"
    : "Awaiting data";

  const changeState = hasQuote ? (isUp ? "up" : "down") : error ? "offline" : "";

  return (
    <article className={`watch-card ${error ? "offline" : ""}`}>
      {onRemove && (
        <button type="button" className="watch-card__remove" onClick={onRemove} aria-label={`Remove ${symbol}`}>
          Remove
        </button>
      )}
      <div className="watch-card__head">
        <div>
          <p className="eyebrow tiny">{symbol}</p>
          <p className="watch-card__label">{label ?? "Tracked equity"}</p>
        </div>
        {data?.updatedAt ? (
          <LastUpdated timestamp={data.updatedAt} />
        ) : (
          <span className="watch-card__status">{loading ? "Syncing" : "Paused"}</span>
        )}
      </div>

      <div className="watch-card__body">
        <div>
          <div className="watch-card__price">{price}</div>
          <p className="muted tiny">Spot price · 60s refresh</p>
        </div>
        <div className={`watch-card__change ${changeState}`}>{changeLabel}</div>
      </div>

      {error && <p className="watch-card__error">{error || "Unable to load quote"}</p>}
    </article>
  );
}
