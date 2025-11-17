import React, { useMemo, useState } from "react";
import { useStore, monthKey } from "../state/store";

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

type Metric = "inc" | "exp" | "save";

export function ReportsPage() {
  const { state } = useStore();
  const months = Array.from(new Set(state.txns.map((t) => monthKey(t.date)))).sort();
  const [metric, setMetric] = useState<Metric>("save");
  const data = useMemo(() => {
    return months.map((m) => {
      const tx = state.txns.filter((t) => monthKey(t.date) === m);
      const inc = sum(tx.filter((t) => t.amount > 0).map((t) => t.amount));
      const exp = Math.abs(sum(tx.filter((t) => t.amount < 0).map((t) => t.amount)));
      return { m, inc, exp, save: Math.max(0, inc - exp) };
    });
  }, [months, state.txns]);

  const spendByCategory = useMemo(() => {
    return state.txns
      .filter((t) => t.amount < 0)
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
  }, [state.txns]);
  const totalSpend = Object.values(spendByCategory).reduce((a, b) => a + b, 0);
  const topShare = totalSpend
    ? Object.values(spendByCategory)
        .sort((a, b) => b - a)
        .slice(0, 3)
        .reduce((a, b) => a + b, 0) / totalSpend
    : 0;

  const totals = data.reduce(
    (acc, d) => {
      acc.inc += d.inc;
      acc.exp += d.exp;
      acc.save += d.save;
      return acc;
    },
    { inc: 0, exp: 0, save: 0 }
  );

  const bestMonth = data.length
    ? data.reduce((best, current) => {
        if (!best) return current;
        return current.save > best.save ? current : best;
      }, data[0])
    : undefined;

  const chartMax = Math.max(1, ...data.map((d) => d[metric]));
  const points = data.map((d, i) => {
    const x = 60 + (i * (700 / Math.max(1, data.length - 1)));
    const y = 220 - (d[metric] / chartMax) * 180;
    return `${x},${Math.max(40, y)}`;
  });

  const metricLabels: Record<Metric, string> = {
    inc: "Income",
    exp: "Spending",
    save: "Savings",
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Cashflow trends</div>
            <div className="segment" style={{ margin: "16px 0" }}>
              {(["inc", "exp", "save"] as Metric[]).map((key) => (
                <button key={key} className={metric === key ? "active" : ""} onClick={() => setMetric(key)}>
                  {metricLabels[key]}
                </button>
              ))}
            </div>
            <svg viewBox="0 0 800 260" style={{ width: "100%", height: 260 }}>
              <defs>
                <linearGradient id="gradientLine" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke={metric === "exp" ? "#f87171" : metric === "inc" ? "#4ade80" : "#22d3ee"}
                strokeWidth={3}
                points={points.join(" ")}
              />
              <polygon
                fill="url(#gradientLine)"
                opacity={0.4}
                points={`60,220 ${points.join(" ")} 760,220`}
              />
              {data.map((d, i) => {
                const x = 60 + (i * (700 / Math.max(1, data.length - 1)));
                return (
                  <g key={d.m}>
                    <circle cx={x} cy={220 - (d[metric] / chartMax) * 180} r={4} fill="#f8fafc" />
                    <text x={x} y={240} textAnchor="middle" fill="#94a3b8" fontSize="10">
                      {d.m}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="card pad">
            <div className="title">Quarterly summary</div>
            <div className="grid-kpi">
              <div className="stat-card">
                <span className="label">Total income</span>
                <div className="value">${totals.inc.toFixed(0)}</div>
                <div className="trend">Avg ${(totals.inc / Math.max(1, data.length)).toFixed(0)} / month</div>
              </div>
              <div className="stat-card">
                <span className="label">Total spend</span>
                <div className="value">${totals.exp.toFixed(0)}</div>
                <div className="trend">{Math.round((totals.exp / Math.max(1, totals.inc)) * 100)}% of inflow</div>
              </div>
              <div className="stat-card">
                <span className="label">Savings captured</span>
                <div className="value">${totals.save.toFixed(0)}</div>
                <div className="trend">Best month {bestMonth?.m}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">AI insights</div>
            <ul className="list-clean">
              <li>
                <strong>{bestMonth?.m || "--"}</strong>
                <p className="muted tiny">Highest savings month · ${bestMonth ? bestMonth.save.toFixed(0) : "0"}</p>
              </li>
              <li>
                <strong>Spending concentration</strong>
                <p className="muted tiny">Top 3 categories make up {Math.round(topShare * 100)}% of spend</p>
              </li>
              <li>
                <strong>Runway</strong>
                <p className="muted tiny">Current burn suggests {Math.max(1, Math.round((totals.save || 1) / Math.max(1, totals.exp / Math.max(1, data.length)))).toFixed(0)} months cushion</p>
              </li>
            </ul>
          </div>

          <div className="card pad">
            <div className="title">Next steps</div>
            <div className="callout">
              <strong>Auto-share report</strong>
              <p className="muted">Send a PDF snapshot to your advisor each quarter straight from InvestMate.</p>
            </div>
            <div className="pill-row">
              {["Download PDF", "Schedule recap", "Share to chat"].map((action) => (
                <span key={action} className="pill">
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}