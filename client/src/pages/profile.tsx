import React, { useState } from "react";
import { useStore } from "../state/store";
import { SyncPanel } from "../components/SyncPanel";
import { AuthPanel } from "../components/AuthPanel";
import { toCSV } from "../lib/utils";
import { requestWizardOpen } from "../lib/wizardSignals";

export function ProfilePage() {
  const { state, exportAll } = useStore();
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

  const exportBudgets = () => {
    const csv = toCSV(state.budgets);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budgets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTransactions = () => {
    const csv = toCSV(state.txns);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportChatLogs = () => {
    const blob = new Blob([JSON.stringify(state.aiLogs || [], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-chat-log.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const profileStats = [
    { label: "Goals tracked", value: state.goals.length },
    { label: "Budgets", value: state.budgets.length },
    { label: "AI chats", value: state.aiLogs?.length || 0 },
    { label: "Data exports", value: "Anytime" },
  ];

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">Account overview</div>
            <div className="profile-grid">
              {profileStats.map((stat) => (
                <div key={stat.label} className="goal-card" style={{ cursor: "default" }}>
                  <h4>{stat.value}</h4>
                  <p className="muted tiny">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="pill-row" style={{ marginTop: 16 }}>
              <span className="pill">Plan: {state.profile ? "Personalized" : "Starter"}</span>
              <span className="pill">User ID: {state.userId || "local"}</span>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Data export</div>
            <p className="subtle">Own your data. Download everything anytime.</p>
            <div className="export-grid">
              <button className="btn" onClick={download}>Export full JSON</button>
              <button className="ghost" onClick={exportTransactions}>Transactions CSV</button>
              <button className="ghost" onClick={exportBudgets}>Budgets CSV</button>
              <button className="ghost" onClick={exportChatLogs}>AI chat log</button>
            </div>
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
            <div className="title">
              Profile
              <button className="link-btn" onClick={requestWizardOpen}>
                Edit personalization
              </button>
            </div>
            {state.profile ? (
              <ul className="list-clean">
                <li>
                  <strong>Income range</strong>
                  <p className="muted tiny">{state.profile.incomeRange}</p>
                </li>
                <li>
                  <strong>Primary goal</strong>
                  <p className="muted tiny">{state.profile.goalFocus}</p>
                </li>
                <li>
                  <strong>Risk comfort</strong>
                  <p className="muted tiny">{state.profile.riskComfort}</p>
                </li>
                <li>
                  <strong>Experience</strong>
                  <p className="muted tiny">{state.profile.experience}</p>
                </li>
              </ul>
            ) : (
              <p className="muted">Complete onboarding to personalize your AI copilot.</p>
            )}
          </div>
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
            <AuthPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
