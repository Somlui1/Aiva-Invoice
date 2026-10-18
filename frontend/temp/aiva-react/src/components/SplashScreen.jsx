import React from "react";
import { dispatch } from "../runtime/bridge.js";
export default function SplashScreen() { return (<div id="splash" role="status" aria-label="กำลังเริ่มระบบ AIVA">
<div className="au a1"></div><div className="au a2"></div><div className="au a3"></div>
<div className="card">
<div className="emb"><div className="glow"></div><span className="ring r1"></span><span className="ring r2"></span>
<span className="pt" style={{"left": "6%", "top": "18%", "width": "5px", "height": "5px", "background": "#2dd4c4", "boxShadow": "0 0 8px #2dd4c4"}}></span>
<span className="pt" style={{"right": "5%", "top": "26%", "width": "6px", "height": "6px", "background": "#818cf8", "boxShadow": "0 0 9px #818cf8", "animationDelay": ".6s"}}></span>
<span className="pt" style={{"left": "12%", "bottom": "14%", "width": "4px", "height": "4px", "background": "#60a5fa", "boxShadow": "0 0 7px #60a5fa", "animationDelay": "1.1s"}}></span>
<span className="pt" style={{"right": "10%", "bottom": "10%", "width": "5px", "height": "5px", "background": "#2dd4c4", "boxShadow": "0 0 8px #2dd4c4", "animationDelay": "1.6s"}}></span>
<span className="brand-tile"><span className="logo-mark" role="img" aria-label="AIVA"></span></span></div>
<h1>{"AIVA"}</h1>
<p className="sub">{"Auto Invoice Matching"}</p>
<div className="bd"><span>{"OCR"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg><span>{"Match"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg><span>{"Post to Oracle"}</span></div>
<div className="bar"><b></b></div>
<div className="st" id="spSt">{"Initializing workspace…"}</div>
</div>
</div>); }
