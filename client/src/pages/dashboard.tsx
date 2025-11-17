import React, { useMemo } from "react";
import { useStore, monthKey, detectAnomalies } from "../state/store";
import { useStockQuote, useStockHistory } from "../hooks/useStockData";
import { StockSparkline } from "@/components/charts/Sparkline";

const MARKET_SYMBOLS = ["SPY", "QQQ", "VOO"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function Dashboard() {
  const { state } = useStore();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const txns = state.txns.filter((t) => monthKey(t.date) === thisMonth);
  const income = txns.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const spend = Math.abs(
    txns.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0)
  );
  const savings = Math.max(0, income - spend);
  const savingsRate = income ? Math.round((savings / income) * 100) : 0;
  const runwayMonths = spend ? Math.max(1, Math.round((state.cash || 12000) / spend)) : 12;
  const autopilotScore = Math.min(
    100,
    45 + state.goals.length * 6 + state.budgets.length * 4 + Math.min(20, Math.round(state.txns.length / 5))
  );

  const topCats = Object.entries(
    txns.reduce((acc: any, t) => {
      if (t.amount < 0) acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {})
  )
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  const anomalies = detectAnomalies(state.txns).slice(0, 3);
  const latestTxns = state.txns.slice(-4).reverse();

  const budgetsByCat = useMemo(() => {
    return state.txns
      .filter((t) => monthKey(t.date) === thisMonth && t.amount < 0)
      .reduce((acc: any, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
  }, [state.txns, thisMonth]);

  const budgetsAtRisk = state.budgets
    .filter((b) => b.month === thisMonth)
    .map((b) => {
      const actual = budgetsByCat[b.category] || 0;
      return { ...b, actual, pct: Math.min(150, Math.round((actual / Math.max(1, b.limit)) * 100)) };
    })
    .filter((b) => b.pct >= 70);

  const scenarioPlays = [
    {
      label: "Dial down lifestyle",
      detail: `Cut dining & shopping by 10% to free $${(spend * 0.1).toFixed(0)} / mo`,
    },
    {
      label: "Snowball savings",
      detail: `Lock $${(savings || 0).toFixed(0)} to taxable brokerage for +${(savings * 12 * 0.07).toFixed(0)} / yr`,
    },
    {
      label: "Boost runway",
      detail: `Move idle cash into HYSA · extends runway to ${runwayMonths + 2} months`,
    },
  ];

  return (
    <section style={{ marginTop: 12 }}>
      <div className="page-split">
        <div className="page-stack">
          <div className="card pad">
            <div className="title">
              Pulse snapshot <strong>Realtime synced</strong>
            </div>
            <p className="subtle">AI InvestMate keeps every account reconciled so you can plan with clarity.</p>
            <div className="stat-grid">
              <Kpi label="Income" value={`$${income.toFixed(0)}`} trend={savingsRate > 35 ? "+ healthy" : "watch"} />
              <Kpi label="Spending" value={`$${spend.toFixed(0)}`} trend={`-${Math.round((savings / Math.max(1, spend)) * 100)}% net`} />
              <Kpi label="Savings rate" value={`${savingsRate}%`} trend={`${runwayMonths} mo runway`} />
              <Kpi label="Projected savings" value={`$${(savings * 12).toFixed(0)}`} trend={"12 mo horizon"} />
            </div>
            <div className="pill-row">
              {["Ask AI what-if", "Schedule advisor", "Share snapshot"].map((pill) => (
                <span key={pill} className="pill">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="title">Autopilot</div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 160 }}>
                <div className="radial">
                  <span>{autopilotScore}%</span>
                </div>
                <p className="muted tiny" style={{ marginTop: 8 }}>
                  automation score
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="muted">{state.budgets.length} budgets · {state.goals.length} goals · {state.txns.length} txns tracked</p>
                <div className="progress-track" style={{ marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: `${autopilotScore}%` }} />
                </div>
                <div className="chips-inline">
                  {scenarioPlays.map((play) => (
                    <button key={play.label}>{play.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card pad">
            <div className="title">Top categories</div>
            {topCats.length ? (
              <div className="timeline-grid">
                {topCats.map(([cat, value]) => (
                  <div key={cat} className="timeline-row">
                    <div>
                      <strong>{cat}</strong>
                      <p className="muted tiny" style={{ marginTop: 4 }}>
                        {((Number(value) / Math.max(1, spend)) * 100).toFixed(1)}% of spend
                      </p>
                    </div>
                    <div style={{ width: "60%" }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min(100, (Number(value) / Math.max(1, spend)) * 100)}%` }} />
                      </div>
                    </div>
                    <span>${Number(value).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">No data yet. Add transactions!</div>
            )}
          </div>
        </div>

        <div className="page-stack">
          <MarketPulseStrip symbols={MARKET_SYMBOLS} />
          <div className="card pad">
            <div className="title">Live feed</div>
            <ul className="feed">
              {latestTxns.length ? (
                latestTxns.map((t) => (
                  <li key={t.id}>
                    <strong>{t.description}</strong>
                    <span>
                      {t.category} · {t.date}
                    </span>
                    <span className={t.amount < 0 ? "status-negative" : "status-positive"}>
                      {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="muted">Your latest transactions will land here.</li>
              )}
            </ul>
          </div>

          <div className="card pad">
            <div className="title">Budgets watchlist</div>
            {budgetsAtRisk.length ? (
              budgetsAtRisk.map((b) => (
                <div key={b.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{b.category}</strong>
                    <span className={b.pct >= 100 ? "status-negative" : "status-positive"}>{b.pct}%</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: 6 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, b.pct)}%` }} />
                  </div>
                  <p className="muted tiny" style={{ marginTop: 4 }}>
                    ${b.actual.toFixed(0)} of ${b.limit.toFixed(0)} used
                  </p>
                </div>
              ))
            ) : (
              <div className="muted">All clear for this month.</div>
            )}
          </div>

          <div className="card pad">
            <div className="title">AI anomalies</div>
            {anomalies.length ? (
              anomalies.map((a, i) => (
                <div key={i} className="callout-strong" style={{ marginBottom: 12 }}>
                  <strong>{a.month}</strong>
                  <p className="muted" style={{ marginTop: 6 }}>
                    Spending spike ${a.current.toFixed(0)} vs avg ${a.avgPrev.toFixed(0)} · {a.diff.toFixed(0)} swing
                  </p>
                </div>
              ))
            ) : (
              <p className="muted">No anomalies detected.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <div className="value">{value}</div>
      <div className="trend">{trend}</div>
    </div>
  );
}

type MarketPulseStripProps = {
  symbols?: string[];
};

function MarketPulseStrip({ symbols = MARKET_SYMBOLS }: MarketPulseStripProps) {
  return (
    <div className="card pad">
      <div className="title">
        Market pulse
        <span className="muted tiny">Realtime data via Finnhub</span>
      </div>
      <div className="market-grid">
        {symbols.map((symbol) => (
          <MarketTicker key={symbol} symbol={symbol} />
        ))}
      </div>
    </div>
  );
}

type MarketTickerProps = {
  symbol: string;
};

function MarketTicker({ symbol }: MarketTickerProps) {
  const { data, loading, error } = useStockQuote(symbol, { refreshMs: 60_000 });
  const { data: history } = useStockHistory(symbol, { range: "1w", refreshMs: 5 * 60_000 });
  const change = data?.change ?? 0;
  const changePct = data?.changePct ?? 0;
  const historyPoints = history?.points ?? [];
  const historyTrend = historyPoints.length >= 2 ? historyPoints[historyPoints.length - 1].close - historyPoints[0].close : null;
  const trendPositive = historyTrend != null ? historyTrend >= 0 : change >= 0;

  return (
    <div className="market-card" aria-live="polite">
      <div className="market-symbol">
        <strong>{symbol}</strong>
        <span className="muted tiny">{data?.timestamp ? `Updated ${formatTime(data.timestamp)}` : "Live"}</span>
      </div>
      <div className="market-price-row">
        <span className="market-price">
          {data ? currency.format(data.current) : loading ? "…" : "—"}
        </span>
        <span className={`market-change ${trendPositive ? "pos" : "neg"}`}>
          {data
            ? `${trendPositive ? "+" : ""}${change.toFixed(2)} (${trendPositive ? "+" : ""}${changePct.toFixed(2)}%)`
            : error
            ? "Unavailable"
            : "Awaiting"}
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <StockSparkline points={historyPoints} trendPositive={trendPositive} height={32} />
        {historyTrend != null && (
          <p className={`muted tiny ${trendPositive ? "pos" : "neg"}`}>
            1w trend {trendPositive ? "+" : ""}{historyTrend.toFixed(2)}
          </p>
        )}
      </div>
      {error && (
        <p className="muted tiny" style={{ color: "#fb7185" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
