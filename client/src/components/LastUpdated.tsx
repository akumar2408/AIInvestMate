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

  return <span className="watch-card__updated">Updated {label}</span>;
}
