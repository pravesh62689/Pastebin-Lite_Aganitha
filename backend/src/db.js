const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

async function initDb() {
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS pastes (
      id          TEXT PRIMARY KEY,
      content     TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ NULL,
      max_views   INTEGER NULL CHECK (max_views IS NULL OR max_views >= 1),
      views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0)
    );
  `);

  await p.query(
    `CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes (expires_at);`
  );
}

module.exports = { getPool, initDb };
