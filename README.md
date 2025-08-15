
# AI Investmate

**AI Investmate** is a full-stack, App Store–ready finance & investing app. It helps users track spending, budgets, goals, and portfolios—then layers on an AI Money Coach (👋 say hi to **Gary**) for insights, forecasting, and “what-if” simulations. The app supports OAuth login, TOTP 2FA, Stripe subscriptions (Free/Pro/Premium), and bank/investment connectivity (Plaid sandbox in dev).


## ✨ Key Features

* **Dashboard** — Financial overview: balances, monthly P/L, savings rate, AI insights.
* **Transactions** — Manual entry + **AI auto-categorization**, filters, search.
* **Budgets** — Category limits, progress bars, overspend alerts, AI recommendations.
* **Goals** — Targets with progress tracking and smart nudges.
* **Reports** — **AI narratives** for monthly/quarterly/yearly trends.
* **Investments** — Positions, P/L, diversification, performance stats.
* **AI Money Coach (Gary)** — Context-aware chat for spend breakdowns, budget ideas, portfolio analysis, forecasting, and what-if scenarios.
* **Security** — Google OAuth, **TOTP 2FA + backup codes**, trusted devices, session management, encrypted sensitive data.
* **Subscriptions** — Free / Pro / Premium via **Stripe** with server-enforced gating.
* **Bank/Investments** — Plaid (sandbox) for account linking & syncing (dev).
* **Nice UX** — Dark emerald theme, glassy cards, responsive layout, charts, CSV export, privacy quick-hide.

---

## 🧱 Tech Stack

**Web:** Vite + React + TypeScript + Tailwind
**Server:** Node.js (Express/Nest-style routing)
**DB/ORM:** Postgres + **Drizzle ORM** (see `drizzle.config.ts`)
**Auth:** Google OAuth + TOTP (e.g., `otplib`), sessions & trusted devices
**AI:** OpenAI-compatible endpoint (Gary the coach)
**Billing:** Stripe (Checkout + Webhooks)
**Banking:** Plaid (sandbox/Link)
**Build/Run:** NPM scripts, Replit support

---

## 📁 Monorepo Layout

```
.
├─ client/                 # React app (Vite, TS, Tailwind)
│  ├─ src/
│  │  ├─ pages/            # landing, dashboard, transactions, budgets, goals, investments, reports, subscribe, profile
│  │  ├─ components/       # charts, forms, AIChatbot, widgets
│  │  └─ styles/
│  └─ index.html
├─ server/                 # API server, routes, services, webhooks
│  ├─ routes.ts
│  ├─ middleware/
│  ├─ services/
│  └─ db/                  # drizzle schema & migrations
├─ shared/                 # shared types/utils
├─ drizzle.config.ts
├─ tailwind.config.ts
├─ vite.config.ts
├─ package.json
└─ replit.md               # Replit workspace notes
```

---

## 🔐 Environment Variables

Create **`.env`** (server) and **`.env.local`** (client) as needed. Examples:

**Server (.env):**

```
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB

# Auth (Google OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OAUTH_CALLBACK_URL=http://localhost:5000/api/auth/callback

# 2FA (no env needed unless you store vendor config)
SESSION_SECRET=replace_me

# OpenAI (Gary)
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # set after you create a webhook endpoint

# Stripe price IDs (one per plan)
STRIPE_PRICE_FREE=price_free_dummy            # (optional placeholder)
STRIPE_PRICE_PRO=price_123_pro_monthly
STRIPE_PRICE_PREMIUM=price_456_premium_monthly

# Plaid (sandbox)
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
PLAID_REDIRECT_URI=http://localhost:5000/api/banks/callback
```

**Client (.env.local):**

```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:5000
```

> **Heads-up:** Stripe price ID envs must be set (Pro/Premium) to avoid “missing price” checkout errors.

---

## 🚀 Getting Started (Local)

1. **Install deps**

   ```bash
   npm install
   ```

2. **DB setup (Drizzle)**

   ```bash
   # generate SQL & run migrations (scripts may vary; adjust to your package.json)
   npm run db:generate
   npm run db:migrate
   # optional seed
   npm run db:seed
   ```

