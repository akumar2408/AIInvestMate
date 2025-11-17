import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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

export type Profile = {
  incomeRange: string;
  goalFocus: string;
  riskComfort: string;
  experience: string;
  onboardingComplete?: boolean;
};

export type ChatLog = {
  id: string;
  question: string;
  answer: string;
  month: string;
  createdAt: string;
};

type State = {
  userId?: string;
  txns: Txn[];
  budgets: Budget[];
  goals: Goal[];
  profile?: Profile | null;
  aiLogs: ChatLog[];
  cash?: number;
};

const StoreCtx = createContext<{
  state: State;
  addTxn: (t: Omit<Txn, "id">) => void;
  deleteTxn: (id: string) => void;
  importTxnsCSV: (csv: string) => number;
  addBudget: (b: Omit<Budget, "id">) => void;
  replaceBudgets: (rows: Budget[]) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  updateProfile: (profile: Profile) => void;
  logChat: (entry: { question: string; answer: string }) => void;
  exportAll: () => string;
  refreshFromCloud: (userId?: string) => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'ok' | 'error';
  lastSyncedAt?: string;
} | null>(null);

const KEY = "aimate_state_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { txns: [], budgets: [], goals: [], aiLogs: [], profile: null, ...parsed };
      }
    } catch {}
    return { txns: [], budgets: [], goals: [], aiLogs: [], userId: undefined, profile: null };
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(undefined);
  const syncTimer = useRef<number>();

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id;
      setState((s) => ({ ...s, userId: id || undefined }));
      if (id) {
        pullFromCloud(id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id;
      setState((s) => ({ ...s, userId: id || undefined }));
      if (id) {
        pullFromCloud(id);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function pullFromCloud(forcedUserId?: string) {
    const userId = forcedUserId || state.userId;
    if (!userId) return;
    setSyncStatus('syncing');
    const res = await fetch(`/api/sync/pull?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      setSyncStatus('error');
      return;
    }
    const payload = await res.json();
    setState((s) => ({
      ...s,
      userId,
      txns: payload.txns || s.txns,
      budgets: payload.budgets || s.budgets,
      goals: payload.goals || s.goals,
      profile: payload.profile || s.profile,
      aiLogs: payload.aiLogs || s.aiLogs || [],
    }));
    setSyncStatus('ok');
    setLastSyncedAt(new Date().toISOString());
  }

  useEffect(() => {
    if (!state.userId) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: state.userId,
            txns: state.txns,
            budgets: state.budgets,
            goals: state.goals,
            profile: state.profile,
            aiLogs: state.aiLogs,
          }),
        });
        setSyncStatus('ok');
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        console.error('sync failed', error);
        setSyncStatus('error');
      }
    }, 800);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [state.userId, state.txns, state.budgets, state.goals, state.profile, state.aiLogs]);

  const api = useMemo(() => ({
    state,
    syncStatus,
    lastSyncedAt,
    refreshFromCloud: (id?: string) => pullFromCloud(id),
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
    replaceBudgets: (rows: Budget[]) => setState(s => ({ ...s, budgets: rows })),
    addGoal: (g: Omit<Goal,"id">) => setState(s => ({...s, goals: [...s.goals, { ...g, id: crypto.randomUUID() }]})),
    updateGoal: (id: string, patch: Partial<Goal>) => setState(s => ({...s, goals: s.goals.map(g => g.id===id ? { ...g, ...patch } : g)})),
    updateProfile: (profile: Profile) => setState(s => ({ ...s, profile: { ...profile, onboardingComplete: true } })),
    logChat: ({ question, answer }: { question: string; answer: string }) =>
      setState((s) => ({
        ...s,
        aiLogs: [
          ...s.aiLogs,
          {
            id: crypto.randomUUID(),
            question,
            answer,
            month: questionDateKey(),
            createdAt: new Date().toISOString(),
          },
        ],
      })),
    exportAll: () => JSON.stringify(state, null, 2),
  }), [state, syncStatus, lastSyncedAt]);

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
    spikes.push({ type: "spend_spike", month: cur, current: curVal, avgPrev, diff: curVal - avgPrev });
  }
  return spikes;
}

function questionDateKey() {
  return new Date().toISOString().slice(0, 7);
}
