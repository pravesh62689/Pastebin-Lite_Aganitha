require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");

const { initDb, getPool } = require("./db");
const pastesRouter = require("./routes/pastes");
const { getExpiryNowMs } = require("./utils/time");
const { notFoundJson, errorHandler } = require("./middleware/error");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

app.use(express.json({ limit: "256kb" }));

app.get("/api/healthz", async (req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
});

app.use("/api/pastes", pastesRouter);

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.get("/p/:id", async (req, res) => {
  const id = req.params.id;

  const nowDate = new Date(getExpiryNowMs(req));

  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT id, content, expires_at, max_views, views_count
      FROM pastes
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Not Found");
    }

    const row = result.rows[0];

    const expired = row.expires_at && new Date(row.expires_at) <= nowDate;

    const overViews =
      row.max_views !== null && row.views_count >= row.max_views;

    if (expired || overViews) {
      return res.status(404).send("Not Found");
    }

    const safeContent = escapeHtml(row.content);

    res.status(200).set("Content-Type", "text/html; charset=utf-8");

    return res.send(
      `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Paste ${escapeHtml(id)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; background:#0b0f19; color:#e5e7eb; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 28px 16px 56px; }
    .card { background:#111827; border:1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 18px; }
    h1 { font-size: 16px; letter-spacing: .2px; margin: 0 0 12px; color:#cbd5e1; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 14px; line-height: 1.5; color:#f8fafc; }
    .meta { margin-top: 12px; font-size: 12px; color:#94a3b8; display:flex; gap:12px; flex-wrap:wrap; }
    .pill { padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10); }
    a { color: #a78bfa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Paste</h1>
      <pre>${safeContent}</pre>
      <div class="meta">
        <span class="pill">id: ${escapeHtml(id)}</span>
        <span class="pill">created via Pastebin Lite</span>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim()
    );
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.get("/", (req, res) =>
    res.sendFile(
      `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Paste ${escapeHtml(id)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; background:#0b0f19; color:#e5e7eb; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 28px 16px 56px; }
    .card { background:#111827; border:1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 18px; }
    h1 { font-size: 16px; letter-spacing: .2px; margin: 0 0 12px; color:#cbd5e1; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 14px; line-height: 1.5; color:#f8fafc; }
    .meta { margin-top: 12px; font-size: 12px; color:#94a3b8; display:flex; gap:12px; flex-wrap:wrap; }
    .pill { padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10); }
    a { color: #a78bfa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      < h1>Pastebin Lite</h1>
      <p>This is the backend server for Pastebin Lite. Please visit the frontend application to create and view pastes.</p>
    </div>
  </div>
</body>
</html>
      `.trim()
    )
  );
}

app.use(notFoundJson);
app.use(errorHandler);

const port = process.env.PORT || 8080;

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`Backend listening on :${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
