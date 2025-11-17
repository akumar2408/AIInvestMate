import React, { useEffect, useRef, useState } from "react";
import "../styles.css";
import { Dashboard } from "../pages/dashboard";
import { TransactionsPage } from "../pages/transactions";
import { BudgetsPage } from "../pages/budgets";
import { GoalsPage } from "../pages/goals";
import { ReportsPage } from "../pages/reports";
import { ProfilePage } from "../pages/profile";
import { SimulatorPage } from "../pages/simulator";
import AIChat from "../components/AIChat";
import { StoreProvider, useStore } from "../state/store";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { supabase } from "../lib/supabaseClient";

type Route = "dashboard" | "transactions" | "budgets" | "goals" | "reports" | "chat" | "sim" | "profile";

export default function App() {
  return (
    <StoreProvider>
      <ShellContent />
    </StoreProvider>
  );
}

function ShellContent() {
  const [route, setRoute] = useState<Route>("dashboard");
  const { initFromSupabase, clearCloudState } = useStore();
  const initRef = useRef(initFromSupabase);
  const clearRef = useRef(clearCloudState);

  useEffect(() => {
    initRef.current = initFromSupabase;
  }, [initFromSupabase]);

  useEffect(() => {
    clearRef.current = clearCloudState;
  }, [clearCloudState]);

  useEffect(() => {
    const onHash = () => {
      const r = (location.hash.replace("#", "") || "dashboard") as Route;
      setRoute(r);
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      if (user) {
        initRef.current(user.id);
      } else {
        clearRef.current();
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        initRef.current(session.user.id);
      } else {
        clearRef.current();
      }
    });
    return () => {
      active = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  const NavLink = ({ to, children }: { to: Route; children: React.ReactNode }) => (
    <a href={`#${to}`} className={route === to ? "active" : ""}>
      {children}
    </a>
  );

  return (
    <div className="container">
      <OnboardingWizard />
      <header className="header">
        <div className="brand">
          <div className="brand-badge">💹</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>AI InvestMate</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Personal finance, simplified</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="dashboard">Dashboard</NavLink>
          <NavLink to="transactions">Transactions</NavLink>
          <NavLink to="budgets">Budgets</NavLink>
          <NavLink to="goals">Goals</NavLink>
          <NavLink to="reports">Reports</NavLink>
          <NavLink to="chat">AI</NavLink>
          <NavLink to="sim">Simulator</NavLink>
          <NavLink to="profile">Profile</NavLink>
        </nav>
      </header>

      {route === "dashboard" && <Dashboard />}
      {route === "transactions" && <TransactionsPage />}
      {route === "budgets" && <BudgetsPage />}
      {route === "goals" && <GoalsPage />}
      {route === "reports" && <ReportsPage />}
      {route === "chat" && (
        <section style={{ marginTop: 20 }}>
          <div className="card pad">
            <AIChat />
          </div>
        </section>
      )}
      {route === "sim" && <SimulatorPage />}
      {route === "profile" && <ProfilePage />}

      <footer className="footer">© {new Date().getFullYear()} AI InvestMate</footer>
    </div>
  );
}