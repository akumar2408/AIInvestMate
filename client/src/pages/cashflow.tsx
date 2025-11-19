import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore, monthKey } from "../state/store";

type FilterView = "all" | "income" | "expense";

const defaultTxn = () => ({
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: "General",
  amount: "",
});

type AiModalConfig = {
  title: string;
  prompt: string;
  context: Record<string, any>;
};

type AiInlineButtonProps = {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
};

function AiInlineButton({ label, onClick, ariaLabel }: AiInlineButtonProps) {
  return (
    <button className="ai-inline" onClick={onClick} aria-label={ariaLabel ?? label}>
      <Sparkles size={14} />
      <span>{label}</span>
    </button>
  );
}

export function CashflowPage() {
  const { state, addTxn, addBudget, deleteTxn, deleteBudget } = useStore();
  const [view, setView] = useState<FilterView>("all");
  const [query, setQuery] = useState("");
  const [txnForm, setTxnForm] = useState(defaultTxn);
  const [budgetCategory, setBudgetCategory] = useState("Housing");
  const [budgetLimit, setBudgetLimit] = useState("500");
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyTxns = useMemo(
    () => state.txns.filter((txn) => monthKey(txn.date) === currentMonth),
    [state.txns, currentMonth]
  );

  const filteredTxns = useMemo(() => {
    return state.txns
      .filter((txn) => {
        if (view === "income") return txn.amount > 0;
        if (view === "expense") return txn.amount < 0;
        return true;
      })
      .filter((txn) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          txn.description.toLowerCase().includes(q) ||
          txn.category.toLowerCase().includes(q)
        );
      })
      .slice()
      .reverse();
  }, [state.txns, view, query]);

  const monthlyStats = useMemo(() => {
    const income = monthlyTxns
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
    const spend = Math.abs(
      monthlyTxns
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );
    const net = income - spend;
    const savingsRate = income ? Math.round((Math.max(0, net) / income) * 100) : 0;
    const runway = spend ? Math.max(1, Math.round((state.cash || 12000) / spend)) : 12;
    return { income, spend, net, savingsRate, runway };
  }, [monthlyTxns, state.cash]);

  const budgetsThisMonth = state.budgets.filter((budget) => budget.month === currentMonth);

  const spendByCategory = useMemo(() => {
    return monthlyTxns
      .filter((txn) => txn.amount < 0)
      .reduce<Record<string, number>>((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + Math.abs(txn.amount);
        return acc;
      }, {});
  }, [monthlyTxns]);

  const topCategories = Object.entries(spendByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const [aiModal, setAiModal] = useState<AiModalConfig | null>(null);
  const [aiModalAnswer, setAiModalAnswer] = useState("Tap run to draft a briefing.");
  const [aiModalLoading, setAiModalLoading] = useState(false);
  const [aiModalError, setAiModalError] = useState<string | null>(null);

  const runAiModal = async (config: AiModalConfig) => {
    setAiModal(config);
    setAiModalAnswer("Generating quick insight…");
    setAiModalError(null);
    setAiModalLoading(true);
    try {
      const compactPrompt = `${config.prompt}

Rules:
- Keep it under 120 words.
- Start with one crisp sentence, then 3 short bullet points.
- Reference transactions, budgets, or categories only if provided.
- End with one \"Watch next\" bullet.`;

      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: compactPrompt,
          context: config.context,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to load /api/ai/explain");
      }
      const data = await res.json();
      setAiModalAnswer(data.answer || "No analysis generated.");
    } catch (error) {
      console.error("Cashflow AI analysis error", error);
      setAiModalError("AI analysis is offline. Try again shortly.");
    } finally {
      setAiModalLoading(false);
    }
  };

  const closeAiModal = () => {
    setAiModal(null);
    setAiModalAnswer("Tap run to draft a briefing.");
    setAiModalError(null);
  };

  const launchTransactionsAI = () =>
    runAiModal({
      title: "AI on recent transactions",
      prompt:
        "Explain the latest transactions mix, highlight notable inflows/outflows, and give one actionable recommendation.",
      context: {
        month: currentMonth,
        totals: monthlyStats,
        sampleTransactions: filteredTxns.slice(0, 12),
        budgets: budgetsThisMonth,
      },
    });

  const launchBudgetsAI = () =>
    runAiModal({
      title: "AI on budgets",
      prompt:
        "Review these budgets versus actuals, call out risky categories, and suggest the next step to stay on plan.",
      context: {
        month: currentMonth,
        budgets: budgetsThisMonth,
        spendByCategory,
      },
    });

  const launchCategoriesAI = () =>
    runAiModal({
      title: "AI on category hotspots",
      prompt: "Summarize where spending is concentrated and note what to watch this month.",
      context: {
        month: currentMonth,
        topCategories,
        spendByCategory,
        totals: monthlyStats,
      },
    });

  const incomeVsSpend = useMemo(() => {
    const months = Array.from(new Set(state.txns.map((txn) => monthKey(txn.date))))
      .sort()
      .slice(-6);
    return months.map((month) => {
      const txns = state.txns.filter((txn) => monthKey(txn.date) === month);
      const income = txns
        .filter((txn) => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);
      const spend = Math.abs(
        txns.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0)
      );
      return { month, income, spend };
    });
  }, [state.txns]);

  const chartMax = Math.max(
    1,
    ...incomeVsSpend.flatMap((row) => [row.income, row.spend])
  );

  const addTransaction = () => {
    const amount = Number(txnForm.amount);
    if (!txnForm.description || !amount) return;
    addTxn({
      date: txnForm.date,
      description: txnForm.description,
      category: txnForm.category,
      amount,
    });
    setTxnForm(defaultTxn);
  };

  const addBudgetRow = () => {
    const limit = Number(budgetLimit);
    if (!limit) return;
    addBudget({
      month: currentMonth,
      category: budgetCategory,
      limit,
    });
    setBudgetCategory("Housing");
    setBudgetLimit("500");
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">
              Cashflow command center <strong>{currentMonth}</strong>
            </div>
            <p className="subtle">
              Track monthly inflows, outflows, and savings velocity at a glance.
            </p>
            <div className="stat-grid" style={{ marginTop: 18 }}>
              <div className="stat-card">
                <span className="label">Net cashflow</span>
                <div className="value">${monthlyStats.net.toFixed(0)}</div>
                <div className={monthlyStats.net >= 0 ? "trend" : "status-negative"}>
                  {monthlyStats.net >= 0 ? "On track" : "Drawdown risk"}
                </div>
              </div>
              <div className="stat-card">
                <span className="label">Monthly inflow</span>
                <div className="value">${monthlyStats.income.toFixed(0)}</div>
                <div className="trend">Savings rate {monthlyStats.savingsRate}%</div>
              </div>
              <div className="stat-card">
                <span className="label">30-day spend</span>
                <div className="value">${monthlyStats.spend.toFixed(0)}</div>
                <div className="trend">{monthlyStats.runway} mo runway</div>
              </div>
              <div className="stat-card">
                <span className="label">Budgets in play</span>
                <div className="value">{budgetsThisMonth.length}</div>
                <div className="trend">Covering {Object.keys(spendByCategory).length} cats</div>
              </div>
            </div>
          </div>

          <div className="card pad">
            <div className="title">
              <span>Transactions cockpit</span>
              <div className="title-actions">
                <AiInlineButton label="AI digest" onClick={launchTransactionsAI} />
                <div className="segment">
                  {(["all", "income", "expense"] as FilterView[]).map((filter) => (
                    <button
                      key={filter}
                      className={view === filter ? "active" : ""}
                      onClick={() => setView(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <input
                className="input"
                placeholder="Search description or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th style={{ textAlign: "right" }}>Amount</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
                </thead>
                <tbody>
                  {filteredTxns.slice(0, 8).map((txn) => (
                    <tr key={txn.id}>
                      <td style={{ color: "#94a3b8" }}>{txn.date}</td>
                      <td>{txn.description}</td>
                      <td>{txn.category}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={txn.amount >= 0 ? "status-positive" : "status-negative"}>
                          {txn.amount >= 0 ? "+" : "-"}${Math.abs(txn.amount).toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="ghost"
                          onClick={() => deleteTxn(txn.id)}
                          style={{ fontSize: 12, padding: "4px 8px" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredTxns.length && (
                    <tr>
                      <td colSpan={5} style={{ color: "#94a3b8" }}>
                        No transactions yet. Add one below to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="composer" style={{ flexWrap: "wrap", marginTop: 20 }}>
              <input
                className="input"
                placeholder="Description"
                value={txnForm.description}
                onChange={(event) =>
                  setTxnForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <input
                className="input"
                type="date"
                value={txnForm.date}
                onChange={(event) => setTxnForm((prev) => ({ ...prev, date: event.target.value }))}
              />
              <input
                className="input"
                placeholder="Category"
                value={txnForm.category}
                onChange={(event) =>
                  setTxnForm((prev) => ({ ...prev, category: event.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Amount (+/-)"
                value={txnForm.amount}
                onChange={(event) =>
                  setTxnForm((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
              <button className="btn" onClick={addTransaction}>
                Log transaction
              </button>
            </div>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">
              <span>
                Budgets & category breakdown <strong>{currentMonth}</strong>
              </span>
              <AiInlineButton label="AI check" onClick={launchBudgetsAI} />
            </div>
            {budgetsThisMonth.length ? (
              <div className="timeline-grid">
                {budgetsThisMonth.map((budget) => {
                  const actual = spendByCategory[budget.category] || 0;
                  const pct = Math.min(150, Math.round((actual / Math.max(1, budget.limit)) * 100));
                  return (
                    <div key={budget.id} className="timeline-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                          <strong>{budget.category}</strong>
                          <p className="muted tiny">${actual.toFixed(0)} of ${budget.limit.toFixed(0)}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className={pct >= 100 ? "status-negative" : "status-positive"}>
                            {pct}% used
                          </span>
                          <button
                            className="ghost"
                            onClick={() => deleteBudget(budget.id)}
                            style={{ fontSize: 12, padding: "4px 8px" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="progress-track" style={{ width: "100%", marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No budgets yet for {currentMonth}.</p>
            )}
            <div className="composer" style={{ flexWrap: "wrap", marginTop: 16 }}>
              <input
                className="input"
                placeholder="Category"
                value={budgetCategory}
                onChange={(event) => setBudgetCategory(event.target.value)}
              />
              <input
                className="input"
                placeholder="Limit"
                value={budgetLimit}
                onChange={(event) => setBudgetLimit(event.target.value)}
              />
              <button className="ghost" onClick={addBudgetRow}>
                Add budget
              </button>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Income vs spend trend</div>
            <svg viewBox="0 0 640 220" style={{ width: "100%", height: 220 }}>
              {incomeVsSpend.map((row, index) => {
                const x = 40 + (index * 520) / Math.max(1, incomeVsSpend.length - 1);
                const incomeHeight = (row.income / chartMax) * 150;
                const spendHeight = (row.spend / chartMax) * 150;
                return (
                  <g key={row.month}>
                    <rect
                      x={x - 20}
                      y={190 - incomeHeight}
                      width={18}
                      height={incomeHeight}
                      rx={4}
                      fill="#10b981"
                    />
                    <rect
                      x={x + 4}
                      y={190 - spendHeight}
                      width={18}
                      height={spendHeight}
                      rx={4}
                      fill="#f87171"
                    />
                    <text x={x} y={210} textAnchor="middle" className="muted tiny">
                      {row.month}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="muted tiny">
              Showing the last {incomeVsSpend.length || 0} months of inflows vs outflows.
            </p>
          </div>

          <div className="card pad">
            <div className="title">
              <span>Category hotspots</span>
              <AiInlineButton label="AI pulse" onClick={launchCategoriesAI} />
            </div>
            {topCategories.length ? (
              <ul className="list-clean">
                {topCategories.map(([category, amount]) => (
                  <li key={category}>
                    <strong>{category}</strong>
                    <p className="muted tiny">
                      ${Number(amount).toFixed(0)} ·{" "}
                      {((Number(amount) / Math.max(1, monthlyStats.spend)) * 100).toFixed(1)}% of spend
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No spending recorded yet this month.</p>
            )}
          </div>
        </div>
      </div>
      {aiModal && (
        <div className="ai-modal-overlay" role="dialog" aria-modal="true">
          <div className="ai-modal">
            <div className="ai-modal__header">
              <div>
                <p className="muted tiny">AI quick brief</p>
                <strong>{aiModal.title}</strong>
              </div>
              <button className="ghost" onClick={closeAiModal} aria-label="Close AI analysis">
                Close
              </button>
            </div>
            <div className="ai-modal__body">
              {aiModalError ? (
                <p className="status-negative">{aiModalError}</p>
              ) : (
                <p className="muted" style={{ whiteSpace: "pre-line" }}>
                  {aiModalAnswer}
                </p>
              )}
            </div>
            <div className="ai-modal__footer">
              <button
                className="btn"
                onClick={() => {
                  if (aiModal) runAiModal(aiModal);
                }}
                disabled={aiModalLoading}
              >
                {aiModalLoading ? "Analyzing…" : "Refresh insight"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
