
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function signIn() {
    const { error } = await supabase.auth.signInWithOtp({ email });
    setStatus(error ? error.message : "Magic link sent. Check your email.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStatus("Signed out");
  }

  return (
    <div className="card pad" style={{marginTop:14}}>
      <div className="title">Sign in (magic link)</div>
      <div className="composer">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn" onClick={signIn}>Send link</button>
        <button className="ghost" onClick={signOut}>Sign out</button>
      </div>
      <div className="muted" style={{marginTop:8}}>{status}</div>
    </div>
  );
}
