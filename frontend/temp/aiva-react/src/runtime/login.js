// Retained runtime module. Dynamic DOM remains owned by this compatibility layer.
export function initializeLogin() {
/* =====================================================================
   v4.20 — Login (แบบ Live Workbench) · Microsoft 365 (OAuth 2.0 / OIDC) + LDAP
   แผงขวา "ระบบทำงานอย่างไร": 5 แท็บ · เคลื่อนไหว · ข้อมูลจาก DOCS / USERS / ROLES ของ portal โดยตรง
   หมายเหตุ production: เบราว์เซอร์ไม่คุย LDAP ตรง · ฟอร์ม POST ไป Portal backend แล้ว backend bind LDAP
   (รหัสผ่านทดสอบ/ผลจำลองในไฟล์นี้ใช้เฉพาะ mockup · NFR-014 ห้ามมี credential ในโค้ด client)
   ===================================================================== */
(function(){
"use strict";
const q=id=>document.getElementById(id);
Object.assign(I,{
 eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
 eyeoff:"M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20",
 server:"M2 3h20v7H2zM2 14h20v7H2zM6 6.5h.01M6 17.5h.01",
 logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
 arrowr:"M5 12h14M12 5l7 7-7 7",
 caps:"M12 3l8 9h-5v5H9v-5H4zM9 21h6",
 users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
 minus:"M5 12h14"});

/* ---------- state ---------- */
const MOCK_PW="1234",MAX_FAIL=5,LOCK_SEC=30;
const LG={m:"m365",sim:"auto",acct:"u1",u:storageGet("aiva.login.u")||"",p:"",
 busy:false,bm:null,fails:0,lock:0,steps:[],res:null,alert:null,tick:null,keep:!!storageGet("aiva.login.u")};
const shell=()=>q("shell");
const sleep=ms=>new Promise(r=>setTimeout(r,RM()?Math.min(ms,120):ms));
const norm=s=>(s||"").trim().toLowerCase();
const findUser=s=>{s=norm(s);if(!s)return null;return USERS.find(u=>u.email===s||u.email.split("@")[0]===s)||null};
const userM365=()=>USERS.find(u=>u.id===LG.acct);
const STEPS={
 m365:[["เปลี่ยนเส้นทางไปที่ Microsoft","Authorization request · OAuth 2.0 / OIDC"],["ยืนยันตัวตนกับ Microsoft","บัญชีที่ทำงานหรือโรงเรียน · MFA ตามนโยบายองค์กร"],["ตรวจกลุ่มสิทธิ์ → บทบาท","EU / ACC / APR / ADM"],["จับคู่ Oracle account และบริษัท","RECEIVER ↔ Company (Tax ID)"]],
 ldap:[["เชื่อมต่อเซิร์ฟเวอร์ LDAP ภายใน","เชื่อมต่อแบบเข้ารหัส (TLS)"],["ตรวจชื่อผู้ใช้และรหัสผ่าน","bind ผ่าน Portal backend"],["ตรวจกลุ่มสิทธิ์ → บทบาท","EU / ACC / APR / ADM"],["จับคู่ Oracle account และบริษัท","RECEIVER ↔ Company (Tax ID)"]]};

/* ---------- ส่วนประกอบร่วม (ฟอร์ม) ---------- */
const MSLOGO='<span class="lg-ms" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
const brand=(sub)=>`<div class="lg-hero"><span class="brand-tile md"><span class="logo-mark" role="img" aria-label="AIVA"></span></span><div><div class="wm wordmark">AIVA</div><div class="tg">Auto Invoice Matching</div><div class="pp2"><em>OCR</em><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg><em>Match</em><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg><em>Post to Oracle</em></div></div></div><div class="lg-theme"><button type="button" class="theme-sw" role="switch" aria-checked="${document.documentElement.getAttribute("data-theme")==="light"}" aria-label="สลับโหมดสว่าง / มืด" title="สลับโหมดสว่าง / มืด"><svg class="ico i-sun" viewBox="0 0 24 24"><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg><svg class="ico i-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><i class="kn"></i></button></div>`;
const btnMs=()=>`<button type="button" class="lg-msbtn go" data-m="m365" onclick="LGX.go('m365')">${MSLOGO}<span class="t">ลงชื่อเข้าใช้ด้วย Microsoft</span><span class="spn" aria-hidden="true"></span></button>
 <div class="lg-msnote">${icon("shield","sm")}บัญชีที่ทำงานหรือโรงเรียน · Single Sign-On · รองรับ MFA</div>`;
function ldapForm(){return `<form class="lg-form" onsubmit="LGX.go('ldap');return false" novalidate>
 <div class="lg-f"><label for="lgU">ชื่อผู้ใช้ <span class="hint">LDAP · เช่น somsak.j</span></label>
  <div class="lg-in" id="wU">${icon("user")}<input id="lgU" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="ชื่อผู้ใช้ภายในบริษัท"></div><div class="lg-err" id="eU" role="alert"></div></div>
 <div class="lg-f"><label for="lgP">รหัสผ่าน</label>
  <div class="lg-in" id="wP">${icon("lock")}<input id="lgP" type="password" autocomplete="current-password" placeholder="รหัสผ่าน"><button type="button" class="lg-eye" aria-label="แสดงรหัสผ่าน" onclick="LGX.eye()">${icon("eye")}</button></div>
  <div class="lg-caps" id="caps" hidden>${icon("caps","sm")}Caps Lock เปิดอยู่</div><div class="lg-err" id="eP" role="alert"></div></div>
 <div class="lg-row"><label class="lg-chk"><input type="checkbox" id="lgKeep" ${LG.keep?"checked":""}>จำชื่อผู้ใช้ในเครื่องนี้</label><button type="button" class="lg-link" onclick="LGX.forgot()">ลืมรหัสผ่าน?</button></div>
 <button type="submit" class="lg-btn primary block go" data-m="ldap"><span class="t">เข้าสู่ระบบ</span>${icon("arrowr")}<span class="spn" aria-hidden="true"></span></button></form>`}
const alertBox=()=>`<div class="lg-alert" id="lgAlert" role="alert" aria-live="assertive" hidden></div>`;
const foot=()=>`<div class="lg-foot"><span>© 2026 AAPICO</span><span>AIVA v5.2 · Auto Invoice Matching · SRS v1.1</span><span>Mock Prototype · ข้อมูลทั้งหมดเป็นค่าสมมติ</span><button class="lg-link" onclick="LGX.help()">ติดต่อ IT Support</button></div>`;
const methodSeg=()=>`<div class="seg lg-seg" role="tablist" aria-label="วิธีเข้าสู่ระบบ">
 <button role="tab" aria-selected="${LG.m==="m365"}" class="${LG.m==="m365"?"on":""}" onclick="LGX.method('m365')">${MSLOGO}Microsoft 365 <kbd>Alt+1</kbd></button>
 <button role="tab" aria-selected="${LG.m==="ldap"}" class="${LG.m==="ldap"?"on":""}" onclick="LGX.method('ldap')">${icon("server","sm")}LDAP ภายใน <kbd>Alt+2</kbd></button></div>`;
const methodPanel=()=>LG.m==="m365"?`<div>${btnMs()}</div>`:ldapForm();
const lpHTML=()=>`${brand()}<div class="mid"><div><h1 class="lg-h1">เข้าสู่ระบบ</h1><p class="lg-sub">เลือกวิธีที่องค์กรกำหนดให้คุณ</p></div>${methodSeg()}<div id="mp">${methodPanel()}</div>${alertBox()}</div>${foot()}`;

/* =====================================================================
   แผงขวา · ระบบทำงานอย่างไร (5 แท็บ)
   ===================================================================== */
const CK='<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const TABS=[["flow","กระบวนการทั้งหมด","git"],["rules","9 กฎการตรวจ","shield"],["state","สถานะเอกสาร","layers"],["role","สิทธิ์และบทบาท","users"],["queue","หน้าคิวตรวจสอบ","table"]];
const DWELL={flow:20000,rules:25000,state:17000,role:14500,queue:8000};
const RP={tab:"flow",auto:true,hold:false,tEl:0,sEl:0,step:0,scn:0,jr:0,js:0,ri:0,timer:null,vt:null,rt:null,rts:[]};
const chipV=id=>`<span class="rchip">${id}</span>`;
const chipE=c=>`<span class="code ${SEV[c]}">${c}</span>`;

/* ---------- แท็บ 1 · ภาพประกอบแต่ละขั้น ---------- */
const vis1=()=>`<div class="vis v1"><div class="pp p1"><span>ใบแจ้งหนี้</span><i class="l"></i><i class="s"></i><i class="m"></i><i class="l"></i></div><div class="pp p2 b"><span>ใบส่งของ</span><i class="m"></i><i class="l"></i><i class="s"></i><i class="m"></i></div><div class="pp p3 c"><span>เงื่อนไข</span><i class="s"></i><i class="l"></i><i class="m"></i></div><span class="fmt" style="left:52px">สแกน</span><span class="fmt" style="left:118px">PDF</span></div>`;
const vis2=()=>`<div class="vis v2"><div class="doc"><i class="hot"></i><i></i><i></i><i class="hot"></i><i></i><i class="hot"></i><b class="laser"></b></div><span class="tgp t1">เลขที่ใบแจ้งหนี้</span><span class="tgp t2">Tax ID ผู้ขาย</span><span class="tgp t3">ยอดรวม · VAT</span></div>`;
const vis3=()=>`<div class="vis v3"><span class="ring"></span><svg class="cy" viewBox="0 0 44 58"><path d="M1 9V49A21 7 0 0 0 43 49V9Z" fill="#295F98"/><path d="M1 22A21 7 0 0 0 43 22M1 35A21 7 0 0 0 43 35" fill="none" stroke="rgba(255,255,255,.32)"/><ellipse cx="22" cy="9" rx="21" ry="7" fill="#3E78B5"/></svg><span class="key">ค้นด้วย Tax ID + Invoice</span><div class="rec"><b>RCV530340001</b><span>Receiver · ORG_ID → บริษัท</span></div></div>`;
const vis4=()=>`<div class="vis v4"><div class="cd a"><h6>ใบแจ้งหนี้</h6><p><span>จำนวน</span><span>3</span></p><p><span>ราคา</span><span>130.00</span></p><p><span>ยอด</span><span>390.00</span></p></div><div class="mk"><i>${CK}</i><i>${CK}</i><i>${CK}</i></div><div class="cd b"><h6>ใบรับ (Oracle)</h6><p><span>จำนวน</span><span>3</span></p><p><span>ราคา</span><span>130.00</span></p><p><span>ยอด</span><span>390.00</span></p></div><div class="sum">บรรทัดตรง · ยอดรวมเท่ากัน</div></div>`;
const vis5=()=>`<div class="vis v5"><div class="bg" style="left:6px;top:6px;gap:6px">${badge("Auto-pass")}${badge("Review")}</div><div class="bg" style="left:6px;top:34px;gap:6px">${badge("Hold")}${badge("Manual Review")}</div><span class="ro e">→ ผู้ใช้งานแก้</span><span class="ro a">→ ฝ่ายบัญชีตัดสิน</span><div class="dr">Portal ตรวจซ้ำ · DR-01…07</div></div>`;
const vis6=()=>`<div class="vis v6"><div class="fd"></div><div class="ck">${CK}</div><div class="st s1">${badge("Confirmed")}</div><div class="st s2">${badge("Sent")}</div><div class="st s3">${badge("Posted")}</div></div>`;
const WF=[
 {t:"สแกนเข้า DMS",who:"ผู้สแกน (End User)",vis:vis1,
  do:["ผู้สแกนอัปโหลดใบแจ้งหนี้ (ไฟล์สแกนหรือ PDF) เข้า DMS","DMS เก็บรหัสเอกสาร จำนวนหน้า ผู้อัปโหลด และเวลาเข้าระบบ","เอกสารเข้าคิวให้ AIVA ตรวจโดยอัตโนมัติ"],
  inp:"ไฟล์ใบแจ้งหนี้ (ต้นฉบับ + สำเนา)",out:"dms_doc_id · uploaded_by · uploaded_at",chips:[],
  note:"Portal ไม่เก็บ URL ของ DMS · ออกลิงก์ชั่วคราว 10 นาที พร้อมลายน้ำ เมื่อมีคนเปิดดู"},
 {t:"AIVA อ่านและตรวจเอกสาร",who:"AIVA Engine · STEP 1",vis:vis2,
  do:["อ่านฟิลด์จากเอกสาร เช่น เลขที่ใบแจ้งหนี้ Tax ID ผู้ขาย/ลูกค้า PO และยอดรวม","ตรวจกฎที่ไม่ต้องใช้ Oracle: ฟิลด์บังคับ · เลขคณิตรายบรรทัด · ยอดรวมในใบแจ้งหนี้ · ลายเซ็น","ถ้าเลขคณิตผิด (E02, High) → หยุดทันที ไม่เรียก Oracle"],
  inp:"ภาพ / PDF จาก DMS",out:"ค่าที่อ่านได้ + ผลกฎ STEP 1",chips:[chipV("V-01"),chipV("V-02"),chipV("V-03"),chipV("V-06"),chipE("E01"),chipE("E02"),chipE("E08")],
  note:"อ่านเลขที่ใบแจ้งหนี้ไม่ได้ → ค้น Oracle ไม่ได้ → Manual Review (ไม่ทราบเจ้าของ)"},
 {t:"ค้นใบรับใน Oracle",who:"AIVA + Oracle · STEP 2",vis:vis3,
  do:["ค้นใบรับด้วย Tax ID ผู้ขาย + เลขที่ใบแจ้งหนี้ (PO / Release แสดงผลเท่านั้น ไม่ใช้ตัดสิน)","ได้ receive_id (เลขใบรับ) · Receiver (เจ้าของรายการ) · ORG_ID → บริษัท","ตรวจว่าลูกค้าบนใบแจ้งหนี้ตรงกับตารางบริษัท (Tax ID / ชื่อ / ที่อยู่)"],
  inp:"Tax ID ผู้ขาย + เลขที่ใบแจ้งหนี้",out:"receive_id · Receiver · ORG_ID",chips:[chipV("V-04"),chipV("V-05"),chipE("E05"),chipE("E06"),chipE("E07")],
  note:"ไม่พบใบรับ (E05) → Hold ไม่มี Receiver · ฝ่ายบัญชีทำได้เฉพาะ Reject"},
 {t:"เทียบกับใบรับ",who:"AIVA · STEP 3",vis:vis4,
  do:["จับคู่รายบรรทัดกับใบรับและเทียบราคา","เทียบจำนวนรายบรรทัด และยอดรวมทั้งใบกับใบรับ","ผลต่างในกรอบ → Medium / Low · ผลต่างเกินกรอบ → High"],
  inp:"รายการในใบแจ้งหนี้ + บรรทัดใบรับ",out:"ผลกฎ V-07…V-09 + รหัสข้อยกเว้น",chips:[chipV("V-07"),chipV("V-08"),chipV("V-09"),chipE("E03"),chipE("E09"),chipE("E10"),chipE("E14"),chipE("E15")],
  note:"ไม่มีการตรวจซ้ำ (Rerun) · ผลใหม่ได้จากการอัปโหลดเอกสารฉบับใหม่เท่านั้น"},
 {t:"ตัดสินผลและแจกงาน",who:"AIVA + Portal",vis:vis5,
  do:["AIVA เสนอผล: Auto-pass · Review · Hold · Manual Review","Portal ตรวจเอกสารซ้ำและกำหนดสถานะ (Duplicate / Superseded ตามกติกา DR-01…07)","รหัสของผู้ใช้งานขึ้นคิว “รอฉันแก้ไข” · รหัสของฝ่ายบัญชีให้ฝ่ายบัญชีตัดสิน"],
  inp:"ผลกฎ 9 ข้อ + รหัสข้อยกเว้น",out:"สถานะ + ผู้รับผิดชอบ",chips:[badge("Auto-pass"),badge("Review"),badge("Hold"),badge("Manual Review")],
  note:"ไม่มีการแจ้งเตือนผู้ใช้งาน · ผู้ใช้งานต้องเข้ามาตรวจสถานะเองในหน้า “งานของฉัน”"},
 {t:"ส่งเข้า AP Interface",who:"ฝ่ายบัญชี + Oracle",vis:vis6,fin:true,
  do:["ฝ่ายบัญชี Confirm → Confirmed (ไม่ส่งจากหน้ารายละเอียด)","หัวหน้าฝ่ายบัญชีส่งเป็น Batch: ตรวจซ้ำ → ผู้ยืนยัน ≠ ผู้ส่ง → วงเงิน → PIN","Oracle Import → Posted หรือ Import Failed (ส่งกลับ Review ได้)"],
  inp:"รายการ Confirmed",out:"Batch ID · Oracle Invoice ID",chips:[badge("Confirmed"),badge("Sent"),badge("Posted"),badge("Import Failed")],
  note:"ทุกการเข้าถึง การตัดสิน และการส่ง ถูกบันทึกใน Audit ที่แก้ไขไม่ได้"}];
const WFPOS=[[1,1],[1,3],[1,5],[3,5],[3,3],[3,1]];
function flowScene(){
 const st=WF.map((s,i)=>`<div class="wf-step ${s.fin?"fin":""}" data-i="${i}" style="grid-row:${WFPOS[i][0]};grid-column:${WFPOS[i][1]}" tabindex="0" role="button" aria-label="ขั้นที่ ${i+1} ${s.t}" onclick="LGX.node(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();LGX.node(${i})}"><div class="wf-lbl" title="${s.t}"><b>${i+1}.</b>${s.t}</div><div class="wf-node">${s.vis()}</div></div>`).join("");
 const E=[[1,2,"h",""],[1,4,"h",""],[2,5,"v",""],[3,4,"h rev",""],[3,2,"h rev","f"]];
 const ed=E.map((e,k)=>`<div class="wf-e ${e[2]} ${e[3]}" data-e="${k+1}" style="grid-row:${e[0]};grid-column:${e[1]}" aria-hidden="true"><div class="ln"><i></i><i></i><i></i></div></div>`).join("");
 return `<div class="wf" id="wf">${st}${ed}</div><div class="wf-det" id="wfDet"></div>`}
function flowSet(i){RP.step=i;
 document.querySelectorAll(".wf-step").forEach(el=>{const k=+el.dataset.i;el.classList.toggle("on",k===i);el.classList.toggle("done",k<i)});
 document.querySelectorAll(".wf-e").forEach(el=>{const k=+el.dataset.e;el.classList.toggle("on",k===i);el.classList.toggle("done",k<i)});
 const s=WF[i],d=q("wfDet");if(!d)return;d.classList.remove("sw");void d.offsetWidth;d.classList.add("sw");
 d.innerHTML=`<div class="dhd"><span class="rchip" style="font-size:11px">ขั้นที่ ${i+1}/6</span><h3>${s.t}</h3><span class="who">${icon("user","sm")}${s.who}</span></div>
 <div class="gr"><div><ul>${s.do.map(x=>`<li>${icon("checkc","sm")}<span>${x}</span></li>`).join("")}</ul>${s.chips.length?`<div class="chips">${s.chips.join("")}</div>`:""}</div>
 <div class="io"><div><b>ข้อมูลเข้า</b>${s.inp}</div><div><b>ข้อมูลออก</b>${s.out}</div></div></div>
 <div class="nt">${icon("info","sm")}<span>${s.note}</span></div>`;
 clearInterval(RP.vt);RP.vt=null;
 if(i===4){let k=0;const bs=[...document.querySelectorAll(".v5 .badge")];RP.vt=setInterval(()=>{bs.forEach((b,j)=>b.classList.toggle("h",j===k%4));k++},650)}}

/* ---------- แท็บ 2 · 9 กฎ ---------- */
const RSEQ=["V-01","V-02","V-03","V-06","V-04","V-05","V-07","V-08","V-09"];
const RNAME={};RULES.forEach(r=>RNAME[r.slice(0,4)]=r.slice(5));
const SK=(by)=>["skip",by];
const RSCN=[
 {l:"ผ่านทั้งหมด",rs:{},st:"Auto-pass",ow:["ฝ่ายบัญชี"],
  tx:"AIVA ไม่พบรหัสข้อผิดพลาด (หรือมีเฉพาะ E04 Low) → Auto-pass · ฝ่ายบัญชี Confirm ได้ทันที"},
 {l:"พบ Medium · หน่วยนับไม่ตรง",rs:{"V-07":["med","E10"]},st:"Review",ow:["ผู้ใช้งานแก้"],
  tx:"รหัส E10 เป็นของผู้ใช้งาน → เอกสารขึ้นคิว “รอฉันแก้ไข” ของ Receiver · ฝ่ายบัญชี Confirm ไม่ได้จนกว่าผู้ใช้งานจะอัปโหลดเอกสารฉบับแก้ไข"},
 {l:"พบ High · เลขคณิตผิด",rs:{"V-02":["high","E02"],"V-04":SK("V-02"),"V-05":SK("V-02"),"V-07":SK("V-02"),"V-08":SK("V-02"),"V-09":SK("V-02")},st:"Hold",ow:["ไม่มี Receiver","Reject เท่านั้น"],
  tx:"V-02 พบ High → หยุดทันที ไม่เรียก Oracle จึงไม่มีใบรับและไม่มี Receiver · ผู้ใช้งานมองไม่เห็น · ฝ่ายบัญชีเห็นตาม Tax ID ลูกค้า ทำได้เฉพาะ Reject แล้วติดต่อผู้สแกนนอกระบบ"},
 {l:"อ่านเลขที่ใบแจ้งหนี้ไม่ได้",rs:{"V-01":["mr","MR"],"V-04":SK("IDENTITY"),"V-05":SK("IDENTITY"),"V-07":SK("IDENTITY"),"V-08":SK("IDENTITY"),"V-09":SK("IDENTITY")},st:"Manual Review",ow:["ไม่ทราบเจ้าของ","Reject ได้ · Confirm ไม่ได้"],
  tx:"OCR อ่านเลขที่ใบแจ้งหนี้ไม่ได้ → ค้น Oracle ไม่ได้ จึงไม่มี receive_id และ Receiver · ขึ้น Manual Review (ไม่ทราบเจ้าของ) · ฝ่ายบัญชี Reject แล้วให้ผู้สแกนอัปโหลดใหม่"}];
function rulesScene(){
 const col=(n,t,ids)=>`<div class="rl-col"><h5>STEP ${n}<span>${t}</span></h5>${ids.map(id=>`<div class="rrow" data-r="${id}"><span class="d"></span><div><b>${id}</b><span class="n">${RNAME[id]}</span></div><em></em></div>`).join("")}</div>`;
 return `<div class="rl-scn"><span class="lab">ลองดูผลจาก</span>${RSCN.map((s,i)=>`<button class="chip ${i===RP.scn?"on":""}" data-s="${i}" aria-pressed="${i===RP.scn}" onclick="LGX.scn(${i})">${s.l}</button>`).join("")}</div>
 <div class="rl-cols">${col(1,"สกัดและตรวจเอกสาร",["V-01","V-02","V-03","V-06"])}${col(2,"ค้นใบรับและลูกค้า",["V-04","V-05"])}${col(3,"เทียบกับใบรับ",["V-07","V-08","V-09"])}</div>
 <div class="rl-res" id="rlRes"></div>`}
const rlIdle=()=>`<div><div class="k">ผลตัดสิน</div><span class="badge st-Manual" style="opacity:.35"><i></i>กำลังตรวจ…</span></div><div class="tx" style="color:var(--s-400)">AIVA กำลังตรวจทีละกฎ…</div>`;
function rulesPlay(){
 rpClear();const sc=RSCN[RP.scn],T=460;
 document.querySelectorAll(".rl-scn .chip").forEach(b=>{const on=+b.dataset.s===RP.scn;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
 document.querySelectorAll(".rrow").forEach(e=>{e.className="rrow";e.querySelector(".d").innerHTML="";e.querySelector("em").textContent=""});
 const res=q("rlRes");if(res){res.classList.remove("sw");res.innerHTML=rlIdle()}
 const later=(f,ms)=>RP.rts.push(setTimeout(f,ms));
 RSEQ.forEach((id,i)=>{const el=document.querySelector(`.rrow[data-r="${id}"]`),r=sc.rs[id]||["pass"];
  later(()=>{if(el)el.className="rrow run"},i*T);
  later(()=>{if(!el)return;const k=r[0],d=el.querySelector(".d"),em=el.querySelector("em");
   el.className="rrow "+k+(k==="med"||k==="high"?" hit":"");
   d.innerHTML=k==="pass"?icon("check"):k==="skip"?icon("minus"):k==="mr"?icon("alert"):icon(k==="high"?"x":"alert");
   em.textContent=k==="pass"?"ผ่าน":k==="skip"?"ข้าม":r[1];if(k==="skip")el.title="ไม่ได้ประเมิน · หยุดที่ "+r[1]},i*T+330)});
 later(()=>{const res=q("rlRes");if(!res)return;res.classList.remove("sw");void res.offsetWidth;res.classList.add("sw");
  res.innerHTML=`<div><div class="k">ผลตัดสิน</div>${badge(sc.st)}</div><div><div class="tx">${sc.tx}</div><div class="ow">${sc.ow.map(o=>`<span class="pill">${icon("user","sm")}${o}</span>`).join("")}</div></div>`;
  if(RP.auto)RP.rt=setTimeout(waitNext,3400)},RSEQ.length*T+200);
 function waitNext(){if(RP.tab!=="rules"||!RP.auto)return;if(RP.hold||document.hidden){RP.rt=setTimeout(waitNext,900);return}RP.scn=(RP.scn+1)%RSCN.length;rulesPlay()}}

/* ---------- แท็บ 3 · สถานะเอกสาร ---------- */
const JR=[
 {l:"ผ่านปกติ → ตั้งหนี้",n:[
  ["AIVA","s","Auto-pass","ไม่มีรหัส High / Medium","AIVA ตรวจครบ 9 กฎแล้วไม่พบรหัสข้อผิดพลาด (หรือมีเฉพาะ E04 Low) → Portal รับเป็น Auto-pass"],
  ["ฝ่ายบัญชี","a","Confirm","ACC / APR","เจ้าหน้าที่หรือหัวหน้าฝ่ายบัญชีกด Confirm · เอกสารย้ายไปหน้า AP Interface (ไม่ส่งจากหน้ารายละเอียด)"],
  ["Portal","s","Confirmed","รอส่ง Batch","สถานะ Confirmed รอหัวหน้าฝ่ายบัญชีส่ง · Unconfirm กลับเป็น Review ได้ก่อนส่ง"],
  ["หัวหน้าฝ่ายบัญชี","a","ส่ง Batch","PIN + ตรวจก่อนส่ง","Portal ตรวจซ้ำ (เอกสารซ้ำ) → ผู้ยืนยัน ≠ ผู้ส่ง → วงเงินต่อฉบับ → ยืนยัน PIN พร้อมรับรองความรับผิดชอบ"],
  ["Portal","s","Sent","รอผล Import","บันทึก Batch ID ผู้ส่ง เวลา และรายการที่ส่ง · รอผลจาก Oracle AP Interface"],
  ["Oracle","s","Posted","Invoice ID AP-…","Oracle Import สำเร็จ → Posted เป็นสถานะปิด"]]},
 {l:"ผู้ใช้งานต้องแก้ไข",n:[
  ["AIVA","s","Review","E10 หน่วยนับไม่ตรง","รหัส E10 เป็นของผู้ใช้งาน → เอกสารขึ้นคิว “รอฉันแก้ไข” ของ Receiver พร้อมอายุเอกสาร (ไม่มีการแจ้งเตือน)"],
  ["ฝ่ายบัญชี","a","Confirm ถูกล็อก","รอผู้ใช้งาน","ฝ่ายบัญชี Confirm ไม่ได้จนกว่ารหัสของผู้ใช้งานจะหมด · ไม่มีปุ่มส่งกลับ ไม่มีสั่งตรวจซ้ำ"],
  ["End User","a","อัปโหลดเอกสารใหม่","แก้ที่ต้นทางแล้วสแกนใหม่","ผู้ใช้งานแก้ที่ต้นทาง (เช่น แก้ใบรับใน Oracle) แล้วอัปโหลดฉบับใหม่ · AIVA ตรวจเป็นเอกสารใหม่"],
  ["Portal","s","Superseded","ฉบับเดิม · DR-01","ฉบับใหม่ดีกว่าหรือเท่าเดิม → ฉบับเดิมเป็น Superseded (DR-01 / DR-02) และบันทึกลิงก์ทั้งสองฉบับ"],
  ["AIVA","s","Auto-pass","ฉบับใหม่","ฉบับใหม่ได้สถานะตามผลตรวจ — ตัวอย่างนี้ผ่านทุกกฎ"],
  ["ฝ่ายบัญชี","s","Confirmed","→ AP Interface","ฝ่ายบัญชี Confirm แล้วไปต่อที่หน้า AP Interface เหมือนเส้นทางปกติ"]]},
 {l:"เอกสารซ้ำ",n:[
  ["Portal","s","Confirmed","ฉบับเดิม","ฉบับเดิมถูก Confirm ไปแล้ว"],
  ["ผู้สแกน","a","สแกนซ้ำ","เลขที่ใบแจ้งหนี้เดิม","มีการสแกนใบแจ้งหนี้ใบเดิมเข้ามาอีกครั้ง"],
  ["Portal","s","Duplicate","ฉบับใหม่ · DR-04","ฉบับเดิมเป็น Confirmed / Sent / Posted / Import Failed → ฉบับใหม่เป็น Duplicate ทันที ฉบับเดิมคงสถานะ"],
  ["ฝ่ายบัญชี","a","ตรวจและตัดสิน","เปิดดูทั้งสองฉบับ","ห้ามส่งเข้า AP Interface จนกว่าฝ่ายบัญชีจะตัดสิน"],
  ["หัวหน้าฝ่ายบัญชี","s","Confirmed","ไม่ซ้ำ · บันทึก override","เฉพาะหัวหน้าฝ่ายบัญชียืนยันว่าไม่ซ้ำได้ พร้อมเหตุผลและบันทึก override"],
  ["ฝ่ายบัญชี","s","Rejected","หากซ้ำจริง","อีกทางเลือก: ถ้าซ้ำจริง ACC / APR Reject ได้ → Rejected เป็นสถานะปิด"]]},
 {l:"Import ไม่ผ่าน",n:[
  ["Portal","s","Sent","ส่ง Batch แล้ว","ส่ง Batch เข้า AP Interface แล้ว รอผลนำเข้า"],
  ["Oracle","s","Import Failed","เช่น Supplier site ถูกปิด","Oracle ปฏิเสธการนำเข้า พร้อมข้อความผิดพลาดจาก AP_INVOICES_INTERFACE"],
  ["หัวหน้าฝ่ายบัญชี","a","Return → Review","ต้องมีเหตุผลและหมายเหตุ","หัวหน้าฝ่ายบัญชีส่งกลับคิวตรวจสอบ พร้อมเหตุผลและหมายเหตุที่จำเป็น"],
  ["Portal","s","Review","แก้ข้อมูลผู้ขายใน Oracle","เอกสารกลับมาอยู่ในคิวตรวจสอบ เพื่อแก้ข้อมูลต้นทางแล้วดำเนินการต่อ"],
  ["ฝ่ายบัญชี","s","Confirmed","ยืนยันใหม่","ฝ่ายบัญชี Confirm อีกครั้ง"],
  ["Oracle","s","Posted","Import สำเร็จ","ส่ง Batch ใหม่และนำเข้าสำเร็จ → Posted"]]}];
function stateScene(){
 const lane=(h,a)=>`<div><h6>${h}</h6><div class="bs">${a.map(badge).join("")}</div></div>`;
 return `<div class="st-jr"><span class="lab">เส้นทาง</span>${JR.map((j,i)=>`<button class="chip ${i===RP.jr?"on":""}" data-j="${i}" aria-pressed="${i===RP.jr}" onclick="LGX.jr(${i})">${j.l}</button>`).join("")}</div>
 <div class="st-strip" id="stStrip"></div><div class="st-cap" id="stCap"></div>
 <div class="st-lane">${lane("ผลตรวจ (Validation)",["Auto-pass","Review","Hold","Manual Review","Rejected"])}${lane("Portal Control",["Duplicate","Superseded"])}${lane("AP Interface",["Confirmed","Sent","Posted","Import Failed"])}</div>
 <div class="st-rk">${icon("info","sm")}ลำดับเทียบเมื่อพบเอกสารซ้ำ: Auto-pass &gt; Review &gt; Hold &gt; Manual Review · สถานะเดียวกัน = เท่าเดิม</div>`}
function stBuild(){const j=JR[RP.jr];
 document.querySelectorAll(".st-jr .chip").forEach(b=>{const on=+b.dataset.j===RP.jr;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
 q("stStrip").innerHTML=j.n.map((s,i)=>`${i?`<span class="st-c" data-c="${i}"></span>`:""}<div class="st-n" data-n="${i}"><span class="who">${s[0]}</span>${s[1]==="s"?badge(s[2]):`<span class="act">${s[2]}</span>`}<span class="sub">${s[3]}</span></div>`).join("");
 stSet(RP.js)}
function stSet(k){RP.js=k;const j=JR[RP.jr];
 document.querySelectorAll(".st-n").forEach(el=>{const i=+el.dataset.n;el.classList.toggle("on",i===k);el.classList.toggle("done",i<k)});
 document.querySelectorAll(".st-c").forEach(el=>{const i=+el.dataset.c;el.classList.toggle("on",i===k);el.classList.toggle("done",i<k)});
 const c=q("stCap");if(!c)return;c.classList.remove("sw");void c.offsetWidth;c.classList.add("sw");
 c.innerHTML=`<span class="n">${k+1}</span><div><b>${j.n[k][0]} · ${j.n[k][2]}</b><p>${j.n[k][4]}</p></div>`;
 const on=document.querySelector(".st-n.on");if(on&&on.scrollIntoView&&!RM())on.parentNode.scrollTo({left:on.offsetLeft-60,behavior:"smooth"})}

/* ---------- แท็บ 4 · สิทธิ์และบทบาท ---------- */
const RO_U=[["u1","EU"],["u4","ACC"],["u6","APR"],["u7","ADM"]];
const RO_D=["DMS-2026-000123","DMS-2026-000203","DMS-2026-000207","DMS-2026-000206","DMS-2026-000204","DMS-2026-000152","DMS-2026-000213"];
const RO_NOTE={EU:"เห็นเฉพาะใบรับที่ Receiver ตรงกับ Oracle account ของคุณ และอยู่ในบริษัทที่ได้รับมอบหมาย · ไม่เห็นเอกสารที่ไม่มี Receiver · ตรวจสถานะเองและอัปโหลดเอกสารใหม่ได้เท่านั้น",
 ACC:"เห็นทุกเอกสารของบริษัทที่ได้รับมอบหมาย (ไม่มีใบรับ: ใช้บริษัทจาก Tax ID ลูกค้า) · Confirm / Review / Hold / Reject · ดู AP Interface ได้อย่างเดียว · ตัดสิน Manual Review และ Duplicate ไม่ได้",
 APR:"สิทธิ์ของเจ้าหน้าที่บัญชี + ตัดสิน Manual Review · ยืนยันว่าไม่ซ้ำ · Unconfirm · ส่ง Batch เข้า AP (ผู้ยืนยัน ≠ ผู้ส่ง · วงเงินต่อฉบับ) · ดู Audit",
 ADM:"จัดการการผูกบัญชีและสิทธิ์ · ดู Audit · ไม่เห็นเนื้อหาเอกสาร (บันทึกทุกความพยายามที่ถูกปฏิเสธ)"};
function whyShort(w){return !w?"":/นอกบริษัท/.test(w)?"นอกบริษัทที่รับผิดชอบ":/ยังไม่มี Receiver/.test(w)?"ไม่มี Receiver":/ไม่ได้เป็น Receiver/.test(w)?"ไม่ใช่ Receiver ของคุณ":/ไม่เข้าถึง/.test(w)?"ไม่เห็นเนื้อหาเอกสาร":w}
function roleScene(){
 const docs=RO_D.map(id=>DOCS.find(d=>d.doc===id)).filter(Boolean);
 const rows=docs.map(d=>`<div class="ro-r" data-d="${d.doc}"><b>${d.inv}</b><span class="co">${d.company}</span><div class="rw"><span class="rcv">${d.receiver||'<i style="color:var(--org);font-style:normal;font-weight:700">ไม่มี Receiver</i>'}</span><span class="why"></span></div>${badge(d.status)}</div>`).join("");
 return `<div class="ro-sel">${RO_U.map(([id,r],i)=>{const u=USERS.find(x=>x.id===id);return `<button class="ro-b ${i===RP.ri?"on":""}" data-i="${i}" aria-pressed="${i===RP.ri}" onclick="LGX.role(${i})"><b>${ROLES[r].n}</b><span>${u.n} · ${u.co.join(", ")||"—"}</span></button>`}).join("")}</div>
 <div class="ro-grid"><div><div class="ro-h"><h5>เอกสารที่ “เห็น” ในคิว</h5><span>เห็น <b id="roCnt">0</b> / ${docs.length}</span></div><div id="roRows">${rows}</div></div>
 <div><div class="ro-h"><h5>สิทธิ์ที่ทำได้</h5><span id="roPc"></span></div><div class="ro-perm" id="roPerm">${Object.keys(PERM).map(k=>`<span class="ro-p" data-p="${k}">${PERM[k]}</span>`).join("")}</div></div></div>
 <div class="ro-nt" id="roNt"></div>`}
function roSet(i){RP.ri=i;const [uid,role]=RO_U[i],u=USERS.find(x=>x.id===uid);let n=0;
 document.querySelectorAll(".ro-b").forEach(b=>{const on=+b.dataset.i===i;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
 document.querySelectorAll(".ro-r").forEach(el=>{const d=DOCS.find(x=>x.doc===el.dataset.d),r=scopeCheck(d,u);if(r.ok)n++;
  el.classList.toggle("hid",!r.ok);el.classList.toggle("show",r.ok);el.querySelector(".why").textContent=r.ok?"":whyShort(r.why)});
 q("roCnt").textContent=n;
 let pc=0;document.querySelectorAll(".ro-p").forEach(el=>{const on=ROLES[role].p.includes(el.dataset.p);if(on)pc++;el.classList.toggle("on",on)});
 q("roPc").textContent=pc+" / "+Object.keys(PERM).length+" สิทธิ์";
 const nt=q("roNt");nt.classList.remove("sw");void nt.offsetWidth;nt.classList.add("sw");
 nt.innerHTML=`${icon(role==="ADM"?"lock":"shield")}<span>${RO_NOTE[role]}${role==="APR"?" · ปัจจุบัน ≤ "+B(ROLES.APR.postMax)+" ฿":""}</span>`}

/* ---------- แท็บ 5 · หน้าคิว ---------- */
const SAMPLE=[["IV6909245","ABC Supply Co., Ltd.","Auto-pass",[],"3,113.70","AH"],["TP-2610-0045","Thai Packaging Co., Ltd.","Hold",["E03"],"11,235.00","AH"],["PT-2610-0071","Precision Tools (Thailand)","Review",["E08"],"8,346.00","AHT"],["MR-2610-0230","Mega Rubber Co., Ltd.","Hold",["E06"],"9,630.00","AH"],["SA-2610-0502","Siam Auto Parts Co., Ltd.","Review",["E07"],"7,704.00","AM"],["AT-2610-0004","Asia Tech Service Co., Ltd.","Manual Review",[],"19,795.00","?"]];
const KPIS=[["ทั้งหมด",null,"layers","var(--t-blue)","var(--t-blue-bg)"],["Auto-pass","Auto-pass","checkc","var(--t-ok)","var(--t-ok-bg)"],["Review","Review","clock","var(--t-warn)","var(--t-warn-bg)"],["Hold","Hold","pause","var(--t-err)","var(--t-err-bg)"],["Manual Review","Manual Review","alert","var(--t-vio)","var(--t-vio-bg)"],["ซ้ำ (Portal)","Duplicate","copy","var(--t-org)","var(--t-org-bg)"]];
function queueScene(){return `<div class="rq"><div class="tb"><i></i><i></i><i></i><b>AIVA · คิวตรวจสอบ</b><span class="grow"></span><span class="pill">ตัวอย่าง</span></div>
 <div class="kp">${KPIS.map(k=>`<div class="kpi"><span class="k-l">${k[0]}</span><span class="k-v" data-n="${k[1]?DOCS.filter(d=>d.status===k[1]).length:DOCS.length}">0</span><span class="k-i" style="background:${k[4]};color:${k[3]}">${icon(k[2])}</span></div>`).join("")}</div>
 <div class="tbl-wrap"><table class="t"><thead><tr><th>เลขที่ใบแจ้งหนี้</th><th>บริษัท</th><th>ผู้ขาย</th><th class="num">ยอดรวม</th><th>สถานะ</th><th>รหัส</th></tr></thead><tbody>
 ${SAMPLE.map((r,i)=>`<tr style="animation-delay:${.15+i*.12}s"><td><b>${r[0]}</b></td><td><span class="co" style="margin:0">${r[5]}</span></td><td>${r[1]}</td><td class="num">${r[4]}</td><td>${badge(r[2])}</td><td>${r[3].map(c=>`<span class="code ${SEV[c]}">${c}</span>`).join(" ")||'<span class="nac">—</span>'}</td></tr>`).join("")}</tbody></table></div></div>
 <div class="rq-ft"><div>${icon("checkc","lg")}<span><b>ทุกสถานะมีป้ายและข้อความ</b>ไม่ต้องเดาจากสี</span></div><div>${icon("target","lg")}<span><b>เปิด PDF พร้อมไฮไลต์หลักฐาน</b>กดครั้งเดียวไปตรงจุดที่ผิด</span></div><div>${icon("shield","lg")}<span><b>เห็นเฉพาะตามสิทธิ์</b>ตามบทบาท บริษัท และ Oracle account</span></div></div>`}
function queueInit(){document.querySelectorAll(".rq .k-v").forEach(el=>{const to=+el.dataset.n;if(RM()){el.textContent=to;return}const t0=performance.now();
 (function f(t){const p=Math.min(1,(t-t0)/900);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)})}

/* ---------- ตัวควบคุมแผง ---------- */
const SCENE={flow:flowScene,rules:rulesScene,state:stateScene,role:roleScene,queue:queueScene};
const INIT={flow:()=>flowSet(RP.step),rules:()=>rulesPlay(),state:()=>stBuild(),role:()=>roSet(RP.ri),queue:queueInit};
function rpShell(){return `<div class="rp-head"><div><h2>ระบบทำงานอย่างไร</h2><div class="cap">${icon("info","sm")}จากเอกสารสแกนถึงตั้งหนี้ใน Oracle · คลิกเพื่อดูแต่ละขั้น · ข้อมูลเป็นค่าสมมติ</div></div><div class="rp-ctl"><button class="lg-btn sec sm" id="rpPlay" onclick="LGX.rpAuto()"></button></div></div><div class="rp-tabs" role="tablist" id="rpTabs" aria-label="หน้าอธิบายระบบ"></div><div class="rp-scene" id="rpScene"></div>`}
function rpTabs(){const el=q("rpTabs");if(!el)return;el.innerHTML=TABS.map(t=>`<button class="rp-tab ${RP.tab===t[0]?"on":""}" role="tab" aria-selected="${RP.tab===t[0]}" onclick="LGX.tab('${t[0]}')">${icon(t[2],"sm")}${t[1]}<span class="pgb"></span></button>`).join("")}
function rpPlayBtn(){const b=q("rpPlay");if(b)b.innerHTML=RP.auto?icon("pause","sm")+"หยุดเล่นอัตโนมัติ":icon("play","sm")+"เล่นอัตโนมัติ"}
function rpClear(){clearInterval(RP.vt);RP.vt=null;clearTimeout(RP.rt);RP.rts.forEach(clearTimeout);RP.rts=[]}
function rpScene(){rpClear();const el=q("rpScene");if(!el)return;el.innerHTML=`<div class="rp-in">${SCENE[RP.tab]()}</div>`;INIT[RP.tab]()}
function rpMount(){RP.tab="flow";RP.step=0;RP.scn=0;RP.jr=0;RP.js=0;RP.ri=0;RP.auto=!RM();RP.hold=false;RP.tEl=0;RP.sEl=0;
 rpTabs();rpScene();rpPlayBtn();if(!RP.timer)RP.timer=setInterval(rpTick,100)}
function rpStop(){clearInterval(RP.timer);RP.timer=null;rpClear()}
function goTab(k){if(RP.tab===k&&q("rpScene")&&q("rpScene").firstChild)return;RP.tab=k;RP.tEl=0;RP.sEl=0;RP.step=0;RP.js=0;RP.jr=0;RP.scn=0;RP.ri=0;rpTabs();rpScene()}
function rpTick(){const lg=q("lg");if(!lg||lg.hidden||document.hidden||RP.hold||!RP.auto||!q("rpScene"))return;
 RP.sEl+=100;const per={flow:3300,state:2900,role:3500}[RP.tab];
 if(per&&RP.sEl>=per){RP.sEl=0;
  if(RP.tab==="flow")flowSet((RP.step+1)%WF.length);
  else if(RP.tab==="state"){const j=JR[RP.jr];if(RP.js+1>=j.n.length){RP.js=0;RP.jr=(RP.jr+1)%JR.length;stBuild()}else stSet(RP.js+1)}
  else if(RP.tab==="role")roSet((RP.ri+1)%RO_U.length)}
 RP.tEl+=100;const pg=document.querySelector(".rp-tab.on .pgb");if(pg)pg.style.width=Math.min(100,RP.tEl/DWELL[RP.tab]*100)+"%";
 if(RP.tEl>=DWELL[RP.tab]){const i=TABS.findIndex(t=>t[0]===RP.tab);goTab(TABS[(i+1)%TABS.length][0])}}
const manual=()=>{RP.auto=false;rpPlayBtn();const pg=document.querySelector(".rp-tab.on .pgb");if(pg)pg.style.width="0"};

/* =====================================================================
   โครงหน้า · render · การเข้าสู่ระบบ
   ===================================================================== */
const d3=()=>`<div class="d3"><section class="d3-l" id="lp">${lpHTML()}</section><section class="d3-r" id="rp" onmouseenter="LGX.hold(1)" onmouseleave="LGX.hold(0)">${rpShell()}</section></div>`;
function render(){const st=q("lgStage");st.innerHTML=d3();bind();paint();rpMount();const f=q("lgU");if(f)f.focus({preventScroll:true})}
function renderLeft(){const lp=q("lp");if(!lp)return;lp.innerHTML=lpHTML();bind();paint();const f=q("lgU");if(f)f.focus({preventScroll:true})}
function bind(){const u=q("lgU"),p=q("lgP");
 if(u){u.value=LG.u;u.addEventListener("input",()=>{LG.u=u.value;fieldOK("U")})}
 if(p){p.value=LG.p;p.addEventListener("input",()=>{LG.p=p.value;fieldOK("P")});["keydown","keyup"].forEach(ev=>p.addEventListener(ev,e=>{const c=q("caps");if(c&&e.getModifierState)c.hidden=!e.getModifierState("CapsLock")}))}
 const k=q("lgKeep");if(k)k.addEventListener("change",()=>{LG.keep=k.checked})}
function fieldErr(f,msg){const w=q("w"+f),e=q("e"+f);if(w)w.classList.add("bad");if(e)e.innerHTML=icon("alert","sm")+msg}
function fieldOK(f){const w=q("w"+f),e=q("e"+f);if(w)w.classList.remove("bad");if(e)e.innerHTML=""}
/* อัปเดตเฉพาะจุด (ไม่วาดใหม่) ระหว่างรอผล */
function paint(){const r=q("lg");r.dataset.busy=LG.busy?"1":"0";const locked=LG.lock>Date.now();
 document.querySelectorAll("#lgStage .go").forEach(b=>{const me=LG.busy&&b.dataset.m===LG.bm;b.classList.toggle("is-busy",me);b.disabled=LG.busy||locked;
  const t=b.querySelector(".t");if(t){if(!b.dataset.t)b.dataset.t=t.textContent;t.textContent=me?(b.dataset.m==="m365"?"กำลังเปลี่ยนเส้นทางไปที่ Microsoft…":"กำลังตรวจสอบ…"):b.dataset.t}});
 document.querySelectorAll("#lgStage .lg-in input").forEach(i=>i.readOnly=LG.busy);
 paintAlert()}
function showAlert(k,t,m,acts,shake){LG.alert={k,t,m,acts:acts||[],shake:!!shake};paintAlert()}
function clearAlert(){LG.alert=null;paintAlert()}
function paintAlert(){const el=q("lgAlert");if(!el)return;const a=LG.alert;if(!a){el.hidden=true;el.innerHTML="";return}
 el.hidden=false;el.className="lg-alert "+a.k;el.innerHTML=icon(a.k==="ok"?"checkc":a.k==="info"?"info":"alert","lg")+`<div><b>${a.t}</b>${a.m}${a.acts.length?`<div class="acts">${a.acts.map((x,i)=>`<button type="button" onclick="LGX.act(${i})">${x.l}</button>`).join("")}</div>`:""}</div>`;
 if(a.shake){el.classList.remove("shake");void el.offsetWidth;el.classList.add("shake");a.shake=false}}
/* แถบความคืบหน้าบนสุด (ความรู้สึกเหมือนเบราว์เซอร์โหลดหน้า) */
function bar(p,ms,err){const b=q("lgBar");b.classList.toggle("err",!!err);b.style.transition=`width ${ms}ms cubic-bezier(.2,.8,.2,1),opacity .3s`;b.style.opacity=1;b.style.width=p+"%"}
function barEnd(err){const b=q("lgBar");bar(100,180,err);setTimeout(()=>{b.style.opacity=0;setTimeout(()=>{b.style.width="0"},320)},err?900:260)}

/* ---------- การเข้าสู่ระบบ ---------- */
function auditFail(who,act,detail){AUDIT.unshift({dt:TODAY,t:now(),who:who||"(ยังไม่ระบุตัวตน)",role:"—",act,doc:"—",detail})}
function scenario(m){const sim=LG.sim;if(sim==="timeout")return {failAt:0,kind:"timeout"};
 const u=m==="ldap"?findUser(LG.u):userM365();
 if(sim==="cred")return {failAt:1,kind:"cred",u};if(sim==="noaccess")return {failAt:2,kind:"noaccess",u};
 if(m==="ldap"){if(!u||LG.p!==MOCK_PW)return {failAt:1,kind:"cred",u}}else if(!u)return {failAt:2,kind:"noaccess",u};
 if(u&&u.off)return {failAt:2,kind:"noaccess",u};return {failAt:null,u}}
function go(m){if(LG.busy)return;if(LG.lock>Date.now())return;
 clearAlert();LG.m=m;
 if(m==="ldap"){let bad=null;if(!LG.u.trim()){fieldErr("U","กรอกชื่อผู้ใช้");bad=bad||"lgU"}if(!LG.p){fieldErr("P","กรอกรหัสผ่าน");bad=bad||"lgP"}if(bad){q(bad).focus();return}}
 run(m)}
async function run(m){const S=STEPS[m];LG.busy=true;LG.bm=m;LG.steps=S.map(()=>({s:"wait"}));LG.res=null;paint();
 bar(14,350);const r=scenario(m);
 for(let i=0;i<S.length;i++){LG.steps[i].s="run";paint();bar(14+76*(i/S.length),560);await sleep(i===0&&m==="m365"?750:540);
  if(r.failAt===i){LG.steps[i].s="bad";return fail(m,r)}LG.steps[i].s="ok";paint()}
 ok(m,r.u)}
function fail(m,r){LG.busy=false;const typed=LG.u.trim()||(r.u&&r.u.email)||"";const lbl=m==="m365"?"Microsoft 365":"LDAP";LG.p="";const pw=q("lgP");if(pw)pw.value="";barEnd(true);
 if(r.kind==="timeout"){auditFail(typed,"เข้าสู่ระบบไม่สำเร็จ",lbl+" · ระบบยืนยันตัวตนไม่ตอบสนอง");
  showAlert("warn",m==="ldap"?"เชื่อมต่อเซิร์ฟเวอร์ LDAP ไม่ได้":"เชื่อมต่อ Microsoft ไม่ได้",m==="ldap"?"เซิร์ฟเวอร์ภายในไม่ตอบสนองภายใน 10 วินาที ลองอีกครั้ง หรือใช้ Microsoft 365 แทน":"ไม่ได้รับการตอบกลับจาก Microsoft ลองอีกครั้ง หรือใช้บัญชีภายใน (LDAP) แทน",
   [{l:"ลองอีกครั้ง",f:()=>go(m)},{l:m==="ldap"?"ใช้ Microsoft 365":"ใช้ LDAP",f:()=>switchTo(m==="ldap"?"m365":"ldap")}],true)}
 else if(r.kind==="cred"){LG.fails++;const left=MAX_FAIL-LG.fails;auditFail(typed,"เข้าสู่ระบบไม่สำเร็จ",lbl+" · ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ("+LG.fails+"/"+MAX_FAIL+")");
  if(left<=0){LG.lock=Date.now()+LOCK_SEC*1000;lockLoop()}
  else showAlert("err",m==="ldap"?"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง":"ลงชื่อเข้าใช้ด้วย Microsoft ไม่สำเร็จ",(m==="ldap"?"ตรวจตัวพิมพ์และภาษาแป้นพิมพ์อีกครั้ง · ":"ยกเลิกหรือยืนยันตัวตนไม่ผ่าน · ")+`เหลืออีก <b>${left}</b> ครั้งก่อนถูกล็อกชั่วคราว`,[{l:"ลืมรหัสผ่าน?",f:forgot}],true);
  if(m==="ldap"){fieldErr("P","รหัสผ่านไม่ถูกต้อง");const p=q("lgP");if(p)p.focus()}}
 else{auditFail(typed,"ถูกปฏิเสธการเข้าสู่ระบบ",lbl+" · ยืนยันตัวตนผ่าน แต่ไม่มีบทบาทใน Portal ("+(typed||"—")+")");
  showAlert("warn","บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน AIVA","ยืนยันตัวตนผ่านแล้ว แต่ไม่พบบัญชีในกลุ่มสิทธิ์ที่ได้รับอนุญาต · ให้ IT Admin เพิ่มบัญชีและผูก Oracle account ให้ก่อน",[{l:"ขอสิทธิ์จาก IT Admin",f:()=>{toast("mockup: ส่งคำขอสิทธิ์ถึง IT Admin แล้ว");AUDIT.unshift({dt:TODAY,t:now(),who:typed||"(ยังไม่ระบุตัวตน)",role:"—",act:"ขอสิทธิ์ใช้งาน",doc:"—",detail:"ส่งคำขอถึง IT Admin"})}}],true)}
 paint()}
function lockLoop(){clearInterval(LG.tick);const tick=()=>{const s=Math.ceil((LG.lock-Date.now())/1000);
  if(s<=0){clearInterval(LG.tick);LG.fails=0;LG.lock=0;clearAlert();paint();return}
  showAlert("err","ถูกล็อกชั่วคราว",`ใส่รหัสผิดครบ ${MAX_FAIL} ครั้ง · ลองใหม่ได้ใน <b>${s}</b> วินาที หรือติดต่อ IT Support`,[{l:"ติดต่อ IT Support",f:help}]);paint()};tick();LG.tick=setInterval(tick,1000)}
async function ok(m,u){LG.res=u;LG.fails=0;LG.p="";barEnd(false);paint();
 showAlert("ok","เข้าสู่ระบบสำเร็จ",`${esc(u.n)} · ${ROLES[u.role].n}`);
 await sleep(800);enter(u,m)}
function enter(u,m,skip){try{sessionStorage.setItem("aiva.sess",u.id)}catch(e){}const k=q("lgKeep");if(k&&k.checked&&LG.u&&!skip)storageSet("aiva.login.u",LG.u.trim());else if(k&&!k.checked)storageSet("aiva.login.u","");
 const r=q("lg");window.AIVA_FX&&AIVA_FX.loginOut(r,u);r.classList.add("out");
 setTimeout(()=>{r.hidden=true;r.classList.remove("out");rpStop();shell().inert=false;LG.busy=false;LG.bm=null;
  window.AIVA_FX&&AIVA_FX.appPrep();q("user").value=u.id;switchUser(true);
  if(AUDIT[0]&&AUDIT[0].act==="เข้าสู่ระบบ")AUDIT[0].detail=(skip?"ข้ามหน้า login (mockup) · ":(m==="m365"?"Microsoft 365 (OAuth 2.0) · ":"LDAP · "))+u.email+(u.role==="EU"?" · Oracle account "+(acctsOf(u).join(", ")||"—"):"");
  window.AIVA_FX?AIVA_FX.welcome(u,m,skip):toast("ยินดีต้อนรับ "+u.n+" · "+ROLES[u.role].n)},window.AIVA_FX?AIVA_FX.exitMs:260)}
function show(){clearInterval(LG.tick);LG.busy=false;LG.bm=null;LG.p="";LG.res=null;LG.steps=[];LG.alert=null;LG.fails=0;LG.lock=0;shell().inert=true;const r=q("lg");r.hidden=false;r.classList.remove("out");render()}
function switchTo(m){LG.m=m;clearAlert();renderLeft()}
function forgot(){showAlert("info","รีเซ็ตรหัสผ่าน","บัญชี LDAP รีเซ็ตโดย IT Support · บัญชี Microsoft รีเซ็ตเองได้ที่หน้าลงชื่อเข้าใช้ของ Microsoft",[{l:"แจ้ง IT Support",f:help}])}
function help(){toast("mockup: เปิดแบบฟอร์มแจ้ง IT Support")}

/* ---------- API ที่หน้า HTML เรียก ---------- */
window.LGX={go,help,forgot,
 act:i=>{const a=LG.alert&&LG.alert.acts[i];if(a)a.f()},
 method:m=>{if(LG.busy)return;LG.m=m;clearAlert();renderLeft()},
 eye:()=>{const p=q("lgP");if(!p)return;const on=p.type==="password";p.type=on?"text":"password";const b=p.parentNode.querySelector(".lg-eye");b.innerHTML=icon(on?"eyeoff":"eye");b.setAttribute("aria-label",on?"ซ่อนรหัสผ่าน":"แสดงรหัสผ่าน")},
 logout:()=>{try{sessionStorage.removeItem("aiva.sess")}catch(e){}AUDIT.unshift({dt:TODAY,t:now(),who:ME.n,role:ROLES[ME.role].n,act:"ออกจากระบบ",doc:"—",detail:"สิ้นสุดเซสชัน"});closeDock(true);window.AIVA_FX?AIVA_FX.logoutOut(show):show()},
 skip:()=>{const u=USERS.find(x=>x.id===LG.acct);enter(u,"m365",true)},
 /* แผงขวา */
 tab:k=>{manual();goTab(k)},
 rpAuto:()=>{RP.auto=!RP.auto;RP.tEl=0;RP.sEl=0;rpPlayBtn();if(RP.auto&&RP.tab==="rules")rulesPlay()},
 hold:v=>{RP.hold=!!v},
 node:i=>{manual();flowSet(i)},
 scn:i=>{manual();RP.scn=i;rulesPlay()},
 jr:i=>{manual();RP.jr=i;RP.js=0;stBuild()},
 role:i=>{manual();roSet(i)}};

/* ---------- โครงหน้า + แถบจำลอง ---------- */
function build(){const el=document.createElement("div");el.id="lg";el.dataset.busy="0";el.setAttribute("role","dialog");el.setAttribute("aria-label","เข้าสู่ระบบ AIVA");
 el.innerHTML=`<div class="lg-stage" id="lgStage"></div>
 <div class="lg-dev"><b class="tg">MOCK</b>
  <label>ผลจำลอง<select id="lgSim" aria-label="ผลจำลอง"><option value="auto">ตามข้อมูลที่กรอก</option><option value="cred">รหัสผ่านผิด / ยืนยันไม่ผ่าน</option><option value="noaccess">ยืนยันผ่าน แต่ไม่มีสิทธิ์ใช้งาน</option><option value="timeout">ระบบยืนยันตัวตนไม่ตอบสนอง</option></select></label>
  <label>บัญชี Microsoft ทดสอบ<select id="lgAcct" aria-label="บัญชี Microsoft ทดสอบ">${USERS.map(u=>`<option value="${u.id}">${u.n} · ${ROLES[u.role].n}</option>`).join("")}</select></label>
  <span>LDAP ชื่อผู้ใช้ = ส่วนหน้าอีเมล เช่น <code>somsak.j</code> · รหัสผ่านทดสอบ <code>1234</code></span><span class="grow"></span>
  <button class="lg-btn sec sm" onclick="LGX.skip()">${icon("arrowr","sm")}ข้ามหน้า login</button></div>`;
 const bar=document.createElement("div");bar.className="lg-bar";bar.id="lgBar";
 document.body.appendChild(el);document.body.appendChild(bar);
 q("lgSim").addEventListener("change",e=>{LG.sim=e.target.value;if(!LG.busy){LG.fails=0;clearAlert();renderLeft()}});
 q("lgAcct").addEventListener("change",e=>{LG.acct=e.target.value})}
document.addEventListener("keydown",e=>{const r=q("lg");if(!r||r.hidden||LG.busy)return;
 if(e.altKey&&(e.key==="1"||e.key==="2")){e.preventDefault();LG.m=e.key==="1"?"m365":"ldap";clearAlert();renderLeft()}});

/* ---------- ปุ่มออกจากระบบบนแถบบน ---------- */
const tb=document.querySelector(".topbar .who");
if(tb){const b=document.createElement("button");b.className="ibtn";b.title="ออกจากระบบ";b.setAttribute("aria-label","ออกจากระบบ");b.onclick=LGX.logout;b.innerHTML=icon("logout","lg");tb.appendChild(b)}

build();
if(/[?&#]nologin\b/.test(location.search+location.hash)){q("lg").hidden=true}
else{var sid=null;try{sid=sessionStorage.getItem("aiva.sess")}catch(e){}var su=sid&&USERS.find(function(x){return x.id===sid});
 if(su&&!su.off){q("lg").hidden=true;shell().inert=false;q("user").value=su.id;switchUser(true);
  if(AUDIT[0]&&AUDIT[0].act==="เข้าสู่ระบบ")AUDIT[0].detail="กลับเข้าเซสชันเดิม (mockup) · "+su.email}
 else{if(AUDIT[0]&&AUDIT[0].act==="เข้าสู่ระบบ")AUDIT.shift();shell().inert=true;render()}}
})();

}