3. **Run dev (server + client)**

   ```bash
   npm run dev
   ```

   By default:

   * API server on **[http://localhost:5000](http://localhost:5000)**
   * Web client on **[http://localhost:5173](http://localhost:5173)** (or as shown in console)

4. **Stripe (test)**

   * Create Products/Prices (Pro, Premium) → copy **price IDs** into `.env`.
   * Start the webhook listener (example):

     ```bash
     stripe listen --forward-to localhost:5000/api/billing/webhook
     ```
   * Use Stripe test cards (e.g., `4242 4242 4242 4242`).

5. **Plaid (sandbox)**

   * Set sandbox keys.
   * Use Plaid Link in the app to connect sandbox institutions.

6. **OpenAI**

   * Add `OPENAI_API_KEY` for Gary (AI chat/insights/reports).
   * Without this, app will fall back to basic responses.

---

## 🧪 Test Data / Seeding

* Seed script adds:

  * **8** transactions (mixed categories)
  * **5** budgets (Food, Transport, Rent, Shopping, Utilities)
  * **3** goals (Emergency Fund, Vacation, New Laptop)
  * **Mock** bank accounts & investments
* Run:

  ```bash
  npm run db:seed
  ```

---

## 🧭 App Walkthrough

* **Landing → Login**: “Get Started” → Google OAuth → optional enable **2FA**.
* **Dashboard**: Overview cards, **AI Insights**, spending chart, recent activity, goal progress, portfolio snapshot.
* **Transactions**: Add/edit/search; **no empty Select values** (fixed); AI categorization available.
* **Budgets**: Monthly caps, progress, overspend alerts, AI suggestions.
* **Goals**: Targets w/ timelines, progress bars.
* **Investments**: Holdings, P/L, allocation, diversification hints.
* **Reports**: Generate period reports → **AI narrative** with concrete figures.
* **AI Chat (Gary)**: Floating assistant; context-aware (spend, budgets, portfolio).
* **Subscribe**: Free → **Pro/Premium** Stripe Checkout (**price IDs required**).
* **Profile/Security**: Personal info, **2FA + backup codes**, sessions, trusted devices.

---

## 🪪 Plans & Gating

* **Free**: Core tracking, manual categorization, basic reports, basic AI chat.
* **Pro**: AI categorization, advanced budgets/goals, forecasting, monthly AI reports.
* **Premium**: Portfolio analysis, what-if simulator, fraud alerts, quarterly/yearly AI reports, priority sync.

> Enforced both **server-side middleware** and **client UI** checks.

---

## 🔒 Security Notes

* **2FA** (TOTP) with **backup codes**.
* Encrypted secrets (e.g., AES-GCM/libsodium), only show **last 4** for accounts.
* Session/device management (revoke sessions, “trust this device”).
* Rate-limit auth & AI routes; validate inputs (Zod or similar).
* Do **not** rely on client for premium access—always check plan on the server.

---



## 🧰 NPM Scripts (examples)

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "tsx server/index.ts",
    "dev:client": "vite --host",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p server/tsconfig.json",
    "start": "node dist/server/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx server/db/seed.ts",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

## 📦 API Surface (high-level)

* **Auth**: `/api/auth/google`, `/api/auth/callback`, `/api/auth/2fa/setup|verify|login`, `/api/auth/logout`
* **Me/Security**: `/api/me`, `/api/me/profile`, `/api/me/security`, `/api/me/sessions`, `/api/me/devices/*`
* **Billing**: `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook`
* **Banks**: `/api/banks/link`, `/api/banks/exchange_public_token`, `/api/banks`, `/api/banks/sync`
* **Investments**: `/api/investments` (CRUD)
* **Transactions**: `/api/transactions` (list w/ filters + create)
* **Budgets/Goals**: `/api/budgets` & `/api/goals` (CRUD)
* **Reports**: `/api/reports/generate`, `/api/reports`
* **AI**: `/api/ai/chat`, `/api/ai/categorize`, `/api/ai/whatif`

---

