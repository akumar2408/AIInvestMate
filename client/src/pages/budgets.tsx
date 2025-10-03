import React, { useState } from "react";
import { useStore, monthKey } from "../state/store";
import { toCSV } from "../lib/utils";

export function BudgetsPage() {
  const { state, addBudget } = useStore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("General");
  const [limit, setLimit] = useState("500");

  const monthTxns = state.txns.filter(
    (t) => monthKey(t.date) === month && t.amount < 0
  );
  const byCat = monthTxns.reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

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

  return (
    <section style={{ marginTop: 12 }}>
      <div className="card pad">
        <div className="title">Set a category budget</div>
        <div className="composer">
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <input
            className="input"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className="input"
            placeholder="Monthly limit"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <button className="btn" onClick={add}>
            Add
          </button>
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 14 }}>
        <div className="title">Budgets vs Actual ({month})</div>
        {state.budgets.filter((b) => b.month === month).length ? (
          state.budgets
            .filter((b) => b.month === month)
            .map((b) => {
              const actual = byCat[b.category] || 0;
              const pct = Math.min(
                100,
                Math.round((actual / Math.max(1, b.limit)) * 100)
              );
              return (
                <div key={b.id} style={{ margin: "8px 0" }}>
                  <div className="muted">{b.category}</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        background: "#0b1324",
                        border: "1px solid #26334a",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: 12,
                          width: `${pct}%`,
                          background: pct > 90 ? "#ef4444" : "#22c55e",
                        }}
                      />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      ${actual.toFixed(0)} / ${b.limit.toFixed(0)}
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="muted">No budgets yet.</div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 10 }}>
          <button className="ghost" onClick={exportBudgetsCSV}>
            Export Budgets CSV
          </button>
        </div>
      </div>
    </section>
  );
}
