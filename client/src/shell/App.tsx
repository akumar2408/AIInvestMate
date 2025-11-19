import React, { useEffect, useRef, useState } from "react";
import "../styles.css";
import { Dashboard } from "../pages/dashboard";
import { CashflowPage } from "../pages/cashflow";
import { GoalsPlanningPage } from "../pages/planning";
import { MarketsPage } from "../pages/markets";
import { ProfilePage } from "../pages/profile";
import AIChat from "../components/AIChat";
import { StoreProvider, useStore } from "../state/store";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { supabase } from "../lib/supabase";

type Route = "dashboard" | "cashflow" | "planning" | "markets" | "ai" | "profile";
type RouteParams = Record<string, string>;

const VALID_ROUTES: Route[] = ["dashboard", "cashflow", "planning", "markets", "ai", "profile"];

export default function App() {
  return (
    <StoreProvider>
      <ShellContent />
    </StoreProvider>
  );
}

function ShellContent() {
  const [route, setRoute] = useState<Route>("dashboard");
  const [routeParams, setRouteParams] = useState<RouteParams>({});
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
      const raw = location.hash.replace("#", "") || "dashboard";
      const [path, query = ""] = raw.split("?");
      const normalized = (VALID_ROUTES.includes(path as Route) ? path : "dashboard") as Route;
      setRoute(normalized);
      if (query) {
        const params = Object.fromEntries(new URLSearchParams(query));
        setRouteParams(params);
      } else {
        setRouteParams({});
      }
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!active) return;
      const user = data.user;
      if (user) {
        initRef.current(user.id);
      } else {
        clearRef.current();
      }
    });
    const { data } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user?: { id: string } } | null) => {
        if (session?.user) {
          initRef.current(session.user.id);
        } else {
          clearRef.current();
        }
      }
    );
    return () => {
      active = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  const NavLink = ({ to, children }: { to: Route; children: React.ReactNode }) => {
    const href = `#${to}`;
    return (
      <a href={href} className={route === to ? "active" : ""}>
        {children}
      </a>
    );
  };

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
          <NavLink to="cashflow">Cashflow</NavLink>
          <NavLink to="planning">Goals &amp; Planning</NavLink>
          <NavLink to="markets">Markets 🔥</NavLink>
          <NavLink to="ai">AI Hub</NavLink>
          <NavLink to="profile">Profile</NavLink>
        </nav>
      </header>

      {route === "dashboard" && <Dashboard />}
      {route === "cashflow" && <CashflowPage />}
      {route === "planning" && <GoalsPlanningPage />}
      {route === "markets" && <MarketsPage panel={routeParams.panel} />}
      {route === "ai" && (
        <section style={{ marginTop: 20 }}>
          <div className="card pad">
            <div className="title">AI Hub</div>
            <p className="subtle">
              Ask AI anything about your finances or the markets. Use the prompts below or type your own.
            </p>
            <div className="pill-row" style={{ marginTop: 12 }}>
              {[
                "Explain my spending this month",
                "Summarize today's market",
                "Optimize my portfolio allocation",
              ].map((prompt) => (
                <span key={prompt} className="pill">
                  {prompt}
                </span>
              ))}
            </div>
          </div>
          <div className="card pad" style={{ marginTop: 22 }}>
            <AIChat />
          </div>
        </section>
      )}
      {route === "profile" && <ProfilePage />}

      <footer className="footer">© {new Date().getFullYear()} AI InvestMate</footer>
    </div>
  );
}
