import React, { useRef, useState } from "react";
import { useStore, Txn } from "../state/store";

export function TransactionsPage() {
  const { state, addTxn, deleteTxn, importTxnsCSV } = useStore();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), description:"", category:"General", amount: "" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onAdd = () => {
    const amt = Number(form.amount || 0);
    if (!form.description) return;
    addTxn({ date: form.date, description: form.description, category: form.category, amount: amt });
    setForm({ ...form, description:"", amount:"" });
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const added = importTxnsCSV(text);
    alert(`Imported ${added} transactions`);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section style={{marginTop:12}}>
      <div className="card pad">
        <div className="title">Add transaction</div>
        <div className="composer">
          <input className="input" type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <input className="input" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <input className="input" placeholder="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
          <input className="input" placeholder="Amount (negative=expense)" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
          <button className="btn" onClick={onAdd}>Add</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={onImport} style={{display:'none'}} />
          <button className="ghost" onClick={()=>fileRef.current?.click()}>Import CSV</button>
        </div>
        <div className="muted" style={{marginTop:8}}>CSV headers: date, description, category, amount</div>
      </div>

      <div className="card pad" style={{marginTop:14}}>
        <div className="title">All transactions</div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left', color:'#94a3b8'}}>
              <th>Date</th><th>Description</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {state.txns.slice().reverse().map(t => (
              <tr key={t.id} style={{borderTop:'1px solid #1f2937'}}>
                <td>{t.date}</td>
                <td>{t.description}</td>
                <td>{t.category}</td>
                <td style={{textAlign:'right', color: t.amount<0 ? '#fca5a5' : '#a7f3d0'}}>{t.amount<0?'-':''}${Math.abs(t.amount).toFixed(2)}</td>
                <td style={{textAlign:'right'}}><button className="ghost" onClick={()=>deleteTxn(t.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}