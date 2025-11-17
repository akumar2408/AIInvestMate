import React, { useMemo, useState } from "react";
import { useStore, monthKey, Budget } from "../state/store";
import { toCSV } from "../lib/utils";
import { InfoPill } from "../components/InfoPill";
import { AskAIButton } from "../components/AskAIButton";

export function BudgetsPage() {
  const { state, addBudget, replaceBudgets } = useStore();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("General");
  const [limit, setLimit] = useState("500");
  const [focusMode, setFocusMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("Make a budget that keeps dining under $400 and invests $300/mo");
  const [aiDraft, setAiDraft] = useState<Budget[] | null>(null);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ title: string; answer: string } | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

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

  async function runBudgetAI() {
    if (!state.userId) {
      setAiNotes("Sign in to sync budgets with the cloud");
      return;
    }
    setAiLoading(true);
    setAiNotes("Drafting with AI...");
    try {
      const res = await fetch("/api/ai/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, userId: state.userId, month }),
      });
      const data = await res.json();
      if (data.plan) {
        setAiDraft(data.plan);
        setAiNotes(data.notes || "Draft ready");
      } else {
        setAiNotes("Unable to build plan");
      }
    } catch (error) {
      console.error(error);
      setAiNotes("AI budgeting failed");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiPlan() {
    if (!aiDraft) return;
    const others = state.budgets.filter((b) => b.month !== month);
    replaceBudgets([...others, ...aiDraft]);
    setAiNotes("Saved to budgets");
    setAiDraft(null);
  }

  async function askAI(title: string, payload: any) {
    setAiInsightLoading(true);
    setAiInsight(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: title, context: payload }),
      });
      const data = await res.json();
      setAiInsight({ title, answer: data.answer || "No explanation generated." });
    } catch (error) {
      console.error(error);
      setAiInsight({ title, answer: "AI explainers are offline." });
    } finally {
      setAiInsightLoading(false);
    }
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
            <div className="title">Natural-language budgeting</div>
            <textarea
              className="input"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe your income, rent, savings goals, and let AI build envelopes"
            />
            <div className="composer" style={{ marginTop: 12 }}>
              <button className="btn" onClick={runBudgetAI} disabled={aiLoading}>
                {aiLoading ? "Thinking..." : "Draft budget"}
              </button>
              {aiDraft && (
                <button className="ghost" onClick={applyAiPlan}>
                  Save plan
                </button>
              )}
              <div className="muted tiny">{aiNotes}</div>
            </div>
            {aiDraft && (
              <div className="ai-draft-grid">
                {aiDraft.map((draft) => (
                  <div key={draft.id} className="ai-draft">
                    <strong>{draft.category}</strong>
                    <span>${Number(draft.limit).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pill-row" style={{ marginTop: 12 }}>
              <InfoPill term="Envelope budgeting" />
              <InfoPill term="HYSA" />
              <InfoPill term="Emergency fund" />
            </div>
          </div>

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
            <div className="title">
              Allocation overview ({month})
              <AskAIButton
                onClick={() => askAI(`Explain how I performed in ${month}`, { month, totals })}
                style={{ marginLeft: "auto" }}
              />
            </div>
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
                      <AskAIButton
                        variant="ghost"
                        label=""
                        title="Ask AI about this category"
                        onClick={() =>
                          askAI(`Explain ${b.category} variance`, {
                            month,
                            category: b.category,
                            target: b.limit,
                            actual,
                            transactions: monthTxns.filter((t) => t.category === b.category),
                          })
                        }
                        style={{ paddingInline: 10, minWidth: 0 }}
                      />
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
          {aiInsight && (
            <div className="card pad">
              <div className="title">AI insight</div>
              <strong>{aiInsight.title}</strong>
              <p className="muted" style={{ marginTop: 8 }}>{aiInsightLoading ? "Thinking..." : aiInsight.answer}</p>
            </div>
          )}
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
