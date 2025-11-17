import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

const DEFAULT_PROFILE: Profile = {
  incomeRange: "$50k-$100k",
  goalFocus: "Save an emergency fund",
  riskComfort: "Balanced",
  experience: "Beginner",
  onboardingComplete: false,
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
  addTxn: (t: Omit<Txn, "id">) => Promise<void>;
  deleteTxn: (id: string) => Promise<void>;
  importTxnsCSV: (csv: string) => number;
  addBudget: (b: Omit<Budget, "id">) => void;
  replaceBudgets: (rows: Budget[]) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  updateProfile: (profile: Profile) => Promise<void>;
  logChat: (entry: { month: string; question: string; answer: string }) => Promise<void>;
  exportAll: () => string;
  refreshFromCloud: (userId?: string) => Promise<void>;
  initFromSupabase: (userId?: string) => Promise<void>;
  clearCloudState: () => void;
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

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  async function pullFromCloud(forcedUserId?: string) {
    try {
      let userId = forcedUserId || state.userId;
      if (!userId) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id;
      }
      if (!userId) {
        setSyncStatus('idle');
        setState((s) => ({ ...s, userId: undefined }));
        return;
      }

      setSyncStatus('syncing');

      await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            income_range: state.profile?.incomeRange ?? DEFAULT_PROFILE.incomeRange,
            goal_focus: state.profile?.goalFocus ?? DEFAULT_PROFILE.goalFocus,
            risk_comfort: state.profile?.riskComfort ?? DEFAULT_PROFILE.riskComfort,
            experience: state.profile?.experience ?? DEFAULT_PROFILE.experience,
          },
          { onConflict: 'id' }
        );

      const [txRes, budRes, goalRes, logRes, profRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true }),
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase
          .from('ai_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      ]);

      const txns: Txn[] = (txRes.data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        category: row.category,
        amount: Number(row.amount),
        account: row.account || undefined,
      }));

      const budgets: Budget[] = (budRes.data || []).map((row: any) => ({
        id: row.id,
        month: row.month,
        category: row.category,
        limit: Number(row.limit_amount ?? row.limit ?? 0),
      }));

      const goals: Goal[] = (goalRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        target: Number(row.target),
        current: Number(row.current),
        deadline: row.deadline,
      }));

      const aiLogs: ChatLog[] = (logRes.data || []).map((row: any) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        month: row.month,
        createdAt: row.created_at,
      }));

      const profileRow = profRes.data;
      const profile: Profile | null = profileRow
        ? {
            incomeRange: profileRow.income_range ?? state.profile?.incomeRange ?? DEFAULT_PROFILE.incomeRange,
            goalFocus: profileRow.goal_focus ?? state.profile?.goalFocus ?? DEFAULT_PROFILE.goalFocus,
            riskComfort: profileRow.risk_comfort ?? state.profile?.riskComfort ?? DEFAULT_PROFILE.riskComfort,
            experience: profileRow.experience ?? state.profile?.experience ?? DEFAULT_PROFILE.experience,
            onboardingComplete: true,
          }
        : state.profile ?? null;

      if (txRes.error) console.error('txns error', txRes.error);
      if (budRes.error) console.error('budgets error', budRes.error);
      if (goalRes.error) console.error('goals error', goalRes.error);
      if (logRes.error) console.error('logs error', logRes.error);
      if (profRes.error) console.error('profile error', profRes.error);

      setState((s) => ({
        ...s,
        userId,
        txns,
        budgets,
        goals,
        aiLogs,
        profile,
      }));
      setSyncStatus('ok');
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('supabase pull failed', error);
      setSyncStatus('error');
    }
  }

  const api = useMemo(() => ({
    state,
    syncStatus,
    lastSyncedAt,
    refreshFromCloud: (id?: string) => pullFromCloud(id),
    initFromSupabase: (id?: string) => pullFromCloud(id),
    clearCloudState: () => {
      setState((s) => ({ ...s, userId: undefined }));
      setSyncStatus('idle');
      setLastSyncedAt(undefined);
    },
    addTxn: async (t: Omit<Txn, "id">) => {
      const userId = state.userId;
      if (userId) {
        setSyncStatus('syncing');
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            date: t.date,
            description: t.description,
            category: t.category,
            amount: t.amount,
          })
          .select('*')
          .single();

        if (error || !data) {
          console.error('add txn error', error);
          setSyncStatus('error');
          return;
        }

        setState((s) => ({
          ...s,
          txns: [
            ...s.txns,
            {
              id: data.id,
              date: data.date,
              description: data.description,
              category: data.category,
              amount: Number(data.amount),
              account: data.account || undefined,
            },
          ],
        }));
        setSyncStatus('ok');
        setLastSyncedAt(new Date().toISOString());
        return;
      }

      setState((s) => ({ ...s, txns: [...s.txns, { ...t, id: crypto.randomUUID() }] }));
    },
    deleteTxn: async (id: string) => {
      setState((s) => ({ ...s, txns: s.txns.filter((x) => x.id !== id) }));
      if (!state.userId) return;
      try {
        await supabase.from('transactions').delete().eq('id', id).eq('user_id', state.userId);
        setSyncStatus('ok');
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        console.error('delete txn error', error);
        setSyncStatus('error');
      }
    },
    importTxnsCSV: (csv: string) => {
      const lines = csv.trim().split(/\r?\n/);
      if (!lines.length) return 0;
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      const rows = lines.slice(1);
      let count = 0;
      setState((s) => {
        const txns = [...s.txns];
        for (const r of rows) {
          if (!r.trim()) continue;
          const cols = r.split(',').map((c) => c.trim());
          const date = cols[idx('date')] || new Date().toISOString().slice(0, 10);
          const description = cols[idx('description')] || 'Imported';
          const category = cols[idx('category')] || 'Other';
          const amount = parseFloat(cols[idx('amount')] || '0');
          txns.push({ id: crypto.randomUUID(), date, description, category, amount });
          count++;
        }
        return { ...s, txns };
      });
      return count;
    },
    addBudget: (b: Omit<Budget, 'id'>) =>
      setState((s) => ({ ...s, budgets: [...s.budgets, { ...b, id: crypto.randomUUID() }] })),
    replaceBudgets: (rows: Budget[]) => setState((s) => ({ ...s, budgets: rows })),
    addGoal: (g: Omit<Goal, 'id'>) =>
      setState((s) => ({ ...s, goals: [...s.goals, { ...g, id: crypto.randomUUID() }] })),
    updateGoal: (id: string, patch: Partial<Goal>) =>
      setState((s) => ({
        ...s,
        goals: s.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
      })),
    updateProfile: async (profile: Profile) => {
      setState((s) => ({ ...s, profile: { ...profile, onboardingComplete: true } }));
      if (!state.userId) return;
      try {
        await supabase.from('profiles').upsert({
          id: state.userId,
          income_range: profile.incomeRange,
          goal_focus: profile.goalFocus,
          risk_comfort: profile.riskComfort,
          experience: profile.experience,
        });
        setSyncStatus('ok');
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        console.error('update profile error', error);
        setSyncStatus('error');
      }
    },
    logChat: async ({ month, question, answer }: { month: string; question: string; answer: string }) => {
      const entry: ChatLog = {
        id: crypto.randomUUID(),
        question,
        answer,
        month,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, aiLogs: [...s.aiLogs, entry] }));
      if (!state.userId) return;
      const { data, error } = await supabase
        .from('ai_logs')
        .insert({ user_id: state.userId, month, question, answer })
        .select('*')
        .single();
      if (error || !data) {
        console.error('log chat error', error);
        return;
      }
      setState((s) => ({
        ...s,
        aiLogs: s.aiLogs.map((log) =>
          log.id === entry.id
            ? { id: data.id, question: data.question, answer: data.answer, month: data.month, createdAt: data.created_at }
            : log
        ),
      }));
      setSyncStatus('ok');
      setLastSyncedAt(new Date().toISOString());
    },
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

