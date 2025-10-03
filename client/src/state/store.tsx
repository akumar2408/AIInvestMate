import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Txn = {
  id: string;
  date: string; // ISO
  description: string;
  category: string;
  amount: number; // negative = expense, positive = income
  account?: string;
};

export type Budget = {
  id: string;
  month: string; // YYYY-MM
  category: string;
  limit: number;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string; // ISO
};

type State = {
  userId?: string;
  txns: Txn[];
  budgets: Budget[];
  goals: Goal[];
};

const StoreCtx = createContext<{
  state: State;
  addTxn: (t: Omit<Txn, "id">) => void;
  deleteTxn: (id: string) => void;
  importTxnsCSV: (csv: string) => number;
  addBudget: (b: Omit<Budget, "id">) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  exportAll: () => string;
} | null>(null);

const KEY = "aimate_state_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { txns: [], budgets: [], goals: [], userId: undefined };
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo(() => ({
    state,
    addTxn: (t: Omit<Txn,"id">) => setState(s => ({...s, txns: [...s.txns, { ...t, id: crypto.randomUUID() }]})),
    deleteTxn: (id: string) => setState(s => ({...s, txns: s.txns.filter(x => x.id !== id)})),
    importTxnsCSV: (csv: string) => {
      const lines = csv.trim().split(/\r?\n/);
      if (!lines.length) return 0;
      const header = lines[0].split(",").map(h=>h.trim().toLowerCase());
      const idx = (k:string)=> header.indexOf(k);
      const rows = lines.slice(1);
      let count = 0;
      setState(s => {
        const txns = [...s.txns];
        for (const r of rows) {
          if (!r.trim()) continue;
          const cols = r.split(",").map(c => c.trim());
          const date = cols[idx("date")] || new Date().toISOString().slice(0,10);
          const description = cols[idx("description")] || "Imported";
          const category = cols[idx("category")] || "Other";
          const amount = parseFloat(cols[idx("amount")] || "0");
          txns.push({ id: crypto.randomUUID(), date, description, category, amount });
          count++;
        }
        return { ...s, txns };
      });
      return count;
    },
    addBudget: (b: Omit<Budget,"id">) => setState(s => ({...s, budgets: [...s.budgets, { ...b, id: crypto.randomUUID() }]})),
    addGoal: (g: Omit<Goal,"id">) => setState(s => ({...s, goals: [...s.goals, { ...g, id: crypto.randomUUID() }]})),
    updateGoal: (id: string, patch: Partial<Goal>) => setState(s => ({...s, goals: s.goals.map(g => g.id===id ? { ...g, ...patch } : g)})),
    exportAll: () => JSON.stringify(state, null, 2),
  }), [state]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("Store not ready");
  return ctx;
}

// helpers
export function monthKey(dateISO: string) {
  return dateISO.slice(0,7); // YYYY-MM
}

export function detectAnomalies(txns: Txn[]) {
  // naive: compare this month's spend to average of prior 3 months
  const byMonth: Record<string, number> = {};
  for (const t of txns) {
    const m = monthKey(t.date);
    if (t.amount < 0) byMonth[m] = (byMonth[m] || 0) + Math.abs(t.amount);
  }
  const months = Object.keys(byMonth).sort();
  const cur = months[months.length-1];
  if (!cur) return [];
  const prev3 = months.slice(Math.max(0, months.length-4), months.length-1);
  const avgPrev = prev3.length ? prev3.reduce((a,m)=>a+(byMonth[m]||0),0)/prev3.length : 0;
  const spikes = [];
  const curVal = byMonth[cur] || 0;
  if (avgPrev && curVal > avgPrev * 1.3) {
    spikes.push({ type: "spend_spike", month: cur, current: curVal, avgPrev });
  }
  return spikes;
}
