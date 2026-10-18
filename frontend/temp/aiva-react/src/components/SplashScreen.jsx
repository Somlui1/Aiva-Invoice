import React, { useState, useEffect } from "react";

export default function SplashScreen() {
  const [status, setStatus] = useState("Initializing workspace…");
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("Preparing workspace…"), 400);
    const t2 = setTimeout(() => setStatus("Loading queue…"), 800);
    const t3 = setTimeout(() => setStatus("Ready"), 1200);
    const t4 = setTimeout(() => setFading(true), 1500);
    const t5 = setTimeout(() => setHidden(true), 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    setFading(true);
    setTimeout(() => setHidden(true), 300);
  };

  return (
    <div
      id="splash"
      role="status"
      aria-label="กำลังโหลดระบบ AIVA"
      className={fading ? "out" : ""}
      onClick={dismiss}
      style={{ cursor: "pointer", transition: "opacity 0.5s ease, visibility 0.5s ease" }}
      title="คลิกเพื่อข้าม (Skip Splash)"
    >
      <div className="au a1"></div>
      <div className="au a2"></div>
      <div className="au a3"></div>
      <div className="card">
        <div className="emb">
          <div className="glow"></div>
          <span className="ring r1"></span>
          <span className="ring r2"></span>
          <span className="pt" style={{ left: "6%", top: "18%", width: "5px", height: "5px", background: "#2dd4c4", boxShadow: "0 0 8px #2dd4c4" }}></span>
          <span className="pt" style={{ right: "5%", top: "26%", width: "6px", height: "6px", background: "#818cf8", boxShadow: "0 0 9px #818cf8", animationDelay: ".6s" }}></span>
          <span className="pt" style={{ left: "12%", bottom: "14%", width: "4px", height: "4px", background: "#60a5fa", boxShadow: "0 0 7px #60a5fa", animationDelay: "1.1s" }}></span>
          <span className="pt" style={{ right: "10%", bottom: "10%", width: "5px", height: "5px", background: "#2dd4c4", boxShadow: "0 0 8px #2dd4c4", animationDelay: "1.6s" }}></span>
          <span className="brand-tile">
            <span className="logo-mark" role="img" aria-label="AIVA"></span>
          </span>
        </div>
        <h1>AIVA</h1>
        <p className="sub">Auto Invoice Matching</p>
        <div className="bd">
          <span>OCR</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
          <span>Match</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
          <span>Post to Oracle</span>
        </div>
        <div className="bar"><b></b></div>
        <div className="st" id="spSt">{status}</div>
      </div>
    </div>
  );
}
