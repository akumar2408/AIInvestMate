# AI InvestMate

A cinematic, AI-assisted personal finance cockpit that blends real-time budgeting, transaction insights, and conversational guidance on top of Supabase + Vite. The onboarding flow now feels like a bespoke launch sequence so every user begins with preferences that match their goals.

## ✨ Feature highlights
- **Creative onboarding portal** – multi-stage preference wizard with an aurora-inspired transition that blurs the dashboard while you answer questions and then warps you back into the app once you’re done. You can relaunch it anytime from **Profile → Edit personalization**.
- **Supabase cloud sync** – profiles, transactions, budgets, goals, and AI chat logs persist via `@supabase/supabase-js` with auth-aware hydration inside the Zustand store.
- **AI chat + simulator** – the dashboard ships with an AI assistant and savings simulator so users can test scenarios before committing.
- **Reports, budgets & goals** – cards, charts, CSV export, and anomaly detection give a quick read on cash flow.
- **Full-stack ready** – Express API (in `server/`) plus Drizzle schema (`api/db`) so you can add cron jobs, Plaid connectors, or Stripe-powered upgrades when you’re ready.

## 🗂 Project structure
```
client/               # Vite + React SPA
client/src/state      # Zustand store wired to Supabase
client/src/components # UI building blocks (AI chat, onboarding, etc.)
server/               # Express API (auth, plaid mocks, edge-style handlers)
api/db                # Drizzle ORM schema and seed helpers
```

## 🚀 Getting started
### 1. Prerequisites
- Node.js 18+
- npm (ships with Node) or a compatible package manager

### 2. Install dependencies
```bash
npm install
```

### 3. Environment variables
Copy `.env.example` to `.env` (Vite automatically loads it) and set your Supabase credentials. Example:
```env
VITE_SUPABASE_URL=https://kjyqncjvpnmmxzothrva.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> Keep the anon key scoped to client-side access only. For service-role keys use server-side code.

If you deploy to Vercel, add the same two variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the project settings so builds receive them.

### 4. Run the stack
```bash
npm run dev          # Vite + API (Concurrently)
npm run build        # Production bundle (client + server)
npm run start        # Run built server (after npm run build)
npm run check        # Type-check the repo
```

The dev server hosts the React app on `http://localhost:5173` and the Express API on `http://localhost:5001` (see `package.json`).

## ☁️ Supabase + data sync
- `client/src/lib/supabaseClient.ts` creates a single Supabase client seeded by the env vars.
- `client/src/state/store.tsx` bootstraps the Zustand store, automatically creating a profile row, pulling latest transactions/budgets/goals/logs, and pushing mutations back to Supabase.
- Row Level Security is enabled. During local builds you can use permissive dev policies (see SQL in the Supabase dashboard). Lock this down before launch.

## 📦 Useful commands
| Command | Description |
| --- | --- |
| `npm run dev` | Runs Vite + Express together for local hacking. |
| `npm run build` | Produces `dist/` for both client and server. |
| `npm run start` | Boots the compiled Express server (after build). |
| `npm run check` | TypeScript project-wide type check. |

## 🗺 Roadmap / next upgrades
1. **Add receipt OCR → auto-create transactions** for instant wow-factor.
2. **Auto-categorize new transactions** so manual tagging disappears.
3. **Monthly AI recap (Edge Function + cron)** to prove end-to-end AI workflows.
4. **Subscription tracker** to surface recurring drains automatically.
5. **Investment insights** so it feels like a true finance co-pilot.

## 🤝 Contributing & notes
- Stick to the Sora/Inter typography + neon accent palette defined in `client/src/styles.css`.
- When adding new components under `client/src`, check whether they need Supabase data and wire them through the store instead of calling the client directly.
- Feel free to drop issues/ideas in the roadmap section above as you iterate.

Happy building! 🚀
