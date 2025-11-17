import React, { useMemo, useState } from "react";

function fv(monthly: number, rateAnnual: number, years: number) {
  const r = rateAnnual / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

const scenarios = [
  { label: "Steady", monthly: "300", apy: "7", years: "5", goal: "10000" },
  { label: "Aggressive", monthly: "600", apy: "8", years: "7", goal: "25000" },
  { label: "Income boost", monthly: "900", apy: "10", years: "10", goal: "60000" },
];

export function SimulatorPage() {
  const [monthly, setMonthly] = useState("300");
  const [apy, setApy] = useState("7");
  const [years, setYears] = useState("5");
  const [goal, setGoal] = useState("10000");

  const result = useMemo(() => {
    const m = Number(monthly || 0);
    const a = Number(apy || 0) / 100;
    const y = Number(years || 0);
    const fvVal = fv(m, a, y);
    const monthsToGoal = (() => {
      if (!m) return Infinity;
      const r = a / 12;
      let total = 0;
      for (let i = 1; i <= 600; i++) {
        total = total * (1 + r) + m;
        if (total >= Number(goal || 0)) return i;
      }
      return Infinity;
    })();
    return { fvVal, monthsToGoal };
  }, [monthly, apy, years, goal]);

  const monthsResolved = result.monthsToGoal === Infinity ? 0 : result.monthsToGoal;
  const milestones = [0.25, 0.5, 0.75].map((pct) => {
    const value = Number(goal || 0) * pct;
    const months = Math.round(monthsResolved * pct);
    return { pct: pct * 100, value, months };
  });

  const applyScenario = (preset: typeof scenarios[number]) => {
    setMonthly(preset.monthly);
    setApy(preset.apy);
    setYears(preset.years);
    setGoal(preset.goal);
  };

  const yearsCount = Number(years || 0);

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">What‑if simulator</div>
            <div className="composer" style={{ flexWrap: "wrap" }}>
              <input className="input" placeholder="Monthly contribution" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
              <input className="input" placeholder="Expected APY (%)" value={apy} onChange={(e) => setApy(e.target.value)} />
              <input className="input" placeholder="Years" value={years} onChange={(e) => setYears(e.target.value)} />
              <input className="input" placeholder="Goal amount" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div className="scenario-grid">
              {scenarios.map((preset) => (
                <div
                  key={preset.label}
                  className={`scenario-card ${monthly === preset.monthly && apy === preset.apy && years === preset.years && goal === preset.goal ? "active" : ""}`}
                  onClick={() => applyScenario(preset)}
                >
                  <strong>{preset.label}</strong>
                  <p className="muted tiny" style={{ marginTop: 6 }}>
                    ${preset.monthly}/mo · {preset.apy}% APY · {preset.years}y horizon
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }} className="muted">
              Future value: <b>${result.fvVal.toFixed(0)}</b> | ETA to goal: <b>{monthsResolved ? `${Math.ceil(monthsResolved / 12)} years` : "unreached in 50y"}</b>
            </div>
            <svg viewBox="0 0 800 260" style={{ width: "100%", height: 240, marginTop: 12 }}>
              {Array.from({ length: 12 * Math.max(1, yearsCount) }).map((_, i) => {
                const r = Number(apy || 0) / 100 / 12;
                const m = Number(monthly || 0);
                let total = 0;
                for (let k = 0; k <= i; k++) {
                  total = total * (1 + r) + m;
                }
                const x = 40 + (i * (720 / Math.max(1, 12 * Math.max(1, yearsCount) - 1)));
                const y = 220 - (total / Math.max(1, Number(goal || 10000))) * 180;
                return <circle key={i} cx={x} cy={Math.max(40, Math.min(220, y))} r={2} fill="#6ee7b7" />;
              })}
            </svg>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">Milestones</div>
            <div className="timeline-grid">
              {milestones.map((m) => (
                <div key={m.pct} className="timeline-row">
                  <div>
                    <strong>{m.pct}% funded</strong>
                    <p className="muted tiny">${m.value.toFixed(0)}</p>
                  </div>
                  <span>{m.months ? `${Math.ceil(m.months / 12)}y` : "--"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Insights</div>
            <ul className="list-clean">
              <li>
                <strong>Contribution delta</strong>
                <p className="muted tiny">+$100/mo shortens horizon by ~{monthsResolved ? Math.max(1, Math.ceil(monthsResolved / 18)) : 0} months</p>
              </li>
              <li>
                <strong>Return sensitivity</strong>
                <p className="muted tiny">+1% APY yields ${((Number(goal || 0) * 0.12) / 1.5).toFixed(0)} more over the plan</p>
              </li>
              <li>
                <strong>Goal coverage</strong>
                <p className="muted tiny">Projected FV covers {Math.round((result.fvVal / Math.max(1, Number(goal || 1))) * 100)}% of goal</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
