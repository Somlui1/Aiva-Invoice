import React from "react";
import { dispatch } from "@/runtime/bridge.js";
export default function AppShell() { return (<div className="shell" id="shell">
<header className="topbar">
<div className="crumb" title="AIVA · Auto Invoice Matching"><i className="d"></i><b>{"AIVA"}</b><svg className="sep" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg><span className="pg-t" id="crumbT"></span></div>
<button type="button" className="cmdk-btn" id="cmdkBtn" aria-label="ค้นหา / คำสั่ง" title="ค้นหา / คำสั่ง (Ctrl K)"><svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"></path></svg><span>{"ค้นหาเอกสาร / คำสั่ง…"}</span><span className="kk"><kbd>{"Ctrl"}</kbd><kbd>{"K"}</kbd></span></button>
<span className="grow"></span>
<span className="env" title="ข้อมูลทั้งหมดเป็นค่าสมมติ"><i></i>{"Mock Prototype"}</span>
<div className="who"><span className="role-pill" id="rolebadge"></span><label className="sr" htmlFor="user">{"สลับผู้ใช้ (mockup)"}</label><select className="user-sel" id="user" onChange={(event) => dispatch(0, event)}></select></div>
</header>
<div className="body">
<aside className="nav" aria-label="เมนูหลัก">
<div className="nav-org"><span className="brand-tile"><span className="logo-mark" role="img" aria-label="AIVA"></span></span><div className="tx"><b>{"AIVA"}</b><span>{"Auto Invoice Matching"}</span></div><button className="ibtn nav-tg" onClick={(event) => dispatch(1, event)} title="ย่อ / ขยายเมนู" aria-label="ย่อ / ขยายเมนู"><svg className="ico" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"></rect><path d="M9 4v16"></path></svg></button></div>
<nav className="nav-list" id="navlist"></nav>
<div className="nav-foot"><span className="lbl grow"><b>{"Standard"}</b>{" v6.10 · schema 1.7"}</span><button className="ibtn" onClick={(event) => dispatch(2, event)} title="ย่อ / ขยาย" aria-label="ย่อ / ขยายเมนู"><svg className="ico" viewBox="0 0 24 24"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"></path></svg></button></div>
</aside>
<main className="main" id="app"></main>
</div>
</div>); }
