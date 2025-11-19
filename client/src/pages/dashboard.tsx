import React, { useMemo } from "react";
import { useStore, monthKey, detectAnomalies } from "../state/store";
import { useQuote } from "@/hooks/useQuote";

const DEFAULT_WATCHLIST = ["SPY", "QQQ", "VOO", "AAPL"];

export function Dashboard() {
  const { state } = useStore();
  const watchlist = state.marketWatchlist && state.marketWatchlist.length ? state.marketWatchlist : DEFAULT_WATCHLIST;
  const visibleWatch = watchlist.slice(0, 4);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const txnsThisMonth = state.txns.filter((txn) => monthKey(txn.date) === thisMonth);
  const income = txnsThisMonth.filter((txn) => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0);
  const spend = Math.abs(
    txnsThisMonth.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0)
  );
  const savings = Math.max(0, income - spend);
  const savingsRate = income ? Math.round((savings / income) * 100) : 0;
  const runwayMonths = spend ? Math.max(1, Math.round((state.cash || 12000) / spend)) : 12;
  const netWorth = (state.cash || 18000) + state.goals.reduce((total, goal) => total + goal.current, 0);

  const budgetsByCat = useMemo(() => {
    return txnsThisMonth
      .filter((txn) => txn.amount < 0)
      .reduce<Record<string, number>>((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + Math.abs(txn.amount);
        return acc;
      }, {});
  }, [txnsThisMonth]);

  const currentMonthBudgets = state.budgets.filter((budget) => budget.month === thisMonth);
  const budgetsAtRisk = currentMonthBudgets
    .map((budget) => {
      const actual = budgetsByCat[budget.category] || 0;
      const pct = Math.min(200, Math.round((actual / Math.max(1, budget.limit)) * 100));
      return { ...budget, actual, pct };
    })
    .filter((budget) => budget.pct >= 80);

  const latestTxns = state.txns.slice(-6).reverse();
  const anomalies = detectAnomalies(state.txns).slice(0, 2);

  const aiBriefing = [
    {
      title: "Cashflow",
      detail:
        savings > 0
          ? `Net +$${savings.toFixed(0)} this month · savings rate ${savingsRate}%`
          : `Running -$${Math.abs(savings).toFixed(0)} this month`,
    },
    {
      title: "Budgets",
      detail: budgetsAtRisk.length
        ? `${budgetsAtRisk.length} categories need attention`
        : "No budgets at risk this month",
    },
    {
      title: "Goals",
      detail: state.goals.length
        ? `${Math.round(
            Math.min(
              100,
              (state.goals.reduce((sum, goal) => sum + goal.current, 0) /
                Math.max(1, state.goals.reduce((sum, goal) => sum + goal.target, 0))) *
                100
            )
          )}% of goal funding captured`
        : "Create a goal to start tracking progress",
    },
    {
      title: "Markets",
      detail: visibleWatch.map((symbol) => symbol).join(" · "),
    },
  ];

  const shortcuts = [
    { label: "Go to Markets", target: "#markets" },
    { label: "Go to Simulator", target: "#markets?panel=sim" },
    { label: "Open AI Hub", target: "#ai" },
  ];

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-grid two">
        <div className="card pad">
          <div className="title">Net worth & cashflow snapshot</div>
          <p className="subtle">
            Quick glance at runway, inflows, and spending momentum for {thisMonth}.
          </p>
          <div className="stat-grid" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <span className="label">Net worth</span>
              <div className="value">${netWorth.toFixed(0)}</div>
              <div className="trend">{state.goals.length} goals contributing</div>
            </div>
            <div className="stat-card">
              <span className="label">Monthly inflow</span>
              <div className="value">${income.toFixed(0)}</div>
              <div className="trend">Savings rate {savingsRate}%</div>
            </div>
            <div className="stat-card">
              <span className="label">30-day spend</span>
              <div className="value">${spend.toFixed(0)}</div>
              <div className={savings >= 0 ? "trend" : "status-negative"}>
                {savings >= 0 ? "On budget" : "Over budget"}
              </div>
            </div>
            <div className="stat-card">
              <span className="label">Runway</span>
              <div className="value">{runwayMonths} months</div>
              <div className="trend">{state.txns.length} transactions tracked</div>
            </div>
          </div>
        </div>

        <div className="card pad">
          <div className="title">AI daily briefing</div>
          <ul className="list-clean">
            {aiBriefing.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p className="muted tiny">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="page-grid two" style={{ marginTop: 22 }}>
        <div className="card pad">
          <div className="title">MarketPulse mini desk</div>
          {visibleWatch.length ? (
            <div className="market-grid">
              {visibleWatch.map((symbol) => (
                <CompactWatchCard key={symbol} symbol={symbol} />
              ))}
            </div>
          ) : (
            <p className="muted">No tickers selected yet. Add some from the Markets tab.</p>
          )}
        </div>

        <div className="card pad">
          <div className="title">Shortcuts</div>
          <p className="subtle">Jump directly into deeper tools.</p>
          <div className="pill-row" style={{ marginTop: 16 }}>
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                className="chip"
                onClick={() => {
                  window.location.hash = shortcut.target;
                }}
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-grid two" style={{ marginTop: 22 }}>
        <div className="card pad">
          <div className="title">Latest activity</div>
          <ul className="feed">
            {latestTxns.length ? (
              latestTxns.map((txn) => (
                <li key={txn.id}>
                  <strong>{txn.description}</strong>
                  <span className="muted tiny">
                    {txn.category} · {txn.date}
                  </span>
                  <span className={txn.amount < 0 ? "status-negative" : "status-positive"}>
                    {txn.amount < 0 ? "-" : "+"}${Math.abs(txn.amount).toFixed(2)}
                  </span>
                </li>
              ))
            ) : (
              <li className="muted">No activity yet.</li>
            )}
          </ul>
        </div>

        <div className="card pad">
          <div className="title">Budget radar</div>
          {budgetsAtRisk.length ? (
            <div className="timeline-grid">
              {budgetsAtRisk.map((budget) => (
                <div key={budget.id} className="timeline-row">
                  <div>
                    <strong>{budget.category}</strong>
                    <p className="muted tiny">
                      ${budget.actual.toFixed(0)} of ${budget.limit.toFixed(0)}
                    </p>
                  </div>
                  <span className={budget.pct >= 100 ? "status-negative" : "status-positive"}>
                    {budget.pct}% used
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">All budgets are within target.</p>
          )}
        </div>
      </div>

      <div className="page-grid two" style={{ marginTop: 22 }}>
        <div className="card pad">
          <div className="title">AI anomalies</div>
          {anomalies.length ? (
            anomalies.map((anomaly, index) => (
              <div key={index} className="callout-strong" style={{ marginBottom: 12 }}>
                <strong>{anomaly.month}</strong>
                <p className="muted tiny" style={{ marginTop: 6 }}>
                  Spend ${anomaly.current.toFixed(0)} vs avg ${anomaly.avgPrev.toFixed(0)} · Δ $
                  {anomaly.diff.toFixed(0)}
                </p>
              </div>
            ))
          ) : (
            <p className="muted">No anomalies detected.</p>
          )}
        </div>

        <div className="card pad">
          <div className="title">Planning momentum</div>
          <p className="subtle">
            {state.goals.length
              ? `${state.goals.length} goals and ${state.budgets.length} budgets synced`
              : "Add a goal or budget to unlock personalized planning."}
          </p>
          <div className="pill-row" style={{ marginTop: 14 }}>
            {["Review cashflow", "Add goal", "Ask AI for a recap"].map((pill) => (
              <span key={pill} className="pill">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompactWatchCard({ symbol }: { symbol: string }) {
  const { data, loading, error } = useQuote(symbol);
  const price = data ? `$${data.price.toFixed(2)}` : loading ? "Loading…" : error ? "Offline" : "—";
  const rawChange = data?.change ?? 0;
  const rawPct = data?.changePercent ?? 0;
  const changeLabel = data
    ? `${rawChange >= 0 ? "+" : "-"}${Math.abs(rawChange).toFixed(2)} (${rawPct >= 0 ? "+" : "-"}${Math.abs(rawPct).toFixed(2)}%)`
    : loading
    ? "Syncing"
    : error
    ? "Unavailable"
    : "Awaiting data";
  const changeClass = data ? (rawChange >= 0 ? "pos" : "neg") : "";

  return (
    <div className="market-card">
      <div className="market-symbol">
        <span>{symbol}</span>
        <span className={`market-change ${changeClass}`}>{changeLabel}</span>
      </div>
      <div className="market-price-row">
        <div>
          <p className="muted tiny">Last</p>
          <div className="market-price">{price}</div>
        </div>
      </div>
    </div>
  );
}
