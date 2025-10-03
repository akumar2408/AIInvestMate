import React from "react";
import AIChat from "./components/AIChat";
import "./styles.css";

export default function App() {
  return (
    <div>
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-badge">💹</div>
            <div>
              <div style={{fontSize:18}}>AI InvestMate</div>
              <div style={{fontSize:12, color:'#94a3b8'}}>Personal finance, simplified</div>
            </div>
          </div>
          <nav className="nav">
            <a href="#">Dashboard</a>
            <a href="#">Transactions</a>
            <a href="#">Reports</a>
            <a href="#">Profile</a>
          </nav>
        </header>

        <section className="hero">
          <div className="card pad">
            <div className="title">Welcome back, Aayush 👋</div>
            <div className="muted">Ask the assistant or try a what‑if analysis. Your money, made clear.</div>
            <div style={{marginTop:14}}>
              <div className="card pad" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, background:'linear-gradient(180deg, rgba(32,70,54,.25), rgba(12,25,40,.4))'}}>
                <div>
                  <div className="muted">Net Worth</div>
                  <div style={{fontSize:22, fontWeight:800}}>$—</div>
                </div>
                <div>
                  <div className="muted">30‑Day Spend</div>
                  <div style={{fontSize:22, fontWeight:800}}>$—</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card pad">
            <div className="title">Quick actions</div>
            <div className="suggest">
              <button className="chip">Add transaction</button>
              <button className="chip">Set budget</button>
              <button className="chip">Create goal</button>
              <button className="chip">Import CSV</button>
            </div>
          </div>
        </section>

        <section style={{marginTop:20}}>
          <div className="card pad">
            <AIChat />
          </div>
        </section>

        <footer className="footer">© {new Date().getFullYear()} AI InvestMate</footer>
      </div>
    </div>
  );
}