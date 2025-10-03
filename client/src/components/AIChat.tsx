import React, { useEffect, useRef, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };
type Extras = { tags: string[]; riskLevel: "low" | "medium" | "high"; nextActions: string[] };
type AIResponse = { reply: string; extras?: Extras };

const suggested: string[] = [
  "Build me a starter ETF allocation",
  "How do I budget on $2k/mo?",
  "What’s a good DCA plan for S&P 500?",
  "Explain risk vs. reward like I'm 12"
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", content: "Hey! I’m InvestMate. Ask me about budgeting, ETFs, or planning." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<Extras | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(msg?: string) {
    const text = (msg ?? input).trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data: AIResponse = await res.json();
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: data.reply }]);
      if (data.extras) setExtras(data.extras);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I hit an error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 p-6 bg-slate-900/40">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9">
          {messages.map((m) => (
            <div key={m.id} className={"bubble mt-2 " + (m.role === "assistant" ? "ai" : "")}>
              {m.content}
            </div>
          ))}
          {loading && <div className="bubble ai mt-2"><span className="typing">InvestMate is thinking…</span></div>}
          <div ref={endRef} />
          <div className="row mt-4">
            <input
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={() => send()} disabled={loading}>Send</button>
          </div>
          <div className="mt-2 small">Try:</div>
          <div className="mt-2">
            {suggested.map((s) => (
              <button key={s} className="badge" onClick={() => send(s)} disabled={loading}>{s}</button>
            ))}
          </div>
        </div>
        <div className="col-span-3">
          <div className="bubble">
            <div className="small">Smart summary</div>
            {extras ? (
              <div className="mt-2">
                <div className="small">Risk: <b>{extras.riskLevel}</b></div>
                <div className="small mt-2">Tags:</div>
                <div className="mt-1">
                  {extras.tags?.map((t) => <span key={t} className="badge">{t}</span>)}
                </div>
                <div className="small mt-2">Next Actions:</div>
                <ul className="small mt-1">
                  {extras.nextActions?.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            ) : (
              <div className="small mt-2">Ask a question to see a summary.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}