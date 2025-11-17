import React, { useState } from "react";
import { useStore } from "../state/store";
import { SyncPanel } from "../components/SyncPanel";

export function ProfilePage() {
  const { exportAll } = useStore();
  const [preferences, setPreferences] = useState({
    weeklyDigest: true,
    autopilot: false,
    advisorShare: true,
  });
  const connections = [
    { name: "Plaid sandbox", status: "Synced", last: "2m ago" },
    { name: "Brokerage", status: "Sync pending", last: "1h ago" },
  ];

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const download = () => {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investmate-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Data export</div>
            <p className="subtle">Own your data. Download everything as JSON anytime.</p>
            <button className="btn" onClick={download} style={{ marginTop: 16 }}>
              Download JSON
            </button>
          </div>

          <div className="card pad">
            <div className="title">Preferences</div>
            <div className="toggle-row">
              <div>
                <label>Weekly digest</label>
                <p>Send me a Monday morning roundup.</p>
              </div>
              <button className={`switch ${preferences.weeklyDigest ? "on" : ""}`} onClick={() => togglePref("weeklyDigest")} />
            </div>
            <div className="toggle-row">
              <div>
                <label>Autopilot sync</label>
                <p>Allow AI to reconcile accounts nightly.</p>
              </div>
              <button className={`switch ${preferences.autopilot ? "on" : ""}`} onClick={() => togglePref("autopilot")} />
            </div>
            <div className="toggle-row">
              <div>
                <label>Advisor sharing</label>
                <p>Share recap with your advisor workspace.</p>
              </div>
              <button className={`switch ${preferences.advisorShare ? "on" : ""}`} onClick={() => togglePref("advisorShare")} />
            </div>
          </div>
        </div>

        <div className="page-stack">
          <div className="card pad">
            <div className="title">Connected accounts</div>
            <div className="profile-grid">
              {connections.map((c) => (
                <div key={c.name} className="goal-card" style={{ cursor: "default" }}>
                  <h4>{c.name}</h4>
                  <p className="muted tiny">{c.status}</p>
                  <div className="mini-chart" style={{ marginTop: 12 }}></div>
                  <p className="muted tiny">Last sync {c.last}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Sync + security</div>
            <SyncPanel />
          </div>
        </div>
      </div>
    </section>
  );
}