import React, { useEffect, useState } from "react";
import "../styles.css";
import { Dashboard } from "../pages/dashboard";
import { TransactionsPage } from "../pages/transactions";
import { BudgetsPage } from "../pages/budgets";
import { GoalsPage } from "../pages/goals";
import { ReportsPage } from "../pages/reports";
import { ProfilePage } from "../pages/profile";
import { SimulatorPage } from "../pages/simulator";
import AIChat from "../components/AIChat";
import { StoreProvider } from "../state/store";

type Route = "dashboard" | "transactions" | "budgets" | "goals" | "reports" | "chat" | "sim" | "profile";

export default function App() {
  const [route, setRoute] = useState<Route>("dashboard");

  useEffect(() => {
    const onHash = () => {
      const r = (location.hash.replace("#","") || "dashboard") as Route;
      setRoute(r);
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const NavLink = ({ to, children }: { to: Route; children: React.ReactNode }) => (
    <a href={`#${to}`} className={route===to ? "active" : ""}>{children}</a>
  );

  return (
    <StoreProvider>
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-badge">💹</div>
            <div>
              <div style={{fontSize:18, fontWeight:800}}>AI InvestMate</div>
              <div style={{fontSize:12, color:'#94a3b8'}}>Personal finance, simplified</div>
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
        {route === "chat" && <section style={{marginTop:20}}><div className="card pad"><AIChat /></div></section>}
        {route === "sim" && <SimulatorPage />}
        {route === "profile" && <ProfilePage />}

        <footer className="footer">© {new Date().getFullYear()} AI InvestMate</footer>
      </div>
    </StoreProvider>
  );
}