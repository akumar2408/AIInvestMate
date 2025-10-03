import React, { useState } from "react";
import { useStore } from "../state/store";

export function GoalsPage() {
  const { state, addGoal, updateGoal } = useStore();
  const [name, setName] = useState("Emergency fund");
  const [target, setTarget] = useState("3000");
  const [deadline, setDeadline] = useState("");

  const add = () => {
    addGoal({ name, target: Number(target||0), current: 0, deadline: deadline || undefined });
    setName("New goal"); setTarget("1000"); setDeadline("");
  };

  return (
    <section style={{marginTop:12}}>
      <div className="card pad">
        <div className="title">Create a goal</div>
        <div className="composer">
          <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Target amount" value={target} onChange={e=>setTarget(e.target.value)} />
          <input className="input" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          <button className="btn" onClick={add}>Add</button>
        </div>
      </div>

      <div className="card pad" style={{marginTop:14}}>
        <div className="title">Goals</div>
        {state.goals.length ? state.goals.map(g => {
          const pct = Math.min(100, Math.round((g.current / Math.max(1,g.target)) * 100));
          return (
            <div key={g.id} style={{margin:'10px 0'}}>
              <div className="muted">{g.name}</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 120px', gap:10, alignItems:'center'}}>
                <div style={{background:'#0b1324', border:'1px solid #26334a', borderRadius:12, overflow:'hidden'}}>
                  <div style={{height:12, width:`${pct}%`, background:'#06b6d4'}} />
                </div>
                <div style={{textAlign:'right'}}>${g.current.toFixed(0)} / ${g.target.toFixed(0)}</div>
              </div>
              <div className="composer" style={{marginTop:8}}>
                <input className="input" placeholder="Add progress amount" onKeyDown={(e)=>{
                  if (e.key === "Enter") {
                    const v = Number((e.target as HTMLInputElement).value||0);
                    (e.target as HTMLInputElement).value = "";
                    updateGoal(g.id, { current: Math.max(0, g.current + v) });
                  }
                }} />
                <button className="ghost" onClick={()=>updateGoal(g.id, { current: 0 })}>Reset</button>
              </div>
            </div>
          );
        }) : <div className="muted">No goals yet.</div>}
      </div>
    </section>
  );
}