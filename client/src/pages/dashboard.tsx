import React from "react";
import { useStore, monthKey } from "../state/store";

export function Dashboard() {
  const { state } = useStore();
  const thisMonth = new Date().toISOString().slice(0,7);
  const txns = state.txns.filter(t => monthKey(t.date) === thisMonth);
  const income = txns.filter(t => t.amount > 0).reduce((a,b)=>a+b.amount,0);
  const spend = Math.abs(txns.filter(t => t.amount < 0).reduce((a,b)=>a+b.amount,0));
  const savings = Math.max(0, income - spend);
  const savingsRate = income ? Math.round((savings / income) * 100) : 0;

  const topCats = Object.entries(txns.reduce((acc:any,t)=>{
    if (t.amount<0) acc[t.category]=(acc[t.category]||0)+Math.abs(t.amount);
    return acc;
  },{})).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5);

  return (
    <section style={{marginTop: 12}}>
      <div className="hero">
        <div className="card pad">
          <div className="title">This month</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
            <Kpi label="Income" value={`$${income.toFixed(0)}`} />
            <Kpi label="Spending" value={`$${spend.toFixed(0)}`} />
            <Kpi label="Savings rate" value={`${savingsRate}%`} />
          </div>
        </div>
        <div className="card pad">
          <div className="title">Top 5 categories</div>
          {topCats.length ? topCats.map(([c,v])=> (
            <div key={c} style={{display:'grid', gridTemplateColumns:'120px 1fr 60px', gap:8, alignItems:'center', margin:'8px 0'}}>
              <div className="muted">{c}</div>
              <div style={{background:'#0b1324', border:'1px solid #26334a', borderRadius:12, overflow:'hidden'}}>
                <div style={{height:10, width:`${Math.min(100, v/spend*100)}%`, background:'linear-gradient(180deg,#22c55e,#16a34a)'}} />
              </div>
              <div style={{textAlign:'right'}}>${Number(v).toFixed(0)}</div>
            </div>
          )) : <div className="muted">No data yet. Add transactions!</div>}
        </div>
      </div>
    </section>
  );
}

function Kpi({label, value}:{label:string, value:string}){
  return (
    <div className="card pad" style={{background:'linear-gradient(180deg, rgba(34,197,94,.08), rgba(12,25,40,.35))'}}>
      <div className="muted">{label}</div>
      <div style={{fontWeight:800, fontSize:24}}>{value}</div>
    </div>
  );
}