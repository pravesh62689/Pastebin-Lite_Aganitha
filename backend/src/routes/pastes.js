const express = require("express");
const { nanoid } = require("nanoid");
const { getPool } = require("../db");
const { getExpiryNowMs } = require("../utils/time");
const {
  isNonEmptyString,
  parseOptionalPositiveInt,
  badRequest,
} = require("../utils/validate");

const router = express.Router();

router.post("/", async (req, res) => {
  const body = req.body || {};
  const content = body.content;
  const ttlSeconds = body.ttl_seconds;
  const maxViews = body.max_views;

  if (!isNonEmptyString(content)) {
    return badRequest(
      res,
      "content is required and must be a non-empty string"
    );
  }

  const ttlParsed = parseOptionalPositiveInt(ttlSeconds);
  if (!ttlParsed.ok) {
    return badRequest(res, "ttl_seconds must be an integer >= 1 when provided");
  }

  const maxViewsParsed = parseOptionalPositiveInt(maxViews);
  if (!maxViewsParsed.ok) {
    return badRequest(res, "max_views must be an integer >= 1 when provided");
  }

  const id = nanoid(10);

  let expiresAt = null;
  if (ttlParsed.value !== null) {
    const now = Date.now();
    expiresAt = new Date(now + ttlParsed.value * 1000);
  }

  const pool = getPool();
  await pool.query(
    `INSERT INTO pastes (id, content, expires_at, max_views) VALUES ($1, $2, $3, $4)`,
    [id, content, expiresAt, maxViewsParsed.value]
  );

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.status(201).json({
    id,
    url: `${baseUrl}/p/${id}`,
  });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  const nowMs = getExpiryNowMs(req);
  const nowIso = new Date(nowMs).toISOString();

  const pool = getPool();

  const result = await pool.query(
    `
    UPDATE pastes
    SET views_count = views_count + 1
    WHERE id = $1
      AND (expires_at IS NULL OR expires_at > $2::timestamptz)
      AND (max_views IS NULL OR views_count < max_views)
    RETURNING content, max_views, views_count, expires_at
    `,
    [id, nowIso]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Paste not found" },
    });
  }

  const row = result.rows[0];
  const remainingViews =
    row.max_views === null
      ? null
      : Math.max(0, row.max_views - row.views_count);

  return res.status(200).json({
    content: row.content,
    remaining_views: remainingViews,
    expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  });
});

module.exports = router;
