
import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function signIn() {
    if (!supabase) { setStatus("Supabase not configured."); return; }
    const { error } = await supabase.auth.signInWithOtp({ email });
    setStatus(error ? error.message : "Magic link sent. Check your email.");
  }

  return (
    <div className="card pad" style={{marginTop:14}}>
      <div className="title">Sign in (magic link)</div>
      <div className="composer">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn" onClick={signIn}>Send link</button>
      </div>
      <div className="muted" style={{marginTop:8}}>{status}</div>
    </div>
  );
}
