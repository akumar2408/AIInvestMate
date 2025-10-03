import React, { useState } from "react";
import { useStore } from "../state/store";

export function SyncPanel() {
  const { state } = useStore();
  const [userId, setUserId] = useState(state.userId || "");
  const [msg, setMsg] = useState("");

  async function pull() {
    setMsg("Pulling...");
    const r = await fetch(`/api/sync/pull?userId=${encodeURIComponent(userId)}`);
    const data = await r.json();
    if (data.txns) {
      localStorage.setItem("aimate_state_v1", JSON.stringify({ ...state, ...data }));
      setMsg("Imported from cloud. Refresh to see changes.");
    } else {
      setMsg("Nothing found (or demo mode).");
    }
  }

  async function push() {
    setMsg("Pushing...");
    const r = await fetch("/api/sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, txns: state.txns, budgets: state.budgets, goals: state.goals }),
    });
    const data = await r.json();
    setMsg(data.ok ? "Synced to cloud." : "Push failed.");
  }

  return (
    <div className="card pad" style={{marginTop:14}}>
      <div className="title">Cloud sync (Supabase + Drizzle)</div>
      <div className="composer">
        <input className="input" placeholder="User ID (demo)" value={userId} onChange={e=>setUserId(e.target.value)} />
        <button className="ghost" onClick={pull}>Import from cloud</button>
        <button className="btn" onClick={push}>Sync now</button>
      </div>
      <div className="muted" style={{marginTop:8}}>{msg || "Tip: Use your auth user id when Supabase is configured."}</div>
    </div>
  );
}