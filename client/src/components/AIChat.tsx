import React, { useEffect, useRef, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Extras = { tags: string[]; riskLevel: "low" | "medium" | "high"; nextActions: string[] };
type AIResponse = { reply: string; extras?: Extras };

const suggestions = [
  "Build me a starter ETF allocation",
  "How do I budget on $2k/mo?",
  "What’s a good DCA plan for S&P 500?",
  "Explain risk vs. reward like I'm 12"
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

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: "assistant", content: "Hey! I’m InvestMate. Ask me about budgeting, ETFs, or planning." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<Extras | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages(m => [...m, { id: crypto.randomUUID(), role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context: window.localStorage.getItem("aimate_state_v1") || "{}" }),
      });
      const data: AIResponse = await res.json();
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", content: data.reply }]);
      if (data.extras) setExtras(data.extras);
    } catch (e) {
      setMessages(m => [...m, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I hit an error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-wrap">
      <div>
        <div className="messages">
          {messages.map(m => (
            <div key={m.id} className={"row " + (m.role === "user" ? "right" : "assistant left")}>
              <div className="bubble">{mdLite(m.content)}</div>
            </div>
          ))}
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
      </div>

      <aside className="panel summary">
        <h4>Smart summary</h4>
        {extras ? (
          <div>
            <div className="muted">Risk: <b style={{color:'#e5fbea'}}>{extras.riskLevel}</b></div>
            <div style={{marginTop:8}} className="muted">Tags:</div>
            <div style={{marginTop:6}}>
              {extras.tags?.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div style={{marginTop:10}} className="muted">Next Actions:</div>
            <div style={{marginTop:6}}>
              {extras.nextActions?.map((a,i) => <div key={i} className="muted">• {a}</div>)}
            </div>
          </div>
        ) : (
          <div className="muted">Ask a question to see a personalized summary.</div>
        )}
        <div style={{marginTop:14}}>
          <button className="ghost">Export chat</button>
          <button className="ghost" style={{marginLeft:8}}>Copy answer</button>
        </div>
      </aside>
    </div>
  );
}