import type { CandlePoint } from "@/hooks/useStockData";

export type StockSparklineProps = {
  points?: CandlePoint[] | null;
  trendPositive?: boolean;
  height?: number;
  className?: string;
};

export function StockSparkline({ points, trendPositive = true, height = 36, className }: StockSparklineProps) {
  if (!points || points.length < 2) {
    return (
      <div
        className={className}
        style={{
          height,
          width: "100%",
          opacity: 0.4,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        —
      </div>
    );
  }

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const width = 100;
  const heightPx = Math.max(10, height);
  const denom = points.length - 1 || 1;

  const coords = closes
    .map((value, idx) => {
      const x = (idx / denom) * width;
      const normalized = (value - min) / range;
      const y = heightPx - normalized * heightPx;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const stroke = trendPositive ? "#34d399" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${width} ${heightPx}`}
      className={className}
      style={{ width: "100%", height: heightPx }}
      role="img"
      aria-label="Mini price trend"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}
