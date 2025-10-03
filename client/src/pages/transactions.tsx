import React, { useRef, useState } from "react";
import { useStore } from "../state/store";
import { toCSV } from "../lib/utils";

export function TransactionsPage() {
  const { state, addTxn, deleteTxn, importTxnsCSV } = useStore();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    category: "General",
    amount: "",
  });
  const fileRef = useRef<HTMLInputElement | null>(null);

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

    // Merge into localStorage snapshot (keeps React hooks simple here)
    const raw = localStorage.getItem("aimate_state_v1") || "{}";
    const current = raw ? JSON.parse(raw) : { txns: [] };
    const existing = new Set<string>((current.txns || []).map((t: any) => t.id));
    const merged = [...(current.txns || [])];
    data.transactions.forEach((t: any) => {
      if (!existing.has(t.id)) merged.push(t);
    });
    localStorage.setItem(
      "aimate_state_v1",
      JSON.stringify({ ...current, txns: merged })
    );
    alert("Imported mocked Plaid transactions. Refresh Dashboard.");
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="card pad">
        <div className="title">Add transaction</div>
        <div className="composer">
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <input
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
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
            Add
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={onImport}
            style={{ display: "none" }}
          />
          <button className="ghost" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          CSV headers: <b>date, description, category, amount</b>
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 14 }}>
        <div className="title">All transactions</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#94a3b8" }}>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.txns
              .slice()
              .reverse()
              .map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid #1f2937" }}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td
                    style={{
                      textAlign: "right",
                      color: t.amount < 0 ? "#fca5a5" : "#a7f3d0",
                    }}
                  >
                    {t.amount < 0 ? "-" : ""}${Math.abs(t.amount).toFixed(2)}
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

        {/* Actions under the table */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="ghost" onClick={exportCSV}>
            Export CSV
          </button>
          <button className="ghost" onClick={exportJSON}>
            Export JSON
          </button>
          <button className="ghost" onClick={importPlaidMock}>
            Import from Plaid (mock)
          </button>
        </div>
      </div>
    </section>
  );
}
