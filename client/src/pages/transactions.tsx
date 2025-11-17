import React, { useMemo, useRef, useState } from "react";
import { useStore, monthKey } from "../state/store";
import { toCSV } from "../lib/utils";

type FilterView = "all" | "income" | "expense";

export function TransactionsPage() {
  const { state, addTxn, deleteTxn, importTxnsCSV } = useStore();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: "General",
    amount: "",
  });
  const [view, setView] = useState<FilterView>("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const filteredTxns = state.txns
    .filter((t) => {
      if (view === "income") return t.amount > 0;
      if (view === "expense") return t.amount < 0;
      return true;
    })
    .filter((t) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    })
    .slice()
    .reverse();

  const monthlyStats = useMemo(() => {
    const monthTxns = state.txns.filter((t) => monthKey(t.date) === thisMonth);
    const income = monthTxns.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
    const spend = Math.abs(monthTxns.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0));
    const topCategory = monthTxns
      .filter((t) => t.amount < 0)
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
    const [topCat, topVal] = Object.entries(topCategory).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || ["-", 0];
    return { income, spend, net: income - spend, topCat, topVal };
  }, [state.txns, thisMonth]);

  const onAdd = () => {
    const amt = Number(form.amount || 0);
    if (!form.description) return;
    addTxn({
      date: form.date,
      description: form.description,
      category: form.category,
      amount: amt,
    });
    setForm((f) => ({ ...f, description: "", amount: "" }));
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const added = importTxnsCSV(text);
    alert(`Imported ${added} transactions`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const exportCSV = () => {
    const csv = toCSV(state.txns);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state.txns, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlaidMock = async () => {
    const r = await fetch("/api/plaid/transactions");
    const data = await r.json();
    if (!data.transactions?.length) return;

    const raw = localStorage.getItem("aimate_state_v1") || "{}";
    const current = raw ? JSON.parse(raw) : { txns: [] };
    const existing = new Set<string>((current.txns || []).map((t: any) => t.id));
    const merged = [...(current.txns || [])];
    data.transactions.forEach((t: any) => {
      if (!existing.has(t.id)) merged.push(t);
    });
    localStorage.setItem("aimate_state_v1", JSON.stringify({ ...current, txns: merged }));
    alert("Imported mocked Plaid transactions. Refresh Dashboard.");
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">
              Transaction cockpit <strong>{state.txns.length} records</strong>
            </div>
            <div className="toolbar">
              <input
                className="input"
                placeholder="Search description or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="segment">
                {["all", "income", "expense"].map((type) => (
                  <button key={type} className={view === type ? "active" : ""} onClick={() => setView(type as FilterView)}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid-kpi" style={{ marginTop: 20 }}>
              <div className="stat-card">
                <span className="label">Monthly inflow</span>
                <div className="value">${monthlyStats.income.toFixed(0)}</div>
                <div className="trend">vs spend ${monthlyStats.spend.toFixed(0)}</div>
              </div>
              <div className="stat-card">
                <span className="label">Net cash</span>
                <div className="value">${monthlyStats.net.toFixed(0)}</div>
                <div className={monthlyStats.net >= 0 ? "trend" : "status-negative"}>
                  {monthlyStats.net >= 0 ? "Positive" : "Drawdown"}
                </div>
              </div>
              <div className="stat-card">
                <span className="label">Top category</span>
                <div className="value" style={{ fontSize: "1rem" }}>
                  {monthlyStats.topCat}
                </div>
                <div className="trend">${Number(monthlyStats.topVal).toFixed(0)} this month</div>
              </div>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Add transaction</div>
            <div className="composer" style={{ flexWrap: "wrap" }}>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <input
                className="input"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                className="input"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="input"
                placeholder="Amount (negative=expense)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <button className="btn" onClick={onAdd}>
                Save entry
              </button>
              <input ref={fileRef} type="file" accept=".csv" onChange={onImport} style={{ display: "none" }} />
              <button className="ghost" onClick={() => fileRef.current?.click()}>
                Import CSV
              </button>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              CSV headers: <b>date, description, category, amount</b>
            </p>
          </div>

          <div className="card pad">
            <div className="title">Ledger</div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>{t.description}</td>
                      <td>{t.category}</td>
                      <td style={{ textAlign: "right" }} className={t.amount < 0 ? "status-negative" : "status-positive"}>
                        {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="ghost" onClick={() => deleteTxn(t.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="ghost" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="ghost" onClick={exportJSON}>
                Export JSON
              </button>
              <button className="ghost" onClick={importPlaidMock}>
                Import Plaid mock
              </button>
            </div>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">Automation suggestions</div>
            <ul className="list-clean">
              <li>
                <strong>Recurring rent rule</strong>
                <p className="muted tiny">Save 6 manual entries / mo</p>
              </li>
              <li>
                <strong>Dining alert</strong>
                <p className="muted tiny">Flag when category exceeds $400</p>
              </li>
              <li>
                <strong>Income reconciliation</strong>
                <p className="muted tiny">Tag incoming wires &gt; $1,000</p>
              </li>
            </ul>
          </div>

          <div className="card pad">
            <div className="title">Quick filters</div>
            <div className="chips-inline">
              {["Dining", "Travel", "Groceries", "Payroll"].map((chip) => (
                <button key={chip} className={query === chip.toLowerCase() ? "active" : ""} onClick={() => setQuery(chip.toLowerCase())}>
                  {chip}
                </button>
              ))}
              <button onClick={() => setQuery("")}>Clear</button>
            </div>
            <div className="callout" style={{ marginTop: 16 }}>
              <strong>Need deeper history?</strong>
              <p className="muted">
                Export CSV and drop it into your spreadsheet, or share securely with your advisor in one click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
