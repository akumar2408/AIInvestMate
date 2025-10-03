

## New features
- CSV export (transactions & budgets)
- Anomaly detection (spend spikes vs prior 3‑mo avg)
- What‑if simulator (monthly contrib, APY, years → future value & ETA)
- Supabase scaffolding (magic link auth) — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`


## Cloud sync & Plaid scaffolding
- **Drizzle schema** in `api/db/schema.ts` and connector in `api/db/index.ts` (uses `SUPABASE_DB_URL`).
- **Sync endpoints**: `GET /api/sync/pull?userId=...`, `POST /api/sync/push`.
- **Plaid mocks**: `/api/plaid/link-token`, `/api/plaid/exchange`, `/api/plaid/transactions`.
- Set env in Vercel:
  - `SUPABASE_DB_URL` (from Supabase → Database → Connection string)
  - `OPENAI_API_KEY`
  - (Later) `PLAID_CLIENT_ID`, `PLAID_SECRET`

