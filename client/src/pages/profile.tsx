import React from "react";
import { useStore } from "../state/store";

import { SyncPanel } from "../components/SyncPanel";

export function ProfilePage() {
  const { exportAll } = useStore();
  return (
    <section style={{marginTop:12}}>
      <div className="card pad">
        <div className="title">Data export</div>
        <button className="btn" onClick={()=>{
          const blob = new Blob([exportAll()], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "investmate-data.json"; a.click();
          URL.revokeObjectURL(url);
        }}>Download JSON</button>
      </div>
      <div id="auth-slot"></div>
          <SyncPanel />
    </section>
  );
}