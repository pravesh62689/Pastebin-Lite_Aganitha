# Pastebin Lite (React + Express)

A small Pastebin-like application where users can create text pastes and share a link to view them. Pastes can optionally expire by **time (TTL)** and/or **view count**.

This repo is structured as two folders:

- `backend/` — Express API + HTML paste viewer + serves the React build in production
- `frontend/` — React (Vite) UI for creating pastes

> Persistence: **Postgres** (e.g., Neon) via `pg` (node-postgres). The backend auto-creates the required table on startup.

---

## Features (per spec)

- `GET /api/healthz` — JSON health check that verifies DB access
- `POST /api/pastes` — create a paste
- `GET /api/pastes/:id` — fetch a paste (counts as a view)
- `GET /p/:id` — server-rendered HTML view of a paste (safe rendering)

### Expiry testing (deterministic time)

If `TEST_MODE=1` is set, the header below is used **as the current time for expiry logic only**:

- `x-test-now-ms: <milliseconds since epoch>`

If the header is missing, the real system clock is used.

---

## Local Development

### 1) Prerequisites
- Node.js 18+
- A Postgres database (Neon recommended)

### 2) Configure environment
Create `backend/.env` (see `backend/.env.example`):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
PORT=8080
```

### 3) Install deps
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 4) Run locally (two terminals)

**Terminal A (backend):**
```bash
cd backend
npm run dev
```

**Terminal B (frontend):**
```bash
cd frontend
npm run dev
```

Open the UI at the URL shown by Vite (usually `http://localhost:5173`).

---

## Production / Deployment notes

This project is designed so a single server can satisfy all required routes on one domain.

**Build the frontend:**
```bash
cd frontend
npm run build
```

**Start the backend (serves `frontend/dist` automatically):**
```bash
cd ../backend
npm start
```

The backend will:
- serve the React app at `/`
- serve API routes under `/api/*`
- serve paste HTML pages at `/p/:id` (server-rendered)

### Render/Railway example
A typical build command could be:
```bash
cd frontend && npm ci && npm run build && cd ../backend && npm ci
```

Start command:
```bash
cd backend && npm start
```

Make sure you set `DATABASE_URL` in the platform environment variables.

---

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

---

## Design decisions (quick)
- **Atomic view counting**: API fetch uses a single SQL `UPDATE ... WHERE ... RETURNING` so view limits are enforced correctly under concurrent load.
- **No hardcoded localhost URLs**: share URLs are built from the incoming request host/protocol.
- **Safe HTML rendering**: paste content is escaped before embedding into the HTML view.
