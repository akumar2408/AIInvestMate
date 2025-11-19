import React, { useEffect, useState } from "react";

type RedditMoodResponse = {
  summary: string;
  stats: {
    totalPosts: number;
    subs: string[];
  };
};

export function RedditMoodCard() {
  const [data, setData] = useState<RedditMoodResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/reddit/mood");
        if (!res.ok) {
          throw new Error("Failed to load /api/reddit/mood");
        }
        const body = (await res.json()) as RedditMoodResponse;
        if (!active) return;
        setData(body);
        setStatus("ready");
      } catch (error) {
        console.error("Reddit mood load failed", error);
        if (active) {
          setStatus("error");
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const subsLabel = data?.stats?.subs?.length
    ? data.stats.subs.map((sub) => `r/${sub}`).join(", ")
    : "r/stocks, r/investing, r/wallstreetbets";

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 flex flex-col gap-3 text-slate-100 h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Reddit Market Mood</p>
          <p className="text-[13px] text-slate-400">{subsLabel}</p>
        </div>
        <span className="px-3 py-1 text-[11px] rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {data?.stats?.totalPosts ?? "—"} posts
        </span>
      </div>
      {status === "loading" && <p className="text-sm text-slate-400">Loading Reddit mood…</p>}
      {status === "error" && (
        <p className="text-sm text-amber-300">Retail sentiment is offline right now.</p>
      )}
      {status === "ready" && data && (
        <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-line">
          {data.summary}
        </p>
      )}
    </div>
  );
}
