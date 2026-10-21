"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DWELL, JR, RO_USERS, RSCN, STEP_MS, TABS, WF, type TabKey } from "../data/explainer";
import { Icon } from "../ui/Icon";
import { FlowScene } from "./FlowScene";
import { QueueScene } from "./QueueScene";
import { RoleScene } from "./RoleScene";
import { RulesScene } from "./RulesScene";
import { StateScene } from "./StateScene";

/**
 * แผงขวาของหน้า Login · “ระบบทำงานอย่างไร” (5 แท็บ)
 * - เล่นอัตโนมัติ: เลื่อนขั้นภายในแท็บตาม STEP_MS แล้วสลับแท็บตาม DWELL (แถบความคืบหน้าใต้ชื่อแท็บ)
 * - หยุดเมื่อ: เมาส์อยู่บนแผง · แท็บเบราว์เซอร์ไม่ active · ผู้ใช้กดเลือกเอง · ผู้ใช้ตั้ง “ลดการเคลื่อนไหว”
 */
export function HowItWorks() {
  const [tab, setTab] = useState<TabKey>("flow");
  const [auto, setAutoState] = useState(true);
  const [step, setStep] = useState(0);
  const [scn, setScn] = useState(0);
  const [st, setSt] = useState({ jr: 0, js: 0 });
  const [ri, setRi] = useState(0);
  const [nonce, setNonce] = useState(0);

  const autoRef = useRef(true);
  const holdRef = useRef(false);
  const tabRef = useRef<TabKey>("flow");
  const elapsed = useRef({ t: 0, s: 0 });
  const bars = useRef<Partial<Record<TabKey, HTMLSpanElement | null>>>({});

  const setAuto = useCallback((v: boolean) => {
    autoRef.current = v;
    setAutoState(v);
  }, []);

  const resetBars = () => Object.values(bars.current).forEach((b) => b && (b.style.width = "0"));

  const goTab = useCallback((k: TabKey) => {
    tabRef.current = k;
    elapsed.current = { t: 0, s: 0 };
    resetBars();
    setTab(k);
    setStep(0);
    setScn(0);
    setSt({ jr: 0, js: 0 });
    setRi(0);
  }, []);

  /** ผู้ใช้กดเอง → หยุดเล่นอัตโนมัติ */
  const manual = useCallback(() => {
    setAuto(false);
    resetBars();
  }, [setAuto]);

  // ผู้ใช้ตั้ง “ลดการเคลื่อนไหว” → ไม่เล่นอัตโนมัติ
  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
  }, [setAuto]);

  // นาฬิกาเล่นอัตโนมัติ (ทุก 100ms)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden || holdRef.current || !autoRef.current) return;
      const t = tabRef.current;
      const e = elapsed.current;

      e.s += 100;
      const per = STEP_MS[t];
      if (per && e.s >= per) {
        e.s = 0;
        if (t === "flow") setStep((s) => (s + 1) % WF.length);
        else if (t === "state")
          setSt(({ jr, js }) => (js + 1 >= JR[jr].n.length ? { jr: (jr + 1) % JR.length, js: 0 } : { jr, js: js + 1 }));
        else if (t === "role") setRi((r) => (r + 1) % RO_USERS.length);
      }

      e.t += 100;
      const bar = bars.current[t];
      if (bar) bar.style.width = Math.min(100, (e.t / DWELL[t]) * 100) + "%";
      if (e.t >= DWELL[t]) {
        const i = TABS.findIndex((x) => x.key === t);
        goTab(TABS[(i + 1) % TABS.length].key);
      }
    }, 100);
    return () => clearInterval(id);
  }, [goTab]);

  const toggleAuto = () => {
    const next = !autoRef.current;
    holdRef.current = false;
    setAuto(next);
    elapsed.current = { t: 0, s: 0 };
    if (next) {
      if (tab === "rules") setNonce((n) => n + 1);
      else if (tab === "flow") setStep((s) => (s + 1) % WF.length);
      else if (tab === "state")
        setSt(({ jr, js }) => (js + 1 >= JR[jr].n.length ? { jr: (jr + 1) % JR.length, js: 0 } : { jr, js: js + 1 }));
      else if (tab === "role") setRi((r) => (r + 1) % RO_USERS.length);
    }
  };

  const scene = (() => {
    switch (tab) {
      case "flow":
        return <FlowScene step={step} onNode={(i) => { manual(); setStep(i); }} />;
      case "rules":
        return (
          <RulesScene
            scn={scn}
            nonce={nonce}
            autoRef={autoRef}
            holdRef={holdRef}
            onPick={(i) => { manual(); setScn(i); setNonce((n) => n + 1); }}
            onNext={() => setScn((s) => (s + 1) % RSCN.length)}
          />
        );
      case "state":
        return <StateScene jr={st.jr} js={st.js} onJourney={(i) => { manual(); setSt({ jr: i, js: 0 }); }} />;
      case "role":
        return <RoleScene ri={ri} onRole={(i) => { manual(); setRi(i); }} />;
      default:
        return <QueueScene />;
    }
  })();

  return (
    <section className="d3-r" id="rp">
      <div className="rp-head">
        <div>
          <h2>ระบบทำงานอย่างไร</h2>
          <div className="cap">
            <Icon name="info" size="sm" />
            จากเอกสารสแกนถึงตั้งหนี้ใน Oracle · คลิกเพื่อดูแต่ละขั้น · ข้อมูลเป็นค่าสมมติ
          </div>
        </div>
        <div className="rp-ctl">
          <button type="button" className="lg-btn sec sm" onClick={toggleAuto}>
            <Icon name={auto ? "pause" : "play"} size="sm" />
            {auto ? "หยุดเล่นอัตโนมัติ" : "เล่นอัตโนมัติ"}
          </button>
        </div>
      </div>

      <div className="rp-tabs" role="tablist" aria-label="หน้าอธิบายระบบ">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`rp-tab ${tab === t.key ? "on" : ""}`}
            onClick={() => {
              manual();
              if (tab !== t.key) goTab(t.key);
            }}
          >
            <Icon name={t.icon} size="sm" />
            {t.label}
            <span className="pgb" ref={(el) => { bars.current[t.key] = el; }} />
          </button>
        ))}
      </div>

      <div
        className="rp-scene"
        onMouseEnter={() => (holdRef.current = true)}
        onMouseLeave={() => (holdRef.current = false)}
      >
        <div className="rp-in" key={tab}>
          {scene}
        </div>
      </div>
    </section>
  );
}
