
# Pastebin Lite (React + Express)

A small Pastebin-like application where users can create text pastes and share a link to view them. Pastes can optionally expire by time (TTL) and/or view count.

This repo is structured as two folders:

- `backend/` — Express API + HTML paste viewer + Postgres persistence
- `frontend/` — React (Vite) UI for creating pastes

Persistence: Postgres (Neon) via `pg` (node-postgres). The backend auto-creates the required table on startup.

## Tech

- Frontend: React (Vite) + Axios
- Backend: Node.js + Express
- Persistence: Postgres (Neon)

## Features (per spec)

- `GET /api/healthz` — JSON health check that verifies DB access
- `POST /api/pastes` — create a paste
- `GET /api/pastes/:id` — fetch a paste (counts as a view)
- `GET /p/:id` — server-rendered HTML view of a paste (safe rendering, no script execution)

## Expiry testing (deterministic time)

If `TEST_MODE=1` is set, the header below is treated as the current time for expiry logic only:

- `x-test-now-ms: <milliseconds since epoch>`

If the header is missing, real system time is used.

## Local Development

### 1) Prerequisites

- Node.js 18+
- A Postgres database (Neon recommended)

### 2) Configure environment

Create `backend/.env` (do not commit it):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
PORT=8080
TEST_MODE=0
NODE_ENV=development
```


### 3) Install deps

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 4) Run locally (two terminals)

Terminal A (backend):

```bash
cd backend
npm run dev
```

Terminal B (frontend):

```bash
cd frontend
npm run dev
```

Open the UI at the Vite URL (usually `http://localhost:5173`).

## Production / Deployment notes

This project is designed so one domain can satisfy all required routes.

### Run as a single server (backend serves frontend build)

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend:

```bash
cd ../backend
npm start
```

Backend will serve:

- React app at `/` (when `frontend/dist` exists and NODE_ENV=production)
- API routes at `/api/*`
- HTML paste view at `/p/:id`

### Current deployment setup (Vercel + Railway)

- Frontend is deployed on Vercel
- Backend is deployed on Railway
- For the grader/tests, the Vercel domain should behave like the single public URL

To achieve this, Vercel rewrites are used so these routes work on the Vercel domain:

- `/api/*` forwards to the Railway backend `/api/*`
- `/p/*` forwards to the Railway backend `/p/*`

This keeps API + HTML routes available from one domain (the Vercel URL).

## API Examples

Create a paste:

```bash
curl -X POST http://localhost:8080/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"hello","ttl_seconds":60,"max_views":5}'
```

Fetch a paste (counts as a view):

```bash
curl http://localhost:8080/api/pastes/<id>
```

View in browser:

- `http://localhost:8080/p/<id>`

## Live URL

- App (Vercel): [https://pastebin-lite-aganitha.vercel.app/](https://pastebin-lite-aganitha.vercel.app/)
- Server (Railway): [https://pastebin-liteaganitha-production.up.railway.app/](https://pastebin-liteaganitha-production.up.railway.app/)

