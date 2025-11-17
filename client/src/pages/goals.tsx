import React, { useMemo, useState } from "react";
import { useStore } from "../state/store";

export function GoalsPage() {
  const { state, addGoal, updateGoal } = useStore();
  const [name, setName] = useState("Emergency fund");
  const [target, setTarget] = useState("3000");
  const [deadline, setDeadline] = useState("");
  const [focusGoal, setFocusGoal] = useState<string | null>(null);

  const sortedGoals = [...state.goals].sort((a, b) => {
    const pctA = a.target ? a.current / a.target : 0;
    const pctB = b.target ? b.current / b.target : 0;
    return pctB - pctA;
  });

  const heroGoal = useMemo(() => {
    if (focusGoal) return state.goals.find((g) => g.id === focusGoal) || sortedGoals[0];
    return sortedGoals[0];
  }, [focusGoal, sortedGoals, state.goals]);

  const add = () => {
    addGoal({ name, target: Number(target || 0), current: 0, deadline: deadline || undefined });
    setName("New goal");
    setTarget("1000");
    setDeadline("");
  };

  const addProgress = (goalId: string, delta: number) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { current: Math.max(0, goal.current + delta) });
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Create a goal</div>
            <div className="composer" style={{ flexWrap: "wrap" }}>
              <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input" placeholder="Target amount" value={target} onChange={(e) => setTarget(e.target.value)} />
              <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <button className="btn" onClick={add}>
                Add goal
              </button>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Goals board</div>
            {state.goals.length ? (
              <div className="goal-grid">
                {sortedGoals.map((g) => {
                  const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
                  return (
                    <div key={g.id} className="goal-card" onClick={() => setFocusGoal(g.id)}>
                      <h4>{g.name}</h4>
                      <small>
                        ${g.current.toFixed(0)} / ${g.target.toFixed(0)}
                      </small>
                      <div className="progress-track" style={{ marginTop: 10 }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="muted tiny" style={{ marginTop: 6 }}>
                        {pct}% complete {g.deadline ? `· due ${g.deadline}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="muted">No goals yet.</div>
            )}
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">Focus goal</div>
            {heroGoal ? (
              <>
                <h2 style={{ margin: "0 0 8px" }}>{heroGoal.name}</h2>
                <p className="subtle">
                  ${heroGoal.current.toFixed(0)} of ${heroGoal.target.toFixed(0)} saved
                </p>
                <div className="progress-track" style={{ margin: "18px 0" }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, (heroGoal.current / Math.max(1, heroGoal.target)) * 100)}%` }} />
                </div>
                <div className="chips-inline">
                  {[100, 250, 500].map((step) => (
                    <button key={step} onClick={() => addProgress(heroGoal.id, step)}>
                      +${step}
                    </button>
                  ))}
                  <button onClick={() => updateGoal(heroGoal.id, { current: 0 })}>Reset</button>
                </div>
              </>
            ) : (
              <p className="muted">Select or create a goal to focus.</p>
            )}
          </div>

          <div className="card pad">
            <div className="title">Milestones</div>
            <div className="timeline-grid">
              {sortedGoals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
                return (
                  <div key={g.id} className="timeline-row">
                    <div>
                      <strong>{g.name}</strong>
                      <p className="muted tiny">{pct}% complete</p>
                    </div>
                    <span>${g.target.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}