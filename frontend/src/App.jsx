import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CreatePaste from "./components/CreatePaste.jsx";
import "./App.css";

export default function App() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [serverOk, setServerOk] = useState(null);

  useEffect(() => {
    let alive = true;

    async function getData() {
      try {
        const res = await axios.get("/api/healthz");
        if (!alive) return;
        setServerOk(!!res?.data?.ok);
      } catch (e) {
        if (!alive) return;
        setServerOk(false);
      }
    }

    getData();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="appShell">
      <div className="bgGlow a" />
      <div className="bgGlow b" />

      <div className="appTop">
        <div className="appTopInner">
          <div className="brand">
            <div className="brandIcon">
              <span />
            </div>

            <div>
              <div className="brandTitleRow">
                <h1 className="appTitle">Pastebin Lite</h1>

                <span
                  className={
                    "pill " +
                    (serverOk === false ? "down" : serverOk ? "ok" : "idle")
                  }
                >
                  {serverOk === null
                    ? "checking"
                    : serverOk
                    ? "api ok"
                    : "api down"}
                </span>
              </div>

              <p className="appSub">
                Create a paste, share a link, optionally expire by time or view
                count.
              </p>
            </div>
          </div>

          <div className="topRight">
            <div className="miniCard">
              <div className="miniLabel">View page</div>
              <div className="miniValue">
                <code>/p/&lt;id&gt;</code>
              </div>
            </div>

            <div className="miniCard">
              <div className="miniLabel">Views counted on</div>
              <div className="miniValue">
                <code>/api/pastes/:id</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="appContainer">
        <div className="mainGrid">
          <div className="mainCard">
            <CreatePaste />
          </div>

          <div className="infoPanel">
            <div className="infoCard">
              <div className="infoTitle">How it behaves</div>
              <div className="infoText">
                TTL expires the paste after the given seconds. Max views expires
                it after that many successful API fetches.
              </div>
              <div className="infoText" style={{ marginTop: 10 }}>
                If both are set, the first one that triggers wins.
              </div>
            </div>

            <div className="infoCard">
              <div className="infoTitle">Tiny tip</div>
              <div className="infoText">
                Keep pastes short-ish for sharing. If you paste huge logs, it
                still works but the page can feel heavy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
