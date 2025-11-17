import React, { useMemo, useState } from "react";
import { useStore, monthKey } from "../state/store";
import { toCSV } from "../lib/utils";

export function BudgetsPage() {
  const { state, addBudget } = useStore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("General");
  const [limit, setLimit] = useState("500");
  const [focusMode, setFocusMode] = useState(false);

  const monthTxns = state.txns.filter((t) => monthKey(t.date) === month && t.amount < 0);
  const byCat = monthTxns.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const monthlyBudgets = state.budgets.filter((b) => b.month === month);
  const totals = useMemo(() => {
    const allocated = monthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
    const spent = monthlyBudgets.reduce((sum, b) => sum + (byCat[b.category] || 0), 0);
    return { allocated, spent, remaining: Math.max(0, allocated - spent) };
  }, [monthlyBudgets, byCat]);

  function add() {
    addBudget({ month, category, limit: Number(limit || 0) });
    setCategory("General");
    setLimit("500");
  }

  function exportBudgetsCSV() {
    const csv = toCSV(state.budgets);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budgets.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleBudgets = focusMode
    ? monthlyBudgets.filter((b) => ((byCat[b.category] || 0) / Math.max(1, b.limit)) * 100 >= 80)
    : monthlyBudgets;

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Create a budget</div>
            <div className="composer" style={{ flexWrap: "wrap" }}>
              <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              <input className="input" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
              <input className="input" placeholder="Monthly limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
              <button className="btn" onClick={add}>
                Save budget
              </button>
              <button className="ghost" onClick={exportBudgetsCSV}>
                Export CSV
              </button>
            </div>
            <div className="pill-row">
              {["Housing", "Dining", "Travel", "Subscriptions"].map((preset) => (
                <button key={preset} className="chip" onClick={() => setCategory(preset)}>
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Allocation overview ({month})</div>
            <div className="stat-grid">
              <div className="stat-card">
                <span className="label">Allocated</span>
                <div className="value">${totals.allocated.toFixed(0)}</div>
                <div className="trend">Across {monthlyBudgets.length} envelopes</div>
              </div>
              <div className="stat-card">
                <span className="label">Spent</span>
                <div className="value">${totals.spent.toFixed(0)}</div>
                <div className="trend">{Math.round((totals.spent / Math.max(1, totals.allocated)) * 100)}% utilized</div>
              </div>
              <div className="stat-card">
                <span className="label">Remaining</span>
                <div className="value">${totals.remaining.toFixed(0)}</div>
                <div className="trend">Forecast runway {Math.max(0, Math.round((totals.remaining / Math.max(1, totals.spent)) * 30))} days</div>
              </div>
            </div>
            <div className="callout" style={{ marginTop: 16 }}>
              <strong>Pro tip:</strong> lock in a rule to auto-move leftover cash into your goals at month end.
            </div>
          </div>

          <div className="card pad">
            <div className="title">
              Budgets vs actuals
              <button className={`switch ${focusMode ? "on" : ""}`} onClick={() => setFocusMode((v) => !v)}>
                <span className="sr-only">toggle focus</span>
              </button>
            </div>
            {visibleBudgets.length ? (
              visibleBudgets.map((b) => {
                const actual = byCat[b.category] || 0;
                const pct = Math.min(150, Math.round((actual / Math.max(1, b.limit)) * 100));
                return (
                  <div key={b.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{b.category}</strong>
                      <span className={pct >= 100 ? "status-negative" : "status-positive"}>{pct}%</span>
                    </div>
                    <div className="progress-track" style={{ marginTop: 6 }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <p className="muted tiny" style={{ marginTop: 4 }}>
                      ${actual.toFixed(0)} / ${b.limit.toFixed(0)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="muted">{focusMode ? "No categories over 80%." : "No budgets yet."}</div>
            )}
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">Category heatmap</div>
            <div className="heatmap">
              {monthlyBudgets.map((b) => {
                const actual = byCat[b.category] || 0;
                return (
                  <div key={b.id} className="heat-tile">
                    <strong>{b.category}</strong>
                    <p className="muted tiny">${actual.toFixed(0)} / ${b.limit.toFixed(0)}</p>
                    <div className="progress-track" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, (actual / Math.max(1, b.limit)) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Recommendations</div>
            <ul className="list-clean">
              <li>
                <strong>Auto-alert dining</strong>
                <p className="muted tiny">Notify when spend exceeds $400</p>
              </li>
              <li>
                <strong>Lock travel roll-over</strong>
                <p className="muted tiny">Unused travel budget gets moved to vacation goal</p>
              </li>
              <li>
                <strong>Create subscription sink</strong>
                <p className="muted tiny">Group streaming + SaaS into single $120 cap</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
