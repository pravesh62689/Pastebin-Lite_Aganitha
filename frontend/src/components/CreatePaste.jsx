import React, { useMemo, useState } from "react";
import axios from "axios";
import "./CreatePaste.css";

function toIntOrNull(v) {
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return NaN;
  return n;
}

export default function CreatePaste() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [maxViews, setMaxViews] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = useMemo(() => {
    return content.trim().length > 0 && !loading;
  }, [content, loading]);

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);
    setResult(null);

    const ttlVal = toIntOrNull(ttl);
    const maxViewsVal = toIntOrNull(maxViews);

    if (Number.isNaN(ttlVal) || Number.isNaN(maxViewsVal)) {
      setError("TTL and Max Views must be whole numbers.");
      return;
    }

    if (ttlVal !== null && ttlVal < 1) {
      setError("TTL must be at least 1 second.");
      return;
    }

    if (maxViewsVal !== null && maxViewsVal < 1) {
      setError("Max views must be at least 1.");
      return;
    }

    const payload = {
      content,
      ...(ttlVal !== null ? { ttl_seconds: ttlVal } : {}),
      ...(maxViewsVal !== null ? { max_views: maxViewsVal } : {}),
    };

    try {
      setLoading(true);

      const res = await axios.post("/api/pastes", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setResult(res.data);

      setContent("");
      setTtl("");
      setMaxViews("");
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result?.url) return;

    try {
      await navigator.clipboard.writeText(result.url);
    } catch (e) {}
  }

  return (
    <div className="cpWrap">
      <div className="cpHeader">
        <div className="cpHeaderLeft">
          <div className="cpKicker">New paste</div>
          <div className="cpHeading">Paste details</div>
        </div>

        <div className="cpHeaderRight">
          <div className="chip">
            <span className="chipDot" />
            Public link
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Paste content</label>
          <textarea
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste text here..."
            rows={10}
          />
          <div className="hint">
            It will be safely rendered in HTML at <code>/p/&lt;id&gt;</code>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label">TTL (seconds) — optional</label>
            <input
              className="input"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              inputMode="numeric"
              placeholder="e.g., 60"
            />
          </div>

          <div className="field">
            <label className="label">Max views — optional</label>
            <input
              className="input"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              inputMode="numeric"
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={!canSubmit}>
            {loading ? "Creating…" : "Create Paste"}
          </button>

          {error ? (
            <span className="error">{error}</span>
          ) : (
            <span className="smallText">
              Constraints are checked on the backend.
            </span>
          )}
        </div>
      </form>

      {result?.url ? (
        <div className="resultBox">
          <div className="resultTop">
            <div>
              <div className="resultLabel">Shareable link</div>
              <div className="resultSub">
                Open it to view the paste. API views are counted separately.
              </div>
            </div>

            <button className="copyBtn" type="button" onClick={copyLink}>
              Copy
            </button>
          </div>

          <a
            className="resultLink"
            href={result.url}
            target="_blank"
            rel="noreferrer"
          >
            {result.url}
          </a>

          <div className="note">
            Note: viewing the link does <b>not</b> consume views. Only{" "}
            <code>/api/pastes/:id</code> fetches count.
          </div>
        </div>
      ) : null}
    </div>
  );
}
