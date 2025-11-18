import { useEffect, useState } from "react";

export function LastUpdated({ timestamp }: { timestamp: number }) {
  const [label, setLabel] = useState("just now");

  useEffect(() => {
    if (!timestamp) return;

    const update = () => {
      const diffMs = Date.now() - timestamp;
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      if (diffSec < 10) {
        setLabel("just now");
      } else if (diffSec < 60) {
        setLabel(`${diffSec} sec ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setLabel(`${diffMin} min ago`);
      }
    };

    update();
    const id = window.setInterval(update, 10_000);
    return () => window.clearInterval(id);
  }, [timestamp]);

  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-800/70 bg-slate-950/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse"
      />
      Updated {label}
    </span>
  );
}
