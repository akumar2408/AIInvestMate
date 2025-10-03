
import React, { useMemo, useState } from "react";

function fv(monthly: number, rateAnnual: number, years: number) {
  const r = rateAnnual/12;
  const n = years*12;
  // Future value of annuity due (end of period) monthly contribution
  return monthly * ((Math.pow(1+r, n)-1)/r);
}

export function SimulatorPage() {
  const [monthly, setMonthly] = useState("300");
  const [apy, setApy] = useState("7");
  const [years, setYears] = useState("5");
  const [goal, setGoal] = useState("10000");

  const result = useMemo(()=>{
    const m = Number(monthly||0);
    const a = Number(apy||0)/100;
    const y = Number(years||0);
    const fvVal = fv(m, a, y);
    const monthsToGoal = (()=>{
      if (!m) return Infinity;
      const r = a/12;
      let total = 0;
      for (let i=1;i<=600;i++) {
        total = total*(1+r)+m;
        if (total >= Number(goal||0)) return i;
      }
      return Infinity;
    })();
    return { fvVal, monthsToGoal };
  }, [monthly, apy, years, goal]);

  return (
    <section style={{marginTop:12}}>
      <div className="card pad">
        <div className="title">What‑if simulator</div>
        <div className="composer">
          <input className="input" placeholder="Monthly contribution" value={monthly} onChange={e=>setMonthly(e.target.value)} />
          <input className="input" placeholder="Expected APY (%)" value={apy} onChange={e=>setApy(e.target.value)} />
          <input className="input" placeholder="Years" value={years} onChange={e=>setYears(e.target.value)} />
          <input className="input" placeholder="Goal amount" value={goal} onChange={e=>setGoal(e.target.value)} />
        </div>
        <div style={{marginTop:10}} className="muted">
          Future value: <b>${{...result}.fvVal.toFixed ? result.fvVal.toFixed(0) : result.fvVal}</b>
          {" "} | ETA to goal: <b>{result.monthsToGoal===Infinity ? "unreached in 50y" : Math.ceil(result.monthsToGoal/12)+" years"}</b>
        </div>
        <svg viewBox="0 0 800 260" style={{width:'100%', height:240, background:'#0b1324', border:'1px solid #26334a', borderRadius:12, marginTop:12}}>
          {Array.from({length:12*Number(years||0)}).map((_,i)=>{
            const r = Number(apy||0)/100/12;
            const m = Number(monthly||0);
            // grow series
            let total = 0;
            for (let k=0;k<=i;k++){ total = total*(1+r)+m; }
            const x = 40 + (i*(720/Math.max(1,(12*Number(years||0))-1)));
            const y = 220 - (total/Number(goal||10000))*180;
            return <circle key={i} cx={x} cy={Math.max(40, Math.min(220,y))} r="2" fill="#6ee7b7" />;
          })}
        </svg>
      </div>
    </section>
  );
}
