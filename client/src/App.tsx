import React, { useState } from "react";
import AIChat from "./components/AIChat";
import "./styles.css";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI InvestMate</h1>
        <nav className="space-x-4 text-slate-300">
          <a href="#" className="hover:text-white">Dashboard</a>
          <a href="#" className="hover:text-white">Transactions</a>
          <a href="#" className="hover:text-white">Reports</a>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24">
        <section className="rounded-2xl border border-slate-800 p-6 mb-6 bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <p className="text-slate-300">
            Welcome back, Aayush. Try the assistant for quick insights or run a what‑if scenario.
          </p>
        </section>

        <AIChat />
      </main>
      <footer className="text-center text-sm text-slate-500 py-6">
        © {new Date().getFullYear()} AI InvestMate
      </footer>
    </div>
  );
}