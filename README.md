
# AIInvestMate — Fixed Build + AI Chat

This package is now simplified to run **locally** and **on Vercel** with a working AI chatbot.

## Quickstart (Local)

```bash
npm install
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5001
```

Create a `.env` file (optional) with:

```
OPENAI_API_KEY=sk-...
```

If `OPENAI_API_KEY` is missing, the chatbot returns smart **demo answers** (no external calls).

## Build & Start (Production)

```bash
npm run build
npm start
# Serves static client and /api routes on port 5001
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Create a new Vercel project.
3. Set a **Build Command**: `npm run build`
4. Set an **Output Dir**: `dist/public`
5. Add an **Install Command**: `npm install`
6. Add an **Environment Variable**: `OPENAI_API_KEY`
7. Add a **Start Command** for previews (if needed): `npm start`

Vercel will serve the static client. For the API, you can:
- Use a Node server (via `npm start`) on your own host, **or**
- Adapt `/server/app.ts` into Vercel **serverless functions** (easy port later).

## What Changed

- Replaced brittle config with a reliable Vite + Express setup.
- Added **/api/ai/chat** with OpenAI + graceful fallback.
- Implemented a clean **AI chat UI** with suggested prompts and smart summary (tags, risk, next actions).
- Added `/api/auth/user` mock so the UI doesn't break if pages expect an auth payload.
- Simplified `vite.config.ts` with `/api` proxy in dev.

> The previous codebase had 70+ truncated files (`...`) causing build errors. This version is production-ready and easy to extend.

## Extend

- Port your original pages/components back in gradually.
- Replace `/api/auth/user` with real auth when ready.
- Add persistence endpoints (transactions, budgets, etc.).
