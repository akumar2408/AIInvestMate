import React, { useState } from "react";
import { useStore } from "../state/store";

export function SyncPanel() {
  const { state, refreshFromCloud, syncStatus, lastSyncedAt } = useStore();
  const [userId, setUserId] = useState(state.userId || "");
  const [msg, setMsg] = useState("");

  async function pull() {
    if (!userId) {
      setMsg("User ID required");
      return;
    }
    setMsg("Pulling...");
    await refreshFromCloud(userId);
    setMsg("Pulled latest snapshot");
  }

  async function push() {
    setMsg("Pushing...");
    const r = await fetch("/api/sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        txns: state.txns,
        budgets: state.budgets,
        goals: state.goals,
        profile: state.profile,
        aiLogs: state.aiLogs,
      }),
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
      <div className="muted" style={{marginTop:8}}>
        {msg || `Status: ${syncStatus} · Last synced ${lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "never"}`}
      </div>
    </div>
  );
}