import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../state/store";
import type { Concept } from "@shared/concepts";
import { InfoPill } from "./InfoPill";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Extras = { tags: string[]; riskLevel: "low" | "medium" | "high"; nextActions: string[]; concepts?: Concept[] };
type AIResponse = { reply: string; extras?: Extras; insights?: { kpis?: { income: number; spend: number; savingsRate: number } } };
type StructuredSections = { snapshot: string[]; insights: string[]; next: string[]; misc: string[] };

const suggestions = [
  "Make a budget for me. I make $2.8k/month, rent is $1200, I want to invest $400.",
  "Explain why Dining blew up this month and what to trim.",
  "Give me a DCA plan for ETFs that matches a balanced risk profile.",
  "Summarize my subscriptions and which ones to cancel."
];

function stripCodeFences(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`{3,}[\s\S]*?`{3,}/g, "");
}

function mdLite(text: string): JSX.Element {
  const cleaned = stripCodeFences(text).trim();
  const lines = cleaned.split(/\n+/);
  const blocks: JSX.Element[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      blocks.push(<ul key={Math.random()}>{list.map((li, i) => <li key={i}>{li}</li>)}</ul>);
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else {
      flushList();
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        return <span key={i}>{p}</span>;
      });
      blocks.push(<p key={Math.random()}>{parts}</p>);
    }
  }
  flushList();
  return <>{blocks}</>;
}

