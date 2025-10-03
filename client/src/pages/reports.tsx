import React from "react";
import { useStore, monthKey } from "../state/store";

function sum(arr:number[]){ return arr.reduce((a,b)=>a+b,0); }

export function ReportsPage() {
  const { state } = useStore();
  const months = Array.from(new Set(state.txns.map(t => monthKey(t.date)))).sort();
  const data = months.map(m => {
    const tx = state.txns.filter(t => monthKey(t.date)===m);
    const inc = sum(tx.filter(t=>t.amount>0).map(t=>t.amount));
    const exp = Math.abs(sum(tx.filter(t=>t.amount<0).map(t=>t.amount)));
    return { m, inc, exp, save: Math.max(0, inc-exp) };
  });

  return (
    <section style={{marginTop:12}}>
      <div className="card pad">
        <div className="title">Monthly trend</div>
        <svg viewBox="0 0 800 280" style={{width:'100%', height:260, background:'#0b1324', border:'1px solid #26334a', borderRadius:12}}>
          {data.map((d, i) => {
            const x = 60 + (i*(700/Math.max(1,data.length-1)));
            const yInc = 240 - (d.inc*0.2);
            const yExp = 240 - (d.exp*0.2);
            const ySav = 240 - (d.save*0.2);
            return (
              <g key={i}>
                <circle cx={x} cy={yInc} r="3" fill="#22c55e" />
                <circle cx={x} cy={yExp} r="3" fill="#ef4444" />
                <circle cx={x} cy={ySav} r="3" fill="#06b6d4" />
                <text x={x} y={260} fill="#94a3b8" fontSize="10" textAnchor="middle">{d.m}</text>
              </g>
            );
          })}
          <text x="20" y="30" fill="#22c55e" fontSize="12">Income</text>
          <text x="100" y="30" fill="#ef4444" fontSize="12">Spending</text>
          <text x="200" y="30" fill="#06b6d4" fontSize="12">Savings</text>
        </svg>
      </div>
    </section>
  );
}