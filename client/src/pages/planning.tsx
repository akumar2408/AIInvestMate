import React, { useMemo, useState } from "react";
import { useStore, monthKey } from "../state/store";

type Metric = "save" | "inc" | "exp";

export function GoalsPlanningPage() {
  const { state, addGoal, updateGoal, deleteGoal } = useStore();
  const [name, setName] = useState("Emergency fund");
  const [target, setTarget] = useState("5000");
  const [deadline, setDeadline] = useState("");
  const [focusGoal, setFocusGoal] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("save");

  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => {
      const pctA = a.target ? a.current / a.target : 0;
      const pctB = b.target ? b.current / b.target : 0;
      return pctB - pctA;
    });
  }, [state.goals]);

  const heroGoal = useMemo(() => {
    if (focusGoal) {
      return state.goals.find((goal) => goal.id === focusGoal) || sortedGoals[0];
    }
    return sortedGoals[0];
  }, [focusGoal, sortedGoals, state.goals]);

  const months = useMemo(
    () => Array.from(new Set(state.txns.map((txn) => monthKey(txn.date)))).sort().slice(-8),
    [state.txns]
  );

  const trendData = useMemo(() => {
    return months.map((month) => {
      const txns = state.txns.filter((txn) => monthKey(txn.date) === month);
      const income = txns
        .filter((txn) => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);
      const spend = Math.abs(
        txns.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0)
      );
      return { month, inc: income, exp: spend, save: Math.max(0, income - spend) };
    });
  }, [months, state.txns]);

  const totals = trendData.reduce(
    (acc, row) => {
      acc.inc += row.inc;
      acc.exp += row.exp;
      acc.save += row.save;
      return acc;
    },
    { inc: 0, exp: 0, save: 0 }
  );

  const bestMonth = trendData.reduce((best, row) => {
    if (!best) return row;
    return row.save > best.save ? row : best;
  }, trendData[0]);

  const chartMax = Math.max(1, ...trendData.map((row) => row[metric]));

  const milestones = sortedGoals.slice(0, 3).map((goal) => {
    const pct = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
    return { goal, pct };
  });

  const planIdeas = [
    { title: "Debt payoff ladder", detail: "List balances + APR, snowball highest APR first." },
    { title: "Emergency fund", detail: "3-6 months of expenses. You're at " + (heroGoal ? `${Math.round(Math.min(100, (heroGoal.current / heroGoal.target) * 100))}%` : "0%") },
    { title: "Investing autopilot", detail: "Automate transfers after bills to hit each goal." },
  ];

  const add = () => {
    const amount = Number(target || 0);
    addGoal({ name, target: amount, current: 0, deadline: deadline || undefined });
    setName("New goal");
    setTarget("1000");
    setDeadline("");
  };

  const adjustGoal = (goalId: string, delta: number) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { current: Math.max(0, goal.current + delta) });
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Goals & planning hub</div>
            <p className="subtle">
              Track every savings goal, debt payoff, and emergency fund from a single cockpit.
            </p>
            <div className="composer" style={{ flexWrap: "wrap", marginTop: 16 }}>
              <input
                className="input"
                placeholder="Goal name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                className="input"
                placeholder="Target amount"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              />
              <input
                className="input"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
              <button className="btn" onClick={add}>
                Add goal
              </button>
            </div>
            {heroGoal ? (
              <div style={{ marginTop: 20 }}>
                <p className="eyebrow">Focus goal</p>
                <h2 style={{ margin: "10px 0 0" }}>{heroGoal.name}</h2>
                <p className="muted tiny">
                  ${heroGoal.current.toFixed(0)} of ${heroGoal.target.toFixed(0)} saved
                </p>
                <div className="progress-track" style={{ marginTop: 12 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (heroGoal.current / Math.max(1, heroGoal.target)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="pill-row" style={{ marginTop: 12 }}>
                  {[100, 250, 500].map((step) => (
                    <button key={step} onClick={() => adjustGoal(heroGoal.id, step)} className="chip">
                      +${step}
                    </button>
                  ))}
                  <button onClick={() => updateGoal(heroGoal.id, { current: 0 })} className="ghost">
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 20 }}>
                Add your first goal to start tracking progress.
              </p>
            )}
          </div>

          <div className="card pad">
            <div className="title">
              Goals board <strong>{state.goals.length} tracked</strong>
            </div>
            {state.goals.length ? (
              <div className="goal-grid">
                {sortedGoals.map((goal) => {
                  const pct = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                  return (
                    <div
                      key={goal.id}
                      className="goal-card"
                      onClick={() => setFocusGoal(goal.id)}
                    >
                      <button
                        className="ghost"
                        style={{ position: "absolute", top: 10, right: 12, fontSize: 12, padding: "4px 8px" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteGoal(goal.id);
                          if (focusGoal === goal.id) setFocusGoal(null);
                        }}
                      >
                        Remove
                      </button>
                      <h4>{goal.name}</h4>
                      <small>
                        ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}
                      </small>
                      <div className="progress-track" style={{ marginTop: 12 }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="muted tiny" style={{ marginTop: 8 }}>
                        {pct}% complete {goal.deadline ? `· due ${goal.deadline}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No goals yet.</p>
            )}
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">
              Progress reports
              <div className="segment" style={{ marginLeft: "auto" }}>
                {(["save", "inc", "exp"] as Metric[]).map((key) => (
                  <button key={key} className={metric === key ? "active" : ""} onClick={() => setMetric(key)}>
                    {key === "save" ? "Savings" : key === "inc" ? "Income" : "Spending"}
                  </button>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 760 260" style={{ width: "100%", height: 260 }}>
              <polyline
                fill="none"
                stroke={metric === "exp" ? "#fb7185" : metric === "inc" ? "#22d3ee" : "#34d399"}
                strokeWidth={3}
                points={trendData
                  .map((row, index) => {
                    const x = 40 + (index * 640) / Math.max(1, trendData.length - 1);
                    const y = 220 - (row[metric] / chartMax) * 160;
                    return `${x},${Math.max(40, y)}`;
                  })
                  .join(" ")}
              />
              {trendData.map((row, index) => {
                const x = 40 + (index * 640) / Math.max(1, trendData.length - 1);
                const y = 220 - (row[metric] / chartMax) * 160;
                return (
                  <g key={row.month}>
                    <circle cx={x} cy={Math.max(40, y)} r={4} fill="#f8fafc" />
                    <text x={x} y={240} textAnchor="middle" className="muted tiny">
                      {row.month}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="grid-kpi">
              <div className="stat-card">
                <span className="label">Total income</span>
                <div className="value">${totals.inc.toFixed(0)}</div>
                <div className="trend">Avg ${(totals.inc / Math.max(1, trendData.length)).toFixed(0)} / mo</div>
              </div>
              <div className="stat-card">
                <span className="label">Total spend</span>
                <div className="value">${totals.exp.toFixed(0)}</div>
                <div className="trend">{Math.round((totals.exp / Math.max(1, totals.inc)) * 100)}% of inflow</div>
              </div>
              <div className="stat-card">
                <span className="label">Savings captured</span>
                <div className="value">${totals.save.toFixed(0)}</div>
                <div className="trend">Best month {bestMonth?.month || "—"}</div>
              </div>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Goal milestones</div>
            {milestones.length ? (
              <div className="timeline-grid">
                {milestones.map(({ goal, pct }) => (
                  <div key={goal.id} className="timeline-row">
                    <div>
                      <strong>{goal.name}</strong>
                      <p className="muted tiny">{pct}% complete</p>
                    </div>
                    <span>${goal.target.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No milestones yet.</p>
            )}
          </div>

          <div className="card pad">
            <div className="title">Planning playbooks</div>
            <ul className="list-clean">
              {planIdeas.map((idea) => (
                <li key={idea.title}>
                  <strong>{idea.title}</strong>
                  <p className="muted tiny">{idea.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