function parseStructuredReply(text: string): StructuredSections | null {
  const lines = stripCodeFences(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const sections: StructuredSections = { snapshot: [], insights: [], next: [], misc: [] };
  let current: keyof StructuredSections = "misc";
  const setSection = (header: string) => {
    const norm = header.toLowerCase();
    if (norm.startsWith("snapshot")) current = "snapshot";
    else if (norm.startsWith("insight")) current = "insights";
    else if (norm.startsWith("next") || norm.startsWith("actions")) current = "next";
    else current = "misc";
  };
  for (const line of lines) {
    if (/^[A-Za-z\s]+:$/i.test(line)) {
      setSection(line.replace(/:$/, ""));
      continue;
    }
    if (/^(snapshot|insights?|next actions?|next steps)/i.test(line)) {
      setSection(line);
      continue;
    }
    if (line.startsWith("- ")) {
      sections[current].push(line.slice(2));
    } else {
      sections[current].push(line);
    }
  }
  if (sections.snapshot.length || sections.insights.length || sections.next.length) {
    return sections;
  }
  return null;
}

function AssistantReply({ sections }: { sections: StructuredSections }) {
  const blocks = [
    { key: "Snapshot", rows: sections.snapshot },
    { key: "Insights", rows: sections.insights },
    { key: "Next", rows: sections.next },
  ].filter(block => block.rows.length);
  return (
    <div className="assistant-summary">
      {blocks.map(block => (
        <div key={block.key} className="assistant-card">
          <p className="assistant-card-label">{block.key}</p>
          <ul>
            {block.rows.map((row, index) => (
              <li key={`${block.key}-${index}`}>{row}</li>
            ))}
          </ul>
        </div>
      ))}
      {sections.misc.length ? (
        <div className="assistant-card muted">
          {sections.misc.map((row, index) => (
            <p key={`misc-${index}`}>{row}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AIChat() {
  const { state, logChat } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: "assistant", content: "Hi! I'm your AI copilot. Ask me to explain a month, budget, or plan." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<Extras | null>(null);
  const [kpis, setKpis] = useState<{ income: number; spend: number; savingsRate: number } | null>(null);
  const [status, setStatus] = useState("");
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [exportMonth, setExportMonth] = useState(() => currentMonth);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;

    // clear input + push user message
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: msg }]);
    setLoading(true);
    setStatus("");

    try {
      // Make context super defensive so it never throws
      const safeContext = {
        txns: Array.isArray(state.txns) ? state.txns.slice(-60) : [],
        budgets: Array.isArray(state.budgets) ? state.budgets : [],
        goals: Array.isArray(state.goals) ? state.goals : [],
        profile: state.profile ?? {},
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send context as an object; chat.ts already handles both string & object
        body: JSON.stringify({
          message: msg,
          context: safeContext,
        }),
      });

      if (!res.ok) {
        // if the route is wrong or server blew up, this prevents res.json() from throwing
        throw new Error(`Chat endpoint failed with status ${res.status}`);
      }

      const data: AIResponse = await res.json();

      if (!data || !data.reply) {
        throw new Error("Missing reply from chat endpoint");
      }

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: data.reply }]);

      if (data.extras) setExtras(data.extras);
      if (data.insights?.kpis) setKpis(data.insights.kpis);

      logChat({ question: msg, answer: data.reply });
      setStatus("Answered • " + new Date().toLocaleTimeString());
    } catch (e) {
      console.error("AI chat error", e);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I hit an error. Try again." },
      ]);
      setStatus("AI unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const lastAssistant = useMemo(() => [...messages].reverse().find((m) => m.role === "assistant"), [messages]);
  const logMonths = useMemo(() => Array.from(new Set((state.aiLogs || []).map((log) => log.month))).sort().reverse(), [state.aiLogs]);
  const monthOptions = useMemo(() => {
    const set = new Set(logMonths);
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [logMonths, currentMonth]);

  function exportLogs() {
    const month = exportMonth;
    const rows = (state.aiLogs || []).filter((log) => log.month === month);
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investmate-chat-${month}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyAnswer() {
    if (!lastAssistant) return;
    navigator.clipboard.writeText(stripCodeFences(lastAssistant.content));
    setStatus("Copied latest answer");
  }

  return (
    <div className="chat-wrap">
      <div>
        <div className="messages">
          {messages.map(m => {
            const structured = m.role === "assistant" ? parseStructuredReply(m.content) : null;
            return (
              <div key={m.id} className={"row " + (m.role === "user" ? "right" : "assistant left")}>
                <div className="bubble">{structured ? <AssistantReply sections={structured} /> : mdLite(m.content)}</div>
              </div>
            );
          })}
          {loading && (
            <div className="row assistant left">
              <div className="bubble"><span className="typing">InvestMate is thinking…</span></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="composer">
          <input
            className="input"
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button className="btn" onClick={() => send()} disabled={loading}>Send</button>
        </div>

        <div className="suggest">
          {suggestions.map(s => (
            <button key={s} className="chip" onClick={() => send(s)} disabled={loading}>{s}</button>
          ))}
        </div>
        <div className="muted tiny" style={{marginTop:8}}>{status}</div>
      </div>

      <aside className="panel summary">
        <h4>Smart summary</h4>
        {extras ? (
          <div>
            <div className="muted">Risk: <b style={{color:'#e5fbea'}}>{extras.riskLevel}</b></div>
            {kpis && (
              <div className="kpi-chip-row">
                <span>Income ${kpis.income.toFixed(0)}</span>
                <span>Spend ${kpis.spend.toFixed(0)}</span>
                <span>Savings {kpis.savingsRate}%</span>
              </div>
            )}
            <div style={{marginTop:8}} className="muted">Tags:</div>
            <div style={{marginTop:6}}>
              {extras.tags?.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div style={{marginTop:10}} className="muted">Next actions</div>
            <div style={{marginTop:6}}>
              {extras.nextActions?.map((a,i) => <div key={i} className="muted">• {a}</div>)}
            </div>
            {extras.concepts?.length ? (
              <div style={{marginTop:12}}>
                <div className="muted">Concepts mentioned</div>
                <div className="concept-grid">
                  {extras.concepts.map(concept => (
                    <div key={concept.term} className="concept-pill">
                      <strong>{concept.term}</strong>
                      <p>{concept.short}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div style={{ marginTop: 16 }}>
              <div className="muted tiny">Need a refresher?</div>
              <div className="pill-row" style={{ marginTop: 6 }}>
                {[
                  "DCA",
                  "ETF",
                  "Expense ratio",
                ].map(term => (
                  <InfoPill key={term} term={term} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="muted">Ask a question to see a personalized summary.</div>
        )}
        <div className="export-row">
          <select className="input" value={exportMonth} onChange={(e)=>setExportMonth(e.target.value)}>
            {monthOptions.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <button className="ghost" onClick={exportLogs}>Export chat</button>
          <button className="ghost" onClick={copyAnswer}>Copy answer</button>
        </div>
      </aside>
    </div>
  );
}
