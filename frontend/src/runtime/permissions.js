// Retained runtime module. Dynamic DOM remains owned by this compatibility layer.
export function initializePermissions() {
Object.defineProperty(window, "PM", { configurable: true, get: () => PM });
Object.defineProperty(window, "PM_CO", { configurable: true, get: () => PM_CO });
Object.defineProperty(window, "PM_RK", { configurable: true, get: () => PM_RK });
Object.defineProperty(window, "PM_LL", { configurable: true, get: () => PM_LL });
Object.defineProperty(window, "PM_DIR", { configurable: true, get: () => PM_DIR });
Object.defineProperty(window, "PM_RS", { configurable: true, get: () => PM_RS });
Object.defineProperty(window, "PM_RESTR", { configurable: true, get: () => PM_RESTR });
Object.defineProperty(window, "PM_GRP", { configurable: true, get: () => PM_GRP });
Object.defineProperty(window, "PM_STS", { configurable: true, get: () => PM_STS });
Object.defineProperty(window, "PM_WHY", { configurable: true, get: () => PM_WHY });
Object.defineProperty(window, "PM_TY", { configurable: true, get: () => PM_TY });
Object.defineProperty(window, "PM_KL", { configurable: true, get: () => PM_KL });
Object.defineProperty(window, "PMH", { configurable: true, get: () => PMH });
Object.defineProperty(window, "pmClone", { configurable: true, get: () => pmClone });
Object.defineProperty(window, "pmU", { configurable: true, get: () => pmU });
Object.defineProperty(window, "pmAccts", { configurable: true, get: () => pmAccts });
Object.defineProperty(window, "pmBound", { configurable: true, get: () => pmBound });
Object.defineProperty(window, "pmAv", { configurable: true, get: () => pmAv });
Object.defineProperty(window, "pmTm", { configurable: true, get: () => pmTm });
Object.defineProperty(window, "pmSortCo", { configurable: true, get: () => pmSortCo });
Object.defineProperty(window, "PM_SN", { configurable: true, get: () => PM_SN });
Object.defineProperty(window, "pmRole", { configurable: true, get: () => pmRole });
Object.defineProperty(window, "pmRk", { configurable: true, get: () => pmRk });
Object.defineProperty(window, "pmCos", { configurable: true, get: () => pmCos });
Object.defineProperty(window, "pmScope", { configurable: true, get: () => pmScope, set: value => { pmScope = value; } });
Object.defineProperty(window, "pmCount", { configurable: true, get: () => pmCount, set: value => { pmCount = value; } });
Object.defineProperty(window, "pmChanges", { configurable: true, get: () => pmChanges, set: value => { pmChanges = value; } });
Object.defineProperty(window, "pmPendingN", { configurable: true, get: () => pmPendingN });
Object.defineProperty(window, "pmIssues", { configurable: true, get: () => pmIssues, set: value => { pmIssues = value; } });
Object.defineProperty(window, "pmGlobal", { configurable: true, get: () => pmGlobal, set: value => { pmGlobal = value; } });
Object.defineProperty(window, "pmAll", { configurable: true, get: () => pmAll, set: value => { pmAll = value; } });
Object.defineProperty(window, "pmGuard", { configurable: true, get: () => pmGuard, set: value => { pmGuard = value; } });
Object.defineProperty(window, "pmPush", { configurable: true, get: () => pmPush, set: value => { pmPush = value; } });
Object.defineProperty(window, "pmDo", { configurable: true, get: () => pmDo, set: value => { pmDo = value; } });
Object.defineProperty(window, "pmFix", { configurable: true, get: () => pmFix, set: value => { pmFix = value; } });
Object.defineProperty(window, "pmUndo", { configurable: true, get: () => pmUndo, set: value => { pmUndo = value; } });
Object.defineProperty(window, "pmRedo", { configurable: true, get: () => pmRedo, set: value => { pmRedo = value; } });
Object.defineProperty(window, "pmUndoToast", { configurable: true, get: () => pmUndoToast, set: value => { pmUndoToast = value; } });
Object.defineProperty(window, "pmSelf", { configurable: true, get: () => pmSelf, set: value => { pmSelf = value; } });
Object.defineProperty(window, "pmSetRole", { configurable: true, get: () => pmSetRole, set: value => { pmSetRole = value; } });
Object.defineProperty(window, "pmToggleCo", { configurable: true, get: () => pmToggleCo, set: value => { pmToggleCo = value; } });
Object.defineProperty(window, "pmAddAcct", { configurable: true, get: () => pmAddAcct, set: value => { pmAddAcct = value; } });
Object.defineProperty(window, "pmAddAcctIn", { configurable: true, get: () => pmAddAcctIn, set: value => { pmAddAcctIn = value; } });
Object.defineProperty(window, "pmDelAcct", { configurable: true, get: () => pmDelAcct, set: value => { pmDelAcct = value; } });
Object.defineProperty(window, "pmSetOff", { configurable: true, get: () => pmSetOff, set: value => { pmSetOff = value; } });
Object.defineProperty(window, "pmResetUser", { configurable: true, get: () => pmResetUser, set: value => { pmResetUser = value; } });
Object.defineProperty(window, "pmDiscard", { configurable: true, get: () => pmDiscard, set: value => { pmDiscard = value; } });
Object.defineProperty(window, "pmBulkDo", { configurable: true, get: () => pmBulkDo, set: value => { pmBulkDo = value; } });
Object.defineProperty(window, "pmBulkAct", { configurable: true, get: () => pmBulkAct, set: value => { pmBulkAct = value; } });
Object.defineProperty(window, "pmSel", { configurable: true, get: () => pmSel, set: value => { pmSel = value; } });
Object.defineProperty(window, "pmOpenUser", { configurable: true, get: () => pmOpenUser, set: value => { pmOpenUser = value; } });
Object.defineProperty(window, "pmTestAs", { configurable: true, get: () => pmTestAs, set: value => { pmTestAs = value; } });
Object.defineProperty(window, "pmTab", { configurable: true, get: () => pmTab, set: value => { pmTab = value; } });
Object.defineProperty(window, "pmShowIssues", { configurable: true, get: () => pmShowIssues, set: value => { pmShowIssues = value; } });
Object.defineProperty(window, "pmSync", { configurable: true, get: () => pmSync, set: value => { pmSync = value; } });
Object.defineProperty(window, "permPage", { configurable: true, get: () => permPage, set: value => { permPage = value; } });
Object.defineProperty(window, "pmMount", { configurable: true, get: () => pmMount, set: value => { pmMount = value; } });
Object.defineProperty(window, "pmAfter", { configurable: true, get: () => pmAfter, set: value => { pmAfter = value; } });
Object.defineProperty(window, "pmBuild", { configurable: true, get: () => pmBuild, set: value => { pmBuild = value; } });
Object.defineProperty(window, "pmRefresh", { configurable: true, get: () => pmRefresh, set: value => { pmRefresh = value; } });
Object.defineProperty(window, "pmDrawTabs", { configurable: true, get: () => pmDrawTabs, set: value => { pmDrawTabs = value; } });
Object.defineProperty(window, "pmDrawFoot", { configurable: true, get: () => pmDrawFoot, set: value => { pmDrawFoot = value; } });
Object.defineProperty(window, "pmDrawChips", { configurable: true, get: () => pmDrawChips, set: value => { pmDrawChips = value; } });
Object.defineProperty(window, "pmList", { configurable: true, get: () => pmList, set: value => { pmList = value; } });
Object.defineProperty(window, "pmSort", { configurable: true, get: () => pmSort, set: value => { pmSort = value; } });
Object.defineProperty(window, "pmDrawList", { configurable: true, get: () => pmDrawList, set: value => { pmDrawList = value; } });
Object.defineProperty(window, "pmChk", { configurable: true, get: () => pmChk, set: value => { pmChk = value; } });
Object.defineProperty(window, "pmChkAll", { configurable: true, get: () => pmChkAll, set: value => { pmChkAll = value; } });
Object.defineProperty(window, "pmRowKey", { configurable: true, get: () => pmRowKey, set: value => { pmRowKey = value; } });
Object.defineProperty(window, "pmDrawInsp", { configurable: true, get: () => pmDrawInsp, set: value => { pmDrawInsp = value; } });
Object.defineProperty(window, "pmAcctList", { configurable: true, get: () => pmAcctList, set: value => { pmAcctList = value; } });
Object.defineProperty(window, "pmMxSel", { configurable: true, get: () => pmMxSel, set: value => { pmMxSel = value; } });
Object.defineProperty(window, "pmMxHover", { configurable: true, get: () => pmMxHover, set: value => { pmMxHover = value; } });
Object.defineProperty(window, "pmDrawMx", { configurable: true, get: () => pmDrawMx, set: value => { pmDrawMx = value; } });
Object.defineProperty(window, "pmAcctRows", { configurable: true, get: () => pmAcctRows, set: value => { pmAcctRows = value; } });
Object.defineProperty(window, "pmDrawAcc", { configurable: true, get: () => pmDrawAcc, set: value => { pmDrawAcc = value; } });
Object.defineProperty(window, "pmDrawCo", { configurable: true, get: () => pmDrawCo, set: value => { pmDrawCo = value; } });
Object.defineProperty(window, "pmFixCo", { configurable: true, get: () => pmFixCo, set: value => { pmFixCo = value; } });
Object.defineProperty(window, "pmDrawTester", { configurable: true, get: () => pmDrawTester, set: value => { pmDrawTester = value; } });
Object.defineProperty(window, "pmLogRows", { configurable: true, get: () => pmLogRows, set: value => { pmLogRows = value; } });
Object.defineProperty(window, "pmDrawLog", { configurable: true, get: () => pmDrawLog, set: value => { pmDrawLog = value; } });
Object.defineProperty(window, "pmExport", { configurable: true, get: () => pmExport, set: value => { pmExport = value; } });
Object.defineProperty(window, "pmAddUserOpen", { configurable: true, get: () => pmAddUserOpen, set: value => { pmAddUserOpen = value; } });
Object.defineProperty(window, "pmDirDraw", { configurable: true, get: () => pmDirDraw, set: value => { pmDirDraw = value; } });
Object.defineProperty(window, "pmAddUserDo", { configurable: true, get: () => pmAddUserDo, set: value => { pmAddUserDo = value; } });
Object.defineProperty(window, "pmDiffHtml", { configurable: true, get: () => pmDiffHtml, set: value => { pmDiffHtml = value; } });
Object.defineProperty(window, "pmApplyOpen", { configurable: true, get: () => pmApplyOpen, set: value => { pmApplyOpen = value; } });
Object.defineProperty(window, "pmSnapLive", { configurable: true, get: () => pmSnapLive, set: value => { pmSnapLive = value; } });
Object.defineProperty(window, "pmApply", { configurable: true, get: () => pmApply, set: value => { pmApply = value; } });
Object.defineProperty(window, "pmCommit", { configurable: true, get: () => pmCommit, set: value => { pmCommit = value; } });
Object.defineProperty(window, "pmUndoApplied", { configurable: true, get: () => pmUndoApplied, set: value => { pmUndoApplied = value; } });
/* =====================================================================
   v4.22 — Admin Permission Console · หน้าจัดการสิทธิ์ (IT Admin เท่านั้น · SRS v1.1 FR-ADM-001/002/003 · SEC-10)
   โมเดล: แก้ใน "ร่าง" (PM.w) เทียบกับค่าจริง (PM.b) → เห็นผลก่อน → บันทึกพร้อมอ้างอิงคำขอ → Audit
   ===================================================================== */
const PM={tab:"users",w:null,b:null,bsig:"",cx:[],cnt:{},cb:{},hist:[],redo:[],sel:"u4",chk:new Set(),q:"",fr:"all",fw:false,fd:false,sort:{k:"n",d:1},ref:"",
 tu:"u4",tdr:true,tcmp:true,aq:"",af:"all",lq:"",lf:"all",flash:null,mx:{k:"r",v:"APR"},dsel:null,focusAcct:false,applied:null};
const PM_CO=Object.keys(COMPANY),PM_RK=["EU","ACC","APR","ADM"];
const PM_LL={u1:"2026-10-07 08:12",u2:"2026-10-07 07:55",u3:"2026-10-06 16:40",u4:"2026-10-07 08:03",u5:"2026-10-06 17:21",u6:"2026-10-07 08:30",u7:"2026-10-07 09:02",u8:"2026-10-05 10:15"};
USERS.forEach(u=>{if(u.ll===undefined)u.ll=PM_LL[u.id]||"—";if(u.off===undefined)u.off=false});
const PM_DIR=[{id:"d1",n:"ศิริพร แก้วใส",email:"siriporn.k@aapico.com",unit:"คลังวัตถุดิบ"},{id:"d2",n:"ธีรพงษ์ ทองดี",email:"theerapong.t@aapico.com",unit:"ฝ่ายบัญชี AHT"},
 {id:"d3",n:"นภัสสร พึ่งบุญ",email:"napassorn.p@aapico.com",unit:"คลังอะไหล่ AHP"},{id:"d4",n:"ประเสริฐ มีสุข",email:"prasert.m@aapico.com",unit:"ฝ่ายซ่อมบำรุง"}];
const PM_RS={EU:"เห็นเฉพาะใบรับของตน",ACC:"ทั้งบริษัท · ตัดสินสถานะ",APR:"ทั้งบริษัท · ส่ง AP Interface",ADM:"ไม่เห็นเนื้อหาเอกสาร"};
const PM_RESTR=r=>({EU:"ไม่มี delegation · ไม่เห็นเอกสารที่ไม่มี Receiver · ไม่ได้รับการแจ้งเตือน ต้องตรวจสถานะเอง",
 ACC:"ไม่ส่งกลับ End User · ไม่สั่งตรวจซ้ำ · ตัดสิน Manual Review / Duplicate ไม่ได้ · ดู AP Interface ได้อย่างเดียว",
 APR:"ผู้ยืนยัน ≠ ผู้ส่ง AP · วงเงินตั้งหนี้ ≤ "+B(SET.limit.APR)+" ฿ ต่อฉบับ · เห็นบริษัท “?” ได้เฉพาะบทบาทนี้",
 ADM:"จัดการ mapping และสิทธิ์เท่านั้น · ไม่เห็นเนื้อหาเอกสาร (SEC-10) · ทุกความพยายามที่ถูกปฏิเสธถูกบันทึก"})[r];
const PM_GRP=[["การมองเห็นเอกสาร",["VIEW_OWN","VIEW_CO","DMS"]],["เอกสารใหม่และการตัดสินใจ",["UPLOAD_NEW","CONFIRM","REVIEW","HOLD","REJECT","MANUAL_REVIEW","DUP_OVERRIDE","UNCONFIRM"]],["AP Interface",["VIEW_AP","POST","RETURN_FAILED"]],["ผู้ดูแลระบบ",["MAP","AUDIT"]]];
const PM_STS=["Auto-pass","Review","Hold","Manual Review","Duplicate","Confirmed","Sent","Posted","Import Failed","Superseded","Rejected"];
const PM_WHY={off:"บัญชีถูกระงับ",role:"บทบาทนี้ไม่เห็นเนื้อหาเอกสาร",co:"นอกบริษัทที่รับผิดชอบ",norcv:"เอกสารไม่มี Receiver (เฉพาะฝ่ายบัญชีเห็น)",notme:"ไม่ใช่ Receiver ของ account ที่ผูก"};
const PM_TY={role:["shield","บทบาท"],co:["building","บริษัท"],acct:["link","Oracle account"],off:["lock","สถานะบัญชี"],add:["userplus","เพิ่มผู้ใช้"],undo:["undo","ย้อนกลับ"]};
const PM_KL={add:["userplus","เพิ่มผู้ใช้","ok"],role:["shield","เปลี่ยนบทบาท","warn"],off:["lock","สถานะบัญชี","warn"],"co+":["building","เพิ่มบริษัท","ok"],"co-":["building","ถอดบริษัท","err"],"acct+":["link","ผูก account","ok"],"acct-":["unlink","ยกเลิกการผูก","err"]};
const PMH=[
 {dt:"2026-10-02",t:"14:40:00",by:"อนุชา ไอที",ty:"acct",u:"u8",txt:"ผูก Oracle account",from:"—",to:"SOMSAK JAIDEE",ref:"INC-1021"},
 {dt:"2026-10-02",t:"14:40:00",by:"อนุชา ไอที",ty:"acct",u:"u8",txt:"ผูก Oracle account",from:"—",to:"WILAIWAN SRISUK",ref:"INC-1021"},
 {dt:"2026-10-02",t:"14:41:00",by:"อนุชา ไอที",ty:"acct",u:"u8",txt:"ผูก Oracle account",from:"—",to:"THANAKORN MANKONG",ref:"INC-1021"},
 {dt:"2026-09-25",t:"10:02:00",by:"อนุชา ไอที",ty:"role",u:"u5",txt:"เปลี่ยนบทบาท",from:"ผู้ใช้งาน (Receiver)",to:"เจ้าหน้าที่บัญชี",ref:"INC-1012"},
 {dt:"2026-09-22",t:"15:30:00",by:"อนุชา ไอที",ty:"co",u:"u5",txt:"เพิ่มบริษัท",from:"—",to:"AHP",ref:"INC-1004"},
 {dt:"2026-09-20",t:"09:15:00",by:"อนุชา ไอที",ty:"acct",u:"u1",txt:"ผูก Oracle account",from:"—",to:"SOMSAK JAIDEE",ref:"INC-0998"},
 {dt:"2026-09-20",t:"09:15:00",by:"อนุชา ไอที",ty:"acct",u:"u2",txt:"ผูก Oracle account",from:"—",to:"WILAIWAN SRISUK",ref:"INC-0998"},
 {dt:"2026-09-20",t:"09:16:00",by:"อนุชา ไอที",ty:"acct",u:"u3",txt:"ผูก Oracle account",from:"—",to:"THANAKORN MANKONG",ref:"INC-0998"}];
/* ---------- helpers ---------- */
const pmClone=()=>({users:USERS.map(u=>({id:u.id,n:u.n,email:u.email,role:u.role,co:[...u.co],emp:u.emp,unit:u.unit,off:!!u.off,ll:u.ll,isNew:false})),maps:MAPS.map(m=>({id:m.id,user:m.user,acct:m.acct,by:m.by,at:m.at,req:m.req}))});
const pmU=(id,w)=>(w||PM.w).users.find(u=>u.id===id);
const pmAccts=(w,id)=>w.maps.filter(m=>m.user===id).map(m=>m.acct);
const pmBound=(w,a)=>!a||w.maps.some(m=>m.acct===a&&(u=>!!u&&u.role==="EU"&&!u.off)(pmU(m.user,w)));
const pmAv=u=>{const p=u.n.trim().split(/\s+/);return (p[0][0]||"")+((p[1]||"")[0]||"")};
const pmTm=s=>s&&s!=="—"?dmy(s.slice(0,10))+" "+s.slice(11,16):"—";
const pmSortCo=u=>{u.co.sort((a,b)=>PM_CO.indexOf(a)-PM_CO.indexOf(b))};
const PM_SN={EU:"ผู้ใช้งาน",ACC:"เจ้าหน้าที่บัญชี",APR:"หัวหน้าฝ่ายบัญชี",ADM:"ผู้ดูแลระบบ"};
const pmRole=r=>{const R=ROLES[r];return `<span class="role-pill" title="${escA(R.n)}" style="background:${R.bg};color:${R.c}">${PM_SN[r]}</span>`};
const pmRk=r=>`<span class="pm-rk" style="background:${ROLES[r].bg};color:${ROLES[r].c}">${r}</span>`;
const pmCos=cs=>cs.length?cs.map(c=>`<span class="co" title="${escA(COMPANY[c].name)}">${c}</span>`).join(""):'<span class="nac">—</span>';
function pmScope(d,u,w){const r=ROLES[u.role];
 if(u.off)return {ok:false,why:"off"};if(r.scope==="none")return {ok:false,why:"role"};if(!u.co.includes(d.company))return {ok:false,why:"co"};
 if(r.scope==="receiver"){if(!d.receiver)return {ok:false,why:"norcv"};if(!pmAccts(w,u.id).includes(d.receiver))return {ok:false,why:"notme"}}
 return {ok:true}}
function pmCount(u,w){const R={tot:0,co:{},st:{},hid:{},hidN:0};
 DOCS.forEach(d=>{const r=pmScope(d,u,w);
  if(r.ok){R.tot++;R.co[d.company]=(R.co[d.company]||0)+1;const k=d.company+"|"+d.status;R.st[k]=(R.st[k]||0)+1}
  else{R.hidN++;const key=r.why==="co"?d.company:r.why==="notme"?d.receiver:"";const h=R.hid[r.why]=R.hid[r.why]||{n:0,k:{}};h.n++;if(key)h.k[key]=(h.k[key]||0)+1}});
 return R}
function pmChanges(){const B=PM.b,W=PM.w,out=[],bm=new Map(B.users.map(u=>[u.id,u]));
 W.users.forEach(u=>{const o=bm.get(u.id);
  if(!o)out.push({k:"add",u:u.id,to:ROLES[u.role].n,esc:u.role==="APR"||u.role==="ADM"});
  else{
   if(o.role!==u.role)out.push({k:"role",u:u.id,from:ROLES[o.role].n,to:ROLES[u.role].n,esc:(u.role==="ADM"&&o.role!=="ADM")||(u.role==="APR"&&(o.role==="EU"||o.role==="ACC"))});
   if(o.off!==u.off)out.push({k:"off",u:u.id,from:o.off?"ระงับ":"ใช้งาน",to:u.off?"ระงับ":"ใช้งาน"})}
  const oc=o?o.co:[];
  u.co.filter(c=>!oc.includes(c)).forEach(c=>out.push({k:"co+",u:u.id,to:c}));
  oc.filter(c=>!u.co.includes(c)).forEach(c=>out.push({k:"co-",u:u.id,from:c}));
  const oa=B.maps.filter(m=>m.user===u.id).map(m=>m.acct),na=pmAccts(W,u.id);
  na.filter(a=>!oa.includes(a)).forEach(a=>out.push({k:"acct+",u:u.id,to:a}));
  oa.filter(a=>!na.includes(a)).forEach(a=>out.push({k:"acct-",u:u.id,from:a}))});
 return out}
const pmPendingN=()=>PM.w&&PM.b&&can("MAP")?pmChanges().length:0;
function pmIssues(u,w){w=w||PM.w;const r=[],a=pmAccts(w,u.id);
 if(u.off)return [{lv:"info",t:"บัญชีถูกระงับ · เข้าสู่ระบบและเห็นเอกสารไม่ได้"}];
 if(u.role!=="ADM"&&!u.co.length)r.push({lv:"err",t:"ยังไม่ได้กำหนดบริษัท · ผู้ใช้จะไม่เห็นเอกสารใดเลย"});
 if(u.co.includes("?")&&u.role!=="APR")r.push({lv:"err",t:"บริษัท “?” กำหนดให้ได้เฉพาะหัวหน้าฝ่ายบัญชี"});
 if(u.role==="EU"){
  if(!a.length)r.push({lv:"warn",t:"ยังไม่ผูก Oracle account · จะไม่เห็นเอกสารใดเลย"});
  else{const out=[...new Set(DOCS.filter(d=>d.receiver&&a.includes(d.receiver)&&!u.co.includes(d.company)).map(d=>d.company))];
   if(out.length)r.push({lv:"warn",t:"account ที่ผูกมีเอกสารของบริษัท "+out.join(", ")+" ซึ่งไม่อยู่ในบริษัทของผู้ใช้ · จะไม่เห็นเอกสารเหล่านั้น"})}}
 return r}
function pmGlobal(w){w=w||PM.w;const r=[],act=w.users.filter(u=>!u.off);
 if(!act.some(u=>u.role==="ADM"))r.push({lv:"err",t:"ต้องมีผู้ดูแลระบบ (ADM) ที่ใช้งานอยู่อย่างน้อย 1 คน"});
 PM_CO.forEach(c=>{if(!act.some(u=>u.role==="APR"&&u.co.includes(c)))r.push({lv:c==="?"?"warn":"warn",t:"บริษัท "+c+" ไม่มีหัวหน้าฝ่ายบัญชีที่ใช้งานอยู่ · ส่ง Batch เข้า AP / ตัดสิน Manual Review ไม่ได้"})});
 return r}
function pmAll(){const errs=[],warns=[];PM.w.users.forEach(u=>pmIssues(u).forEach(i=>{if(i.lv==="err")errs.push({u:u.id,t:u.n+": "+i.t});else if(i.lv==="warn")warns.push({u:u.id,t:u.n+": "+i.t})}));
 pmGlobal().forEach(i=>(i.lv==="err"?errs:warns).push({u:null,t:i.t}));return {errs,warns}}
/* ---------- guard / history / mutate ---------- */
function pmGuard(){if(ME.role!=="ADM"||!can("MAP")){log("ถูกปฏิเสธการจัดการสิทธิ์","—","ไม่มีสิทธิ์ (บทบาท "+ROLES[ME.role].n+")");toast("เฉพาะผู้ดูแลระบบ (IT Admin) จัดการสิทธิ์ได้",1);return false}return true}
function pmPush(){PM.hist.push(JSON.stringify(PM.w));if(PM.hist.length>60)PM.hist.shift();PM.redo=[]}
function pmDo(id,fn){if(!pmGuard())return false;pmPush();fn();PM.flash=id||null;pmRefresh();return true}
function pmFix(){if(!pmU(PM.sel))PM.sel=(PM.w.users[0]||{}).id;if(!pmU(PM.tu))PM.tu=(PM.w.users[0]||{}).id;PM.chk.forEach(id=>{if(!pmU(id))PM.chk.delete(id)})}
function pmUndo(){if(!PM.hist.length)return;PM.redo.push(JSON.stringify(PM.w));PM.w=JSON.parse(PM.hist.pop());pmFix();pmRefresh();toast("เลิกทำแล้ว")}
function pmRedo(){if(!PM.redo.length)return;PM.hist.push(JSON.stringify(PM.w));PM.w=JSON.parse(PM.redo.pop());pmFix();pmRefresh();toast("ทำซ้ำแล้ว")}
function pmUndoToast(m){document.querySelectorAll(".toast.tu").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast tu";t.setAttribute("role","status");
 t.innerHTML=icon("checkc")+`<span>${m}</span><button type="button" class="tu-b">เลิกทำ</button>`;t.querySelector("button").onclick=()=>{pmUndo();t.remove()};$("toasts").appendChild(t);setTimeout(()=>t.remove(),7000)}
function pmSelf(id){if(id===ME.id){toast("บัญชีของคุณเอง · เปลี่ยนบทบาทหรือระงับไม่ได้ (กันล็อกตัวเองออกจากระบบ)",1);return true}return false}
/* ---------- editing actions ---------- */
function pmSetRole(id,r){const u=pmU(id);if(!u||u.role===r)return;if(pmSelf(id))return;let note="";
 pmDo(id,()=>{const had=pmAccts(PM.w,id).length;u.role=r;if(r==="ADM")u.co=[];if(r!=="APR")u.co=u.co.filter(c=>c!=="?");
  if(r!=="EU"&&had){PM.w.maps=PM.w.maps.filter(m=>m.user!==id);note="ถอด Oracle account "+had+" รายการอัตโนมัติ (บทบาทนี้ใช้ขอบเขตตามบริษัท)"}});
 if(note)toast(note)}
function pmToggleCo(id,c){const u=pmU(id);if(!u)return;
 if(u.role==="ADM")return toast("ผู้ดูแลระบบไม่ใช้ขอบเขตบริษัท",1);
 if(c==="?"&&u.role!=="APR")return toast("บริษัท “?” กำหนดให้ได้เฉพาะหัวหน้าฝ่ายบัญชี (SRS)",1);
 pmDo(id,()=>{u.co=u.co.includes(c)?u.co.filter(x=>x!==c):[...u.co,c];pmSortCo(u)})}
function pmAddAcct(id,raw){const u=pmU(id),a=(raw||"").trim().toUpperCase().replace(/\s+/g," ");
 if(!u||u.role!=="EU")return toast("ผูก Oracle account ได้เฉพาะบทบาทผู้ใช้งาน (Receiver)",1);
 if(!a)return toast("ระบุชื่อ Oracle account (RECEIVER)",1);
 if(!/^[A-Z][A-Z .'-]{2,60}$/.test(a))return toast("รูปแบบ RECEIVER ไม่ถูกต้อง · ใช้ตัวอักษรอังกฤษพิมพ์ใหญ่ เช่น SOMSAK JAIDEE",1);
 if(pmAccts(PM.w,id).includes(a))return toast("ผูก "+a+" ไว้แล้ว",1);
 PM.focusAcct=true;pmDo(id,()=>{PM.w.maps.push({id:"m"+(++mseq),user:id,acct:a,by:"",at:"",req:""})})}
function pmAddAcctIn(id){const e=$("pmAcct");pmAddAcct(id,e?e.value:"")}
function pmDelAcct(mid){const m=PM.w.maps.find(x=>x.id===mid);if(!m)return;pmDo(m.user,()=>{PM.w.maps=PM.w.maps.filter(x=>x.id!==mid)})}
function pmSetOff(id,v){const u=pmU(id);if(!u||u.off===v)return;if(pmSelf(id))return;pmDo(id,()=>{u.off=v})}
function pmResetUser(id){const bu=pmU(id,PM.b);pmDo(id,()=>{
 if(!bu){PM.w.users=PM.w.users.filter(u=>u.id!==id);PM.w.maps=PM.w.maps.filter(m=>m.user!==id);PM.chk.delete(id);pmFix()}
 else{const i=PM.w.users.findIndex(u=>u.id===id);PM.w.users[i]=JSON.parse(JSON.stringify(bu));PM.w.maps=PM.w.maps.filter(m=>m.user!==id).concat(PM.b.maps.filter(m=>m.user===id).map(m=>({...m})))}})}
function pmDiscard(){if(!PM.cx.length||!pmGuard())return;pmPush();PM.w=JSON.parse(JSON.stringify(PM.b));PM.chk.clear();pmFix();pmRefresh();pmUndoToast("ยกเลิกการเปลี่ยนแปลงทั้งหมดแล้ว")}
function pmBulkDo(){if(!pmGuard())return;const a=$("pmBA").value,c=$("pmBC").value,ids=[...PM.chk].filter(id=>pmU(id));if(!ids.length)return;let ok=0,skip=0;pmPush();
 ids.forEach(id=>{const u=pmU(id);
  if(a==="co+"||a==="co-"){if(u.role==="ADM"||(c==="?"&&u.role!=="APR")){skip++;return}const has=u.co.includes(c);if((a==="co+"&&has)||(a==="co-"&&!has)){skip++;return}
   u.co=a==="co+"?[...u.co,c]:u.co.filter(x=>x!==c);pmSortCo(u);ok++}
  else{if(id===ME.id){skip++;return}const off=a==="off";if(u.off===off){skip++;return}u.off=off;ok++}});
 if(!ok){PM.hist.pop();return toast("ไม่มีผู้ใช้ที่เข้าเงื่อนไข ("+skip+" คนถูกข้าม)",1)}
 pmRefresh();pmUndoToast("ใช้กับ "+ok+" คน"+(skip?" · ข้าม "+skip+" คน (ไม่เข้าเงื่อนไข / ตนเอง)":""))}
function pmBulkAct(){const a=$("pmBA").value;$("pmBC").disabled=(a==="off"||a==="on")}
/* ---------- navigation ---------- */
function pmSel(id){PM.sel=id;if(PM.tab==="users"){pmDrawList();pmDrawInsp()}}
function pmOpenUser(id){PM.sel=id;PM.tab="users";pmBuild();pmRefresh()}
function pmTestAs(id){PM.tu=id;PM.tab="tester";pmBuild();pmRefresh()}
function pmTab(t){if(PM.tab===t)return;PM.tab=t;pmBuild();pmRefresh()}
function pmShowIssues(){const A=pmAll(),f=A.errs.concat(A.warns).find(x=>x.u);PM.tab="users";PM.fw=true;PM.fr="all";PM.fd=false;PM.q="";if(f)PM.sel=f.u;pmBuild();pmRefresh()}
/* ---------- page shell ---------- */
function pmSync(){const live=pmClone(),sig=JSON.stringify(live);
 if(!PM.w){PM.w=pmClone();PM.b=live;PM.bsig=sig;return}
 if(sig!==PM.bsig&&JSON.stringify(PM.w)===JSON.stringify(PM.b)){PM.w=pmClone();PM.b=pmClone();PM.bsig=sig;PM.hist=[];PM.redo=[]}}
function permPage(){
 if(!can("MAP"))return `<div class="pg-scroll"><div class="panel"><div class="empty">${icon("lock")}เฉพาะผู้ดูแลระบบ (IT Admin) จัดการสิทธิ์ได้</div></div></div>`;
 pmSync();pmFix();
 return `<div class="pg pm" id="pm"><div class="tbar pm-tb"><span class="pm-ttl">${icon("shield","lg")}จัดการสิทธิ์</span><div class="seg pm-tabs" id="pmTabs" role="tablist" aria-label="หมวดการจัดการสิทธิ์"></div><span class="grow"></span>
</div>
  <div class="pm-body" id="pmBody"></div><div class="pm-foot" id="pmFoot"></div></div>`}
function pmMount(){if(!$("pm"))return;pmBuild();pmRefresh()}
function pmAfter(){}
function pmBuild(){const el=$("pmBody");if(!el)return;const t=PM.tab;let h="";
 const srch=(id,ph,val,fn)=>`<div class="tsrch pm-s">${icon("search","sm")}<input id="${id}" type="search" placeholder="${ph}" aria-label="${ph}" value="${escA(val)}" oninput="${fn}"></div>`;
 if(t==="users")h=`<div class="pm-users"><section class="pm-main">${`<div class="pm-fb">${srch("pmQ","ค้นหา ชื่อ / อีเมล / Oracle account  ( / )",PM.q,"PM.q=this.value;pmDrawList()")}<div class="pm-chips" id="pmChips"></div><span class="grow"></span><button class="btn btn-teal sm" onclick="pmAddUserOpen()" title="เพิ่มผู้ใช้จาก Entra ID">${icon("userplus","sm")}เพิ่มผู้ใช้</button></div>`}<div class="pm-bulk" id="pmBulk" hidden></div>
   <div class="pm-tw"><table class="t pm-t"><thead id="pmHead"></thead><tbody id="pmRows"></tbody></table></div></section><aside class="pm-insp" id="pmInsp" aria-label="รายละเอียดสิทธิ์ของผู้ใช้ที่เลือก"></aside></div>`;
 else if(t==="mx")h=`<div class="pm-users"><section class="pm-main"><div class="pm-lock">${icon("lock","sm")}<span><b>ตารางนี้ล็อกตาม SRS v1.1</b> (ชีต 02_RBAC / 05A) · เปลี่ยนได้โดยออก SRS เวอร์ชันใหม่ · การให้สิทธิ์รายคนทำที่ “บทบาท” ของผู้ใช้</span><span class="grow"></span><button class="btn btn-sec sm" onclick="pmTab('users')">${icon("users","sm")}ไปกำหนดบทบาทผู้ใช้</button></div>
   <div class="pm-tw"><table class="t pm-t pm-mx" id="pmMx" onmouseover="pmMxHover(event)" onmouseleave="this.dataset.hc=''"></table></div></section><aside class="pm-insp" id="pmMside"></aside></div>`;
 else if(t==="accts")h=`<div class="pm-acc"><div class="pm-fb">${srch("pmAq","ค้นหา Oracle account / ผู้ใช้ที่ผูก",PM.aq,"PM.aq=this.value;pmDrawAcc()")}<div class="pm-chips" id="pmAchips"></div></div>
   <div class="pm-tw"><table class="t pm-t" style="min-width:1040px"><thead><tr><th>Oracle account (RECEIVER)</th><th>บริษัทของเอกสาร</th><th>ผู้ใช้ที่ผูก (AD user)</th><th class="num">เอกสาร</th><th class="num">เปิดอยู่</th><th class="num">ล็อก</th><th>ค้างเก่าสุด</th><th>สถานะ</th><th>ผูกผู้ใช้เพิ่ม</th></tr></thead><tbody id="pmArows"></tbody></table></div></div>`;
 else if(t==="co")h=`<div class="pm-co"><section class="pm-main"><div class="pm-tw"><table class="t pm-t pm-cg" style="min-width:620px"><thead id="pmCh"></thead><tbody id="pmCrows"></tbody><tfoot id="pmCf"></tfoot></table></div></section><aside class="pm-insp" id="pmCside"></aside></div>`;
 else if(t==="tester")h=`<div class="pm-tst"><aside class="pm-rail" id="pmRail"></aside><section class="pm-tmain" id="pmTmain"></section></div>`;
 else h=`<div class="pm-log"><div class="pm-fb">${srch("pmLq","ค้นหา ผู้ใช้ / รายการ / อ้างอิง",PM.lq,"PM.lq=this.value;pmDrawLog()")}<div class="pm-chips" id="pmLchips"></div><span class="grow"></span><button class="btn btn-sec sm" onclick="pmExport()">${icon("dl","sm")}ส่งออก CSV</button></div>
   <div class="pm-tw"><table class="t pm-t"><thead><tr><th>วันที่</th><th>เวลา</th><th>ผู้ดำเนินการ</th><th>ประเภท</th><th>ผู้ใช้</th><th>รายการ</th><th>ก่อน</th><th>หลัง</th><th>อ้างอิงคำขอ</th></tr></thead><tbody id="pmLrows"></tbody></table></div></div>`;
 el.innerHTML=h}
function pmRefresh(){if(!$("pm"))return;
 PM.cx=pmChanges();PM.cnt={};PM.cb={};PM.w.users.forEach(u=>{PM.cnt[u.id]=pmCount(u,PM.w)});PM.b.users.forEach(u=>{PM.cb[u.id]=pmCount(u,PM.b)});
 pmDrawTabs();
 ({users:()=>{pmDrawChips();pmDrawList();pmDrawInsp()},mx:pmDrawMx,accts:pmDrawAcc,co:pmDrawCo,tester:pmDrawTester,log:pmDrawLog})[PM.tab]();
 pmDrawFoot();renderNav();PM.flash=null}
function pmDrawTabs(){const el=$("pmTabs");if(!el)return;const cx=PM.cx,has=f=>cx.some(f);
 const T=[["users","ผู้ใช้","users",PM.w.users.length,has(c=>true)],["mx","บทบาท × สิทธิ์","shield",PM_RK.length,false],["accts","Oracle account","link",pmAcctList().length,has(c=>c.k.startsWith("acct"))],["co","บริษัท","building",PM_CO.length,has(c=>c.k.startsWith("co"))],["tester","ทดสอบสิทธิ์","eye","","" ],["log","ประวัติ","history",PMH.length,false]];
 el.innerHTML=T.map(([k,l,ic,n,d])=>`<button role="tab" aria-selected="${PM.tab===k}" class="${PM.tab===k?"on":""} ${d?"dirty":""}" onclick="pmTab('${k}')">${icon(ic,"sm")}${l}${n!==""?`<span class="pm-n">${n}</span>`:""}<i class="pm-dot" title="มีการแก้ไขที่ยังไม่บันทึก"></i></button>`).join("")}
function pmDrawFoot(){const el=$("pmFoot");if(!el)return;const n=PM.cx.length,us=new Set(PM.cx.map(c=>c.u)).size,A=pmAll();
 el.className="pm-foot"+(n?" dirty":"");el.title=n?"ร่างนี้ยังไม่มีผลกับระบบจริงจนกดบันทึก":"";
 el.innerHTML=`<span class="pm-fs">${n?icon("alert","sm")+`<b>${n}</b> รายการยังไม่บันทึก · <b>${us}</b> ผู้ใช้`:icon("checkc","sm")+"ไม่มีการเปลี่ยนแปลงค้าง · ตรงกับระบบ"}</span>
  ${A.errs.length?`<button class="pm-fi err" onclick="pmShowIssues()" title="${escA(A.errs.map(x=>x.t).join("\n"))}">${icon("x","sm")}${A.errs.length} ข้อผิดพลาด</button>`:""}${A.warns.length?`<button class="pm-fi warn" onclick="pmShowIssues()" title="${escA(A.warns.map(x=>x.t).join("\n"))}">${icon("alert","sm")}${A.warns.length} คำเตือน</button>`:""}
  <span class="grow"></span><span class="muted xs pm-sync" title="ผู้ใช้มาจาก Entra ID">Entra ID sync ${dmy(TODAY)} 08:00</span><span class="vsep" aria-hidden="true"></span>
  <button class="btn btn-sec sm" ${PM.hist.length?"":"disabled"} onclick="pmUndo()" title="เลิกทำการแก้ไขล่าสุด (Ctrl+Z)">${icon("undo","sm")}เลิกทำ <kbd>Ctrl+Z</kbd></button>
  <button class="btn btn-sec sm" ${PM.redo.length?"":"disabled"} onclick="pmRedo()" title="ทำซ้ำ (Ctrl+Y)">${icon("redo","sm")}ทำซ้ำ</button>
  <button class="btn btn-danger sm" ${n?"":"disabled"} onclick="pmDiscard()" title="ทิ้งการแก้ไขทั้งหมด (เลิกทำได้)">${icon("trash","sm")}ยกเลิกทั้งหมด</button>
  <button class="btn btn-primary" ${n?"":"disabled"} onclick="pmApplyOpen()" title="ดูสรุปก่อนบันทึก (Ctrl+S)">${icon("save","sm")}ตรวจสอบและบันทึก <kbd>Ctrl+S</kbd></button>`}
/* ---------- Users tab ---------- */
function pmDrawChips(){const el=$("pmChips");if(!el)return;const W=PM.w.users,cx=PM.cx;
 const rc=r=>W.filter(u=>u.role===r).length,wn=W.filter(u=>pmIssues(u).some(i=>i.lv!=="info")).length,dn=new Set(cx.map(c=>c.u)).size;
 const ch=(on,fn,l,n,ic)=>`<button class="chip ${on?"on":""}" aria-pressed="${on}" onclick="${fn}">${ic?icon(ic,"sm"):""}${l}${n!==undefined?` <span class="pm-cn">${n}</span>`:""}</button>`;
 el.innerHTML=ch(PM.fr==="all","PM.fr='all';pmRefresh()","ทั้งหมด",W.length)+PM_RK.map(r=>ch(PM.fr===r,`PM.fr='${r}';pmRefresh()`,r,rc(r))).join("")+'<span class="vs"></span>'
  +ch(PM.fw,"PM.fw=!PM.fw;pmRefresh()","มีคำเตือน",wn,"alert")+ch(PM.fd,"PM.fd=!PM.fd;pmRefresh()","แก้ไขแล้ว",dn,"sliders")}
function pmList(){const q=PM.q.trim().toLowerCase();
 const L=PM.w.users.filter(u=>{if(PM.fr!=="all"&&u.role!==PM.fr)return false;if(PM.fw&&!pmIssues(u).some(i=>i.lv!=="info"))return false;if(PM.fd&&!PM.cx.some(c=>c.u===u.id))return false;
  if(q&&!(u.n+" "+u.email+" "+u.unit+" "+pmAccts(PM.w,u.id).join(" ")+" "+ROLES[u.role].n).toLowerCase().includes(q))return false;return true});
 const k=PM.sort.k,d=PM.sort.d,tot=u=>(PM.cnt[u.id]||{tot:0}).tot;
 L.sort((a,b)=>k==="role"?d*(PM_RK.indexOf(a.role)-PM_RK.indexOf(b.role))||a.n.localeCompare(b.n,"th"):k==="docs"?d*(tot(a)-tot(b)):k==="ll"?d*String(a.ll).localeCompare(String(b.ll)):d*a.n.localeCompare(b.n,"th"));return L}
function pmSort(k){PM.sort=PM.sort.k===k?{k,d:-PM.sort.d}:{k,d:1};pmDrawList()}
function pmDrawList(){const body=$("pmRows");if(!body)return;const L=pmList(),cxu=new Set(PM.cx.map(c=>c.u));
 const sb=(k,l)=>`<button class="pm-sb ${PM.sort.k===k?"on":""}" onclick="pmSort('${k}')" title="เรียงตาม ${l}">${l}${icon(PM.sort.k===k?(PM.sort.d>0?"chevU":"chevD"):"sortb","sm")}</button>`;
 $("pmHead").innerHTML=`<tr><th class="c"><input type="checkbox" id="pmAll" aria-label="เลือกทั้งหมดที่แสดง" ${L.length&&L.every(u=>PM.chk.has(u.id))?"checked":""} onclick="pmChkAll(this.checked)"></th><th>${sb("n","ผู้ใช้")}</th><th>${sb("role","บทบาท")}</th><th>บริษัท</th><th>Oracle account</th><th class="num">${sb("docs","เห็นเอกสาร")}</th><th class="c-ll">${sb("ll","เข้าใช้ล่าสุด")}</th><th class="c"></th></tr>`;
 body.innerHTML=L.map(u=>{const bu=pmU(u.id,PM.b),a=pmAccts(PM.w,u.id),n=(PM.cnt[u.id]||{tot:0}).tot,nb=bu?(PM.cb[u.id]||{tot:0}).tot:0,iss=pmIssues(u).filter(i=>i.lv!=="info"),R=ROLES[u.role];
  const dl=bu?(n!==nb?`<span class="pm-dl ${n>nb?"up":"dn"}">${n>nb?"+":""}${n-nb}</span>`:""):'<span class="pm-dl up">ใหม่</span>';
  return `<tr class="click ${u.id===PM.sel?"sel":""} ${cxu.has(u.id)?"pm-dirty":""} ${u.off?"pm-off":""} ${PM.flash===u.id?"pm-flash":""}" data-id="${u.id}" tabindex="0" aria-label="${escA(u.n)}" onclick="pmSel('${u.id}')" onkeydown="pmRowKey(event,this)">
   <td class="c" onclick="event.stopPropagation()"><input type="checkbox" aria-label="เลือก ${escA(u.n)}" ${PM.chk.has(u.id)?"checked":""} onclick="pmChk('${u.id}',this.checked)"></td>
   <td><div class="pm-un"><span class="pm-av" style="background:${R.bg};color:${R.c}">${pmAv(u)}</span><div style="min-width:0"><b>${esc(u.n)}${u.off?' <span class="badge st-Rejected" style="height:16px;font-size:10px"><i></i>ระงับ</span>':""}</b><span class="e">${esc(u.email)}</span></div></div></td>
   <td>${pmRole(u.role)}${bu&&bu.role!==u.role?`<span class="pm-from">จาก ${PM_SN[bu.role]}</span>`:""}</td>
   <td><span class="pm-mini">${pmCos(u.co)}</span></td>
   <td>${u.role==="EU"?(a.length?`<span class="pm-mini"><span class="mono sm" title="${escA(a.join(", "))}">${esc(a[0])}</span>${a.length>1?`<span class="pm-more">+${a.length-1}</span>`:""}</span>`:'<span class="pre-x">ไม่ได้ผูก</span>'):'<span class="nac">—</span>'}</td>
   <td class="num">${u.role==="ADM"?'<span class="nac">—</span>':`<b>${n}</b>${dl}`}</td>
   <td class="mono sm c-ll">${pmTm(u.ll)}</td>
   <td class="c"><span class="pm-iss" title="${escA(iss.map(i=>i.t).join("\n"))}">${iss.some(i=>i.lv==="err")?`<span class="e">${icon("x")}</span>`:iss.length?`<span class="w">${icon("alert")}</span>`:""}</span></td></tr>`}).join("")
  ||`<tr><td colspan="8"><div class="empty">${icon("users")}ไม่พบผู้ใช้ตามตัวกรอง${PM.q||PM.fr!=="all"||PM.fw||PM.fd?`<div style="margin-top:10px"><button class="btn btn-sec sm" onclick="PM.q='';PM.fr='all';PM.fw=false;PM.fd=false;pmBuild();pmRefresh()">${icon("x","sm")}ล้างตัวกรอง</button></div>`:""}</div></td></tr>`;
 const b=$("pmBulk");if(b){const n=PM.chk.size;b.hidden=!n;
  if(n)b.innerHTML=`<b>เลือก ${n} คน</b><select id="pmBA" class="sel" aria-label="การดำเนินการกลุ่ม" onchange="pmBulkAct()"><option value="co+">เพิ่มบริษัท</option><option value="co-">ถอดบริษัท</option><option value="off">ระงับบัญชี</option><option value="on">เปิดใช้บัญชี</option></select>
   <select id="pmBC" class="sel" aria-label="บริษัท">${PM_CO.filter(c=>c!=="?").map(c=>`<option>${c}</option>`).join("")}</select><button class="btn btn-primary sm" onclick="pmBulkDo()">${icon("check","sm")}ใช้กับที่เลือก</button><button class="btn btn-ghost sm" onclick="PM.chk.clear();pmDrawList()">ล้างการเลือก</button><span class="muted xs">ข้ามตัวเองและผู้ใช้ที่ไม่เข้าเงื่อนไขโดยอัตโนมัติ · เลิกทำได้</span>`}
 const all=$("pmAll");if(all){const k=L.filter(u=>PM.chk.has(u.id)).length;all.indeterminate=k>0&&k<L.length}}
function pmChk(id,on){on?PM.chk.add(id):PM.chk.delete(id);pmDrawList()}
function pmChkAll(on){pmList().forEach(u=>on?PM.chk.add(u.id):PM.chk.delete(u.id));pmDrawList()}
function pmRowKey(e,tr){if(e.key==="Enter"||e.key===" "){e.preventDefault();pmSel(tr.dataset.id)}}
function pmDrawInsp(){const el=$("pmInsp");if(!el)return;const u=pmU(PM.sel);
 if(!u){el.innerHTML=`<div class="empty">${icon("users")}เลือกผู้ใช้จากรายการ</div>`;return}
 const bu=pmU(u.id,PM.b),isNew=!bu,self=u.id===ME.id,cx=PM.cx.filter(c=>c.u===u.id),iss=pmIssues(u),R=ROLES[u.role];
 const accts=pmAccts(PM.w,u.id),bAcc=bu?PM.b.maps.filter(m=>m.user===u.id).map(m=>m.acct):[];
 const cn=PM.cnt[u.id]||{tot:0,co:{}},cb=bu?PM.cb[u.id]:{tot:0,co:{}};
 const gone=bAcc.filter(a=>!accts.includes(a)),goneCo=bu?bu.co.filter(c=>!u.co.includes(c)):[];
 const docsOf=a=>DOCS.filter(d=>d.receiver===a),others=a=>PM.w.maps.filter(m=>m.acct===a&&m.user!==u.id).map(m=>(pmU(m.user)||{}).n).filter(Boolean);
 const unb=[...new Set(DOCS.map(d=>d.receiver).filter(Boolean))].filter(a=>!pmBound(PM.w,a)&&!accts.includes(a));
 const pOld=bu?(bu.off?[]:ROLES[bu.role].p):[],pNew=u.off?[]:R.p;
 const hasCx=cx.length;
 let h=`<div class="pm-ih"><span class="pm-av lg" style="background:${R.bg};color:${R.c}">${pmAv(u)}</span><div class="pm-ihm"><b>${esc(u.n)}${isNew?'<span class="bindtag">ใหม่ · ยังไม่บันทึก</span>':""}${self?'<span class="lockbadge">'+icon("lock","sm")+"บัญชีของคุณ</span>":""}</b>
   <div class="e">${esc(u.email)}<button class="pm-x" style="width:20px;height:20px" title="คัดลอกอีเมล" aria-label="คัดลอกอีเมล" onclick="copyTxt('${escA(u.email)}')">${icon("copy","sm")}</button></div><div class="xs muted">${esc(u.unit)} · EMPLOYEE_ID ${u.emp||"—"} · เข้าใช้ล่าสุด ${pmTm(u.ll)}</div></div>
   <div class="pm-iha"><button class="btn btn-sec sm" onclick="pmTestAs('${u.id}')" title="ดูว่าผู้ใช้นี้เห็นเอกสารกี่ฉบับ (นับจำนวนเท่านั้น)">${icon("eye","sm")}ทดสอบสิทธิ์</button><button class="btn btn-sec sm" ${hasCx?"":"disabled"} onclick="pmResetUser('${u.id}')" title="${isNew?"ลบผู้ใช้ใหม่นี้ออกจากร่าง":"คืนค่าผู้ใช้นี้เป็นค่าจริง"}">${icon("undo","sm")}${isNew?"ลบจากร่าง":"รีเซ็ต"}</button></div></div>`;
 if(hasCx)h+=`<div class="pm-chgbar">${icon("sliders","sm")}แก้ไขแล้ว ${hasCx} รายการ · ยังไม่มีผลจนกดบันทึก</div>`;
 h+=iss.map(i=>`<div class="pm-ib ${i.lv}">${icon(i.lv==="err"?"x":i.lv==="warn"?"alert":"info")}<span>${esc(i.t)}</span></div>`).join("");
 /* role */
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>บทบาท</h4><span>${self?"เปลี่ยนตัวเองไม่ได้":"เลือกได้ 1 บทบาท"}</span></div><div class="pm-sb2"><div class="pm-rcs" role="radiogroup" aria-label="บทบาท">`
  +PM_RK.map(r=>`<button type="button" class="pm-rc ${u.role===r?"on":""} ${bu&&bu.role!==u.role&&u.role===r?"chg":""}" role="radio" aria-checked="${u.role===r}" ${self?`disabled title="บัญชีของคุณเอง · เปลี่ยนไม่ได้"`:""} onclick="pmSetRole('${u.id}','${r}')">${pmRk(r)}<b>${ROLES[r].n}</b><span class="s">${ROLES[r].p.length} สิทธิ์ · ${PM_RS[r]}</span>${u.role===r?icon("check","sm"):""}</button>`).join("")
  +`</div></div></div>`;
 /* companies */
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>บริษัทที่รับผิดชอบ</h4><span>${u.co.length} บริษัท${u.co.length?" · ORG_ID "+u.co.flatMap(c=>COMPANY[c].orgs).join(", "):""}</span></div><div class="pm-sb2"><div class="pm-tgs" role="group" aria-label="บริษัท">`
  +PM_CO.map(c=>{const on=u.co.includes(c),was=bu?bu.co.includes(c):false,lock=u.role==="ADM"||(c==="?"&&u.role!=="APR");
   return `<button type="button" class="pm-tg ${on?"on":""} ${on!==was?"chg":""}" role="switch" aria-checked="${on}" ${lock?`disabled title="${u.role==="ADM"?"ผู้ดูแลระบบไม่ใช้ขอบเขตบริษัท":"บริษัท ? เฉพาะหัวหน้าฝ่ายบัญชี"}"`:`title="${escA(COMPANY[c].name)}"`} onclick="pmToggleCo('${u.id}','${c}')"><i class="pm-bx">${on?icon("check"):""}</i>${c}<small>${DOCS.filter(d=>d.company===c).length}</small></button>`}).join("")
  +`</div>${goneCo.length?`<div class="xs" style="color:var(--err)">ถอดแล้ว: <b>${goneCo.join(", ")}</b> · กดชิปเพื่อคืน</div>`:""}${u.role==="ADM"?'<div class="xs muted">ผู้ดูแลระบบไม่ใช้ขอบเขตบริษัท และไม่เห็นเนื้อหาเอกสาร</div>':'<div class="xs muted">ตัวเลขในชิป = จำนวนเอกสารของบริษัทนั้นในระบบ</div>'}</div></div>`;
 /* accounts */
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>Oracle account (RECEIVER)</h4><span>${u.role==="EU"?accts.length+" account":"ไม่ใช้กับบทบาทนี้"}</span></div><div class="pm-sb2">`;
 if(u.role!=="EU")h+=`<div class="xs muted">${icon("info","sm")} บทบาท ${R.n} ใช้ขอบเขตตามบริษัท ไม่ต้องผูก Oracle account (เปลี่ยนเป็นผู้ใช้งานเพื่อผูก)</div>`;
 else{
  h+=accts.map(a=>{const m=PM.w.maps.find(x=>x.user===u.id&&x.acct===a),isn=!bAcc.includes(a),o=others(a),ds=docsOf(a);
   return `<div class="pm-ar ${isn?"new":""}"><span class="a" title="${escA(a)}">${esc(a)}${isn?' <span class="rchip n">ใหม่</span>':""}</span><span class="m">${ds.length} ฉบับ · ${[...new Set(ds.map(d=>d.company))].join(", ")||"—"}${o.length?" · ใช้ร่วมกับ "+esc(o.join(", ")):""}</span><button type="button" class="pm-x" title="ยกเลิกการผูก ${escA(a)}" aria-label="ยกเลิกการผูก ${escA(a)}" onclick="pmDelAcct('${m.id}')">${icon("x","sm")}</button></div>`}).join("")
   ||`<div class="xs" style="color:var(--warn);font-weight:600">${icon("alert","sm")} ยังไม่ผูก account — ผู้ใช้จะไม่เห็นเอกสารใดเลย</div>`;
  h+=gone.map(a=>`<div class="pm-ar gone"><span class="a">${esc(a)}</span><span class="m" style="color:var(--err)">ยกเลิกการผูกแล้ว (ยังไม่บันทึก)</span><button type="button" class="pm-x ok" title="คืนการผูก" aria-label="คืนการผูก ${escA(a)}" onclick="pmAddAcct('${u.id}','${escA(a)}')">${icon("undo","sm")}</button></div>`).join("");
  h+=`<div class="pm-add"><input id="pmAcct" class="inp" list="pmAcctL" placeholder="พิมพ์หรือเลือก RECEIVER เช่น SOMSAK JAIDEE" aria-label="Oracle account" autocomplete="off" onkeydown="if(event.key==='Enter'){event.preventDefault();pmAddAcctIn('${u.id}')}"><datalist id="pmAcctL">${pmAcctList().map(a=>`<option value="${escA(a)}">`).join("")}</datalist><button type="button" class="btn btn-teal sm" onclick="pmAddAcctIn('${u.id}')">${icon("link","sm")}ผูก</button></div>`;
  if(unb.length)h+=`<div class="pm-sug"><span>รอผูก:</span>${unb.slice(0,5).map(a=>`<button type="button" class="chip" onclick="pmAddAcct('${u.id}','${escA(a)}')" title="ผูก ${escA(a)} · ${docsOf(a).length} ฉบับ">${icon("plus","sm")}${esc(a)} <span class="pm-cn">${docsOf(a).length}</span></button>`).join("")}</div>`}
 h+=`</div></div>`;
 /* status */
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>สถานะบัญชีในพอร์ทัล</h4><span>${bu&&bu.off!==u.off?"แก้ไขแล้ว":""}</span></div><div class="pm-sb2"><div class="seg" role="group" aria-label="สถานะบัญชี"><button type="button" class="${u.off?"":"on"}" ${self?"disabled":""} onclick="pmSetOff('${u.id}',false)">${icon("check","sm")}ใช้งาน</button><button type="button" class="${u.off?"on":""}" ${self?"disabled":""} onclick="pmSetOff('${u.id}',true)">${icon("ban","sm")}ระงับ</button></div><div class="xs muted">ระงับ = เข้าสู่ระบบและเห็นเอกสารไม่ได้ แต่คงการผูกและประวัติไว้ (ไม่ลบ)</div></div></div>`;
 /* permissions */
 const add=pNew.filter(p=>!pOld.includes(p)),del=pOld.filter(p=>!pNew.includes(p));
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>สิทธิ์ที่ได้รับ (ตามบทบาท)</h4><span><b>${pNew.length}</b> / ${Object.keys(PERM).length}${add.length?` · <b style="color:var(--ok)">+${add.length}</b>`:""}${del.length?` · <b style="color:var(--err)">−${del.length}</b>`:""}</span></div><div class="pm-sb2"><div class="pm-perm">`
  +Object.keys(PERM).map(p=>`<span class="pm-p ${pNew.includes(p)?"on":""} ${add.includes(p)?"add":""}" title="${escA(PERM[p])} (${p})">${esc(PERM[p])}</span>`).join("")+`</div>${del.length?`<div class="xs" style="color:var(--err)">สิทธิ์ที่เสียไป: ${del.map(p=>PERM[p]).join(" · ")}</div>`:""}</div></div>`;
 /* impact */
 const mx=Math.max(1,...Object.values(cn.co||{}));
 h+=`<div class="pm-sec"><div class="pm-sh"><h4>ผลลัพธ์: เอกสารที่เห็นได้</h4><span>นับจำนวนเท่านั้น (SEC-10)</span></div><div class="pm-sb2">`
  +(u.role==="ADM"?'<div class="xs muted">ผู้ดูแลระบบไม่เห็นเนื้อหาเอกสาร</div>':`<div style="display:flex;align-items:baseline;gap:8px"><span class="pm-big">${cn.tot}</span><span class="xs muted">ฉบับ${bu?" · ค่าจริงตอนนี้ "+cb.tot:""}</span>${bu&&cn.tot!==cb.tot?`<span class="pm-dl ${cn.tot>cb.tot?"up":"dn"}">${cn.tot>cb.tot?"+":""}${cn.tot-cb.tot}</span>`:""}</div>
   <div class="pm-imp">${PM_CO.filter(c=>cn.co[c]||(cb.co||{})[c]).map(c=>`<span class="co" style="margin:0">${c}</span><span style="display:flex;align-items:center;gap:6px"><span class="bar" style="flex:1"><i style="width:${Math.round((cn.co[c]||0)/mx*100)}%"></i></span><b class="mono">${cn.co[c]||0}</b></span>`).join("")||'<span class="xs muted" style="grid-column:1/3">ไม่เห็นเอกสารใดเลย</span>'}</div>`)
  +`</div></div>`;
 el.innerHTML=h;
 if(PM.focusAcct){PM.focusAcct=false;const a=$("pmAcct");if(a)a.focus({preventScroll:true})}}
function pmAcctList(){const set=new Set([...DOCS.map(d=>d.receiver).filter(Boolean),...PM.w.maps.map(m=>m.acct)]);return [...set].sort()}
/* ---------- Role × Permission ---------- */
function pmMxSel(k,v){PM.mx={k,v};pmDrawMx()}
function pmMxHover(e){const c=e.target.closest("td,th"),t=$("pmMx");if(!c||!t)return;t.dataset.hc=c.cellIndex>0?String(c.cellIndex+1):""}
function pmDrawMx(){const t=$("pmMx");if(!t)return;const cnt=r=>PM.w.users.filter(u=>u.role===r&&!u.off).length,S=PM.mx;
 t.innerHTML=`<thead><tr><th>สิทธิ์</th>${PM_RK.map(r=>`<th class="c ${S.k==="r"&&S.v===r?"sel":""}" style="width:120px"><button type="button" class="pm-th" onclick="pmMxSel('r','${r}')" title="ดูรายละเอียดบทบาท ${ROLES[r].n}">${pmRk(r)}<b>${ROLES[r].n}</b><span class="xs muted">${cnt(r)} คนที่ใช้งาน</span></button></th>`).join("")}</tr></thead>
  <tbody>${PM_GRP.map(([g,ps])=>`<tr class="grp-row"><td colspan="5">${g}</td></tr>`+ps.map(p=>`<tr class="click ${S.k==="p"&&S.v===p?"sel":""}" onclick="pmMxSel('p','${p}')"><td><b>${esc(PERM[p])}</b> <span class="muted xs mono">${p}</span></td>${PM_RK.map(r=>`<td class="c">${ROLES[r].p.includes(p)?`<span class="pm-ck" title="${ROLES[r].n} มีสิทธิ์นี้">${icon("check")}</span>`:'<span class="pm-no" title="ไม่มีสิทธิ์">—</span>'}</td>`).join("")}</tr>`).join("")).join("")}</tbody>`;
 const el=$("pmMside");if(!el)return;
 const ul=us=>`<div class="pm-ulist">${us.map(u=>`<button type="button" class="pm-ui ${u.off?"off":""}" onclick="pmOpenUser('${u.id}')" title="เปิดในแท็บผู้ใช้"><span class="pm-av" style="background:${ROLES[u.role].bg};color:${ROLES[u.role].c}">${pmAv(u)}</span><span class="grow"><b>${esc(u.n)}</b><div class="mono xs muted">${esc(u.email)}</div></span>${pmRole(u.role)}${icon("chevR","sm")}</button>`).join("")||'<div class="xs muted">ยังไม่มีผู้ใช้</div>'}</div>`;
 if(S.k==="r"){const r=S.v,R=ROLES[r],us=PM.w.users.filter(u=>u.role===r);
  el.innerHTML=`<div class="pm-ih"><span class="pm-av lg" style="background:${R.bg};color:${R.c};border-radius:10px">${r}</span><div class="pm-ihm"><b>${R.n}</b><div class="xs muted">${PM_RS[r]}</div></div></div>
   <div class="pm-sec"><div class="pm-sh"><h4>ข้อจำกัดตาม SRS v1.1</h4></div><div class="pm-sb2"><div class="sm">${PM_RESTR(r)}</div></div></div>
   <div class="pm-sec"><div class="pm-sh"><h4>สิทธิ์ที่มี</h4><span>${R.p.length} / ${Object.keys(PERM).length}</span></div><div class="pm-sb2"><div class="pm-perm">${Object.keys(PERM).map(p=>`<span class="pm-p ${R.p.includes(p)?"on":""}" title="${p}">${esc(PERM[p])}</span>`).join("")}</div></div></div>
   <div class="pm-sec"><div class="pm-sh"><h4>ผู้ใช้ในบทบาทนี้</h4><span>${us.length} คน</span></div><div class="pm-sb2">${ul(us)}</div></div>`}
 else{const p=S.v,rs=PM_RK.filter(r=>ROLES[r].p.includes(p)),us=PM.w.users.filter(u=>rs.includes(u.role));
  el.innerHTML=`<div class="pm-ih"><span class="pm-av lg" style="border-radius:10px;background:var(--ok-bg);color:var(--ok)">${icon("check","lg")}</span><div class="pm-ihm"><b>${esc(PERM[p])}</b><div class="mono xs muted">${p}</div></div></div>
   <div class="pm-sec"><div class="pm-sh"><h4>บทบาทที่มีสิทธิ์นี้</h4><span>${rs.length} / ${PM_RK.length}</span></div><div class="pm-sb2"><div style="display:flex;gap:6px;flex-wrap:wrap">${rs.map(r=>pmRole(r)).join("")||'<span class="xs muted">ไม่มีบทบาทใด</span>'}</div></div></div>
   <div class="pm-sec"><div class="pm-sh"><h4>ผู้ใช้ที่ได้สิทธิ์นี้</h4><span>${us.filter(u=>!u.off).length} ใช้งานอยู่ / ${us.length}</span></div><div class="pm-sb2">${ul(us)}</div></div>
   <div class="pm-ib info">${icon("lock")}<span>สิทธิ์นี้กำหนดโดยบทบาท · ปรับรายบุคคลไม่ได้ (ไม่มี permission ซับซ้อนนอก SRS) · ถ้าต้องการให้สิทธิ์เพิ่ม ให้เปลี่ยนบทบาทของผู้ใช้</span></div>`}}
/* ---------- Oracle accounts ---------- */
function pmAcctRows(){const emp={};USERS.forEach(u=>{if(u.rcvName&&u.rcvName!=="—"&&u.emp)emp[u.rcvName]=u.emp});
 return pmAcctList().map(a=>{const ds=DOCS.filter(d=>d.receiver===a),us=PM.w.maps.filter(m=>m.acct===a).map(m=>({m,u:pmU(m.user)})).filter(x=>x.u);
  const open=ds.filter(d=>["Auto-pass","Review","Hold","Manual Review"].includes(d.status)),bnd=pmBound(PM.w,a);
  const lock=bnd?0:ds.filter(d=>["Review","Hold"].includes(d.status)&&d.codes.some(c=>EUCODES.has(c))).length;
  const old=open.length?open.map(d=>d.up).sort()[0]:null;
  return {a,emp:emp[a],ds,us,open:open.length,lock,old,bnd,cos:[...new Set(ds.map(d=>d.company))].sort((x,y)=>PM_CO.indexOf(x)-PM_CO.indexOf(y))}})}
function pmDrawAcc(){const body=$("pmArows");if(!body)return;const A=pmAcctRows(),q=PM.aq.trim().toLowerCase();
 const F={all:["ทั้งหมด",()=>true],unb:["รอผูก",r=>!r.bnd],multi:["ผูกหลายคน",r=>r.us.length>1],lock:["มีเอกสารถูกล็อก",r=>r.lock>0]};
 const ch=$("pmAchips");if(ch)ch.innerHTML=Object.entries(F).map(([k,[l,f]])=>`<button class="chip ${PM.af===k?"on":""}" aria-pressed="${PM.af===k}" onclick="PM.af='${k}';pmDrawAcc()">${l} <span class="pm-cn">${A.filter(f).length}</span></button>`).join("");
 const L=A.filter(F[PM.af][1]).filter(r=>!q||(r.a+" "+r.us.map(x=>x.u.n+" "+x.u.email).join(" ")).toLowerCase().includes(q)).sort((x,y)=>y.lock-x.lock||(x.bnd-y.bnd)||x.a.localeCompare(y.a));
 const bm=new Set(PM.b.maps.map(m=>m.id)),eus=PM.w.users.filter(u=>u.role==="EU"&&!u.off);
 body.innerHTML=L.map((r,i)=>{const cand=eus.filter(u=>!r.us.some(x=>x.u.id===u.id));
  return `<tr class="${r.lock?"row-bad":""} ${r.us.some(x=>!bm.has(x.m.id))?"pm-dirty":""}"><td><span class="mono b">${esc(r.a)}</span>${r.emp?`<div class="mono xs muted">EMP ${r.emp}</div>`:""}</td><td>${pmCos(r.cos)}</td>
   <td>${r.us.length?`<span class="pm-mini" style="flex-wrap:wrap">${r.us.map(x=>`<span class="chip" style="height:24px;gap:4px;padding:0 3px 0 9px;${bm.has(x.m.id)?"":"border-color:#F59E0B;background:var(--warn-bg)"}" title="${escA(x.u.email)}">${esc(x.u.n)}<button type="button" class="pm-x" style="width:18px;height:18px;border-radius:999px;box-shadow:none" aria-label="ยกเลิกการผูก ${escA(x.u.n)}" onclick="pmDelAcct('${x.m.id}')">${icon("x","sm")}</button></span>`).join("")}</span>`:'<span class="pre-x">ไม่มีผู้ใช้</span>'}</td>
   <td class="num">${r.ds.length}</td><td class="num">${r.open}</td><td class="num ${r.lock?"badc":"nac"}">${r.lock||"—"}</td><td class="mono sm">${r.old?dmy(r.old)+" ("+Math.max(0,Math.round((new Date(TODAY+"T00:00:00Z")-new Date(r.old+"T00:00:00Z"))/864e5))+" วัน)":"—"}</td>
   <td>${r.bnd?`<span class="badge st-Auto-pass"><i></i>ผูกแล้ว${r.us.length>1?" "+r.us.length:""}</span>`:'<span class="bindtag">รอผูก</span>'}</td>
   <td>${cand.length?`<div class="pm-add" style="min-width:230px"><select id="pmAs${i}" class="sel" style="flex:1;min-width:0" aria-label="เลือกผู้ใช้ที่จะผูกกับ ${escA(r.a)}">${cand.map(u=>`<option value="${u.id}">${esc(u.n)}</option>`).join("")}</select><button type="button" class="btn btn-teal sm" onclick="pmAddAcct(document.getElementById('pmAs${i}').value,'${escA(r.a)}')">${icon("link","sm")}ผูก</button></div>`:'<span class="muted xs">ไม่มีผู้ใช้งานที่ผูกเพิ่มได้</span>'}</td></tr>`}).join("")
  ||`<tr><td colspan="9"><div class="empty">${icon("link")}ไม่พบ Oracle account ตามตัวกรอง</div></td></tr>`}
/* ---------- Company grid ---------- */
function pmDrawCo(){const h=$("pmCh");if(!h)return;const bu=id=>pmU(id,PM.b);
 const US=PM.w.users.slice().sort((a,b)=>PM_RK.indexOf(a.role)-PM_RK.indexOf(b.role)||a.n.localeCompare(b.n,"th")),cxu=new Set(PM.cx.map(c=>c.u));
 h.innerHTML=`<tr><th>ผู้ใช้</th><th style="width:150px">บทบาท</th>${PM_CO.map(c=>`<th class="c" title="${escA(COMPANY[c].name)}">${c}<div class="xs muted" style="font-weight:600">${c==="?"?"APR เท่านั้น":COMPANY[c].orgs.join(" · ")}</div></th>`).join("")}<th class="num" style="width:60px">รวม</th></tr>`;
 $("pmCrows").innerHTML=US.map(u=>{const b=bu(u.id),na=u.role==="ADM";
  return `<tr class="${na?"na":""} ${cxu.has(u.id)?"pm-dirty":""} ${PM.flash===u.id?"pm-flash":""} ${u.off?"pm-off":""}"><td><button type="button" class="link" onclick="pmOpenUser('${u.id}')" title="เปิดในแท็บผู้ใช้">${esc(u.n)}</button></td><td>${pmRole(u.role)}</td>
   ${PM_CO.map(c=>{const on=u.co.includes(c),was=b?b.co.includes(c):false,lock=na||(c==="?"&&u.role!=="APR");
    return `<td class="c"><button type="button" class="pm-cell ${on?"on":""} ${on!==was?"chg":""}" role="checkbox" aria-checked="${on}" aria-label="${escA(u.n)} · ${c}" ${lock?`disabled title="${na?"ผู้ดูแลระบบไม่ใช้ขอบเขตบริษัท":"บริษัท ? เฉพาะหัวหน้าฝ่ายบัญชี"}"`:""} onclick="pmToggleCo('${u.id}','${c}')">${lock?icon("lock"):on?icon("check"):""}</button></td>`}).join("")}<td class="num">${na?"—":u.co.length}</td></tr>`}).join("");
 const act=PM.w.users.filter(u=>!u.off),row=(r,l)=>`<tr><td colspan="2">${l}</td>${PM_CO.map(c=>{const n=act.filter(u=>u.role===r&&u.co.includes(c)).length;return `<td class="c ${r==="APR"&&!n?"badc":""}">${n||(r==="APR"?"0 ⚠":"0")}</td>`}).join("")}<td></td></tr>`;
 $("pmCf").innerHTML=row("EU","ผู้ใช้งาน (EU) ที่ใช้งานอยู่")+row("ACC","เจ้าหน้าที่บัญชี (ACC)")+row("APR","หัวหน้าฝ่ายบัญชี (APR)");
 const G=pmGlobal().filter(i=>i.lv!=="x"),el=$("pmCside");
 el.innerHTML=`<div class="pm-sec"><div class="pm-sh"><h4>บริษัทและ ORG_ID (ตารางที่ 4)</h4></div><div class="tbl-wrap" style="border:0;border-radius:0"><table class="t"><thead><tr><th>บริษัท</th><th>Tax ID</th><th>ORG_ID</th></tr></thead><tbody>${PM_CO.map(c=>`<tr><td><span class="co" style="margin:0">${c}</span> <span class="xs">${esc(COMPANY[c].name)}</span></td><td class="mono xs">${COMPANY[c].tax}</td><td class="mono xs">${COMPANY[c].orgs.map(o=>o+" "+ORG[o]).join(", ")}</td></tr>`).join("")}</tbody></table></div></div>
  <div class="pm-sec"><div class="pm-sh"><h4>กติกา</h4></div><div class="pm-sb2"><div class="xs">• บริษัท = นิติบุคคลตาม Tax ID ครอบคลุมทุก ORG_ID ใต้บริษัทนั้น</div><div class="xs">• ผู้ใช้งาน (EU) ต้องตรงทั้ง <b>บริษัท</b> และ <b>Receiver</b> จึงเห็นเอกสาร</div><div class="xs">• บริษัท “?” (ORG_ID ยังไม่ทราบ) กำหนดได้เฉพาะหัวหน้าฝ่ายบัญชี</div><div class="xs">• ผู้ดูแลระบบไม่ใช้ขอบเขตบริษัท</div></div></div>
  <div class="pm-sec"><div class="pm-sh"><h4>ความครอบคลุม</h4><span>${G.length} ข้อสังเกต</span></div><div class="pm-sb2">${G.map(i=>`<div class="pm-ib ${i.lv}">${icon(i.lv==="err"?"x":"alert")}<span>${esc(i.t)}</span></div>`).join("")||`<div class="pm-ib info">${icon("checkc")}<span>ทุกบริษัทมีหัวหน้าฝ่ายบัญชีที่ใช้งานอยู่</span></div>`}</div></div>`}
/* ---------- Access tester ---------- */
function pmFixCo(id,c){pmToggleCo(id,c)}
function pmDrawTester(){const rail=$("pmRail"),main=$("pmTmain");if(!rail||!main)return;const u=pmU(PM.tu);if(!u){main.innerHTML="";return}
 const cxu=new Set(PM.cx.map(c=>c.u));
 rail.innerHTML=`<div class="ph">ดูในฐานะผู้ใช้</div>`+PM.w.users.map(x=>`<button type="button" class="pm-ri ${x.id===PM.tu?"on":""}" onclick="PM.tu='${x.id}';pmDrawTester()"><span class="pm-av" style="background:${ROLES[x.role].bg};color:${ROLES[x.role].c}">${pmAv(x)}</span><span style="min-width:0"><b>${esc(x.n)}</b><span class="s">${x.role}${x.off?" · ระงับ":""}${cxu.has(x.id)?" · มีร่าง":""}</span></span><span class="n">${x.role==="ADM"?"—":(PM.cnt[x.id]||{tot:0}).tot}</span></button>`).join("");
 const useDraft=PM.tdr,W=useDraft?PM.w:PM.b,uu=useDraft?u:(pmU(u.id,PM.b)||u),cur=useDraft?PM.cnt[u.id]:(PM.cb[u.id]||pmCount(uu,PM.b)),base=pmU(u.id,PM.b)?PM.cb[u.id]:null,cmp=useDraft&&PM.tcmp&&base;
 const R=ROLES[uu.role],pp=uu.off?[]:R.p;
 const D=(n,b)=>cmp&&n!==b?`<span class="pm-dl ${n>b?"up":"dn"}">${n>b?"+":""}${n-b}</span>`:"";
 const cos=PM_CO.filter(c=>DOCS.some(d=>d.company===c));
 let h=`<div class="pm-tctl"><span class="b sm">ดูตาม</span><div class="seg" role="group" aria-label="แหล่งข้อมูลสิทธิ์"><button type="button" class="${useDraft?"on":""}" onclick="PM.tdr=true;pmDrawTester()">${icon("sliders","sm")}ร่างที่ยังไม่บันทึก</button><button type="button" class="${useDraft?"":"on"}" onclick="PM.tdr=false;pmDrawTester()">${icon("shield","sm")}ค่าจริงในระบบ</button></div>
  <label class="chk" style="padding:0"><input type="checkbox" ${PM.tcmp?"checked":""} ${useDraft?"":"disabled"} onchange="PM.tcmp=this.checked;pmDrawTester()">แสดงส่วนต่างจากค่าจริง</label><span class="grow"></span><button type="button" class="btn btn-sec sm" onclick="pmOpenUser('${u.id}')">${icon("users","sm")}แก้ไขผู้ใช้นี้</button></div>
  <div class="pm-ih"><span class="pm-av lg" style="background:${R.bg};color:${R.c}">${pmAv(uu)}</span><div class="pm-ihm"><b>${esc(uu.n)} ${pmRole(uu.role)}${uu.off?'<span class="badge st-Rejected"><i></i>ระงับ</span>':""}</b><div class="xs muted">บริษัท ${uu.co.join(", ")||"—"}${uu.role==="EU"?" · Oracle account: "+(pmAccts(W,uu.id).join(", ")||"—"):""}</div></div><div style="text-align:right"><span class="pm-big">${uu.role==="ADM"?"—":cur.tot}</span>${uu.role==="ADM"?"":D(cur.tot,base?base.tot:0)}<div class="xs muted">เอกสารที่เห็นได้</div></div></div>`;
 if(uu.role==="ADM")h+=`<div class="pm-ib info">${icon("lock")}<span>ผู้ดูแลระบบไม่เห็นเนื้อหาเอกสาร (SEC-10) · เห็นเฉพาะหน้าจัดการสิทธิ์และบันทึกการเข้าถึง</span></div>`;
 else{
  h+=`<div class="pm-sec"><div class="pm-sh"><h4>เอกสารที่ผู้ใช้นี้เห็น แยกตามบริษัท × สถานะ</h4><span>นับจำนวนเท่านั้น · ไม่แสดงเลขที่ใบแจ้งหนี้</span></div><div style="overflow:auto"><table class="pm-vm"><thead><tr><th>บริษัท</th>${PM_STS.map(s=>`<th>${s}</th>`).join("")}<th>รวม</th></tr></thead><tbody>`
   +cos.map(c=>`<tr><td><span class="co" style="margin:0">${c}</span></td>${PM_STS.map(s=>{const n=cur.st[c+"|"+s]||0,b=base?(base.st[c+"|"+s]||0):0;return `<td class="${n?"h":"z"}">${n||"·"}${D(n,b)}</td>`}).join("")}<td><b>${cur.co[c]||0}</b>${D(cur.co[c]||0,base?(base.co[c]||0):0)}</td></tr>`).join("")
   +`<tr class="tot"><td>รวม</td>${PM_STS.map(s=>`<td>${cos.reduce((a,c)=>a+(cur.st[c+"|"+s]||0),0)||"·"}</td>`).join("")}<td>${cur.tot}</td></tr></tbody></table></div></div>`;
  const hid=Object.entries(cur.hid);
  h+=`<div class="pm-sec"><div class="pm-sh"><h4>เอกสารที่ถูกซ่อนจากผู้ใช้นี้ และเหตุผล</h4><span>${cur.hidN} ฉบับ</span></div>`
   +(hid.length?hid.sort((x,y)=>y[1].n-x[1].n).map(([why,o])=>{let fx="";
     if(why==="co")fx=Object.entries(o.k).sort((x,y)=>y[1]-x[1]).map(([c,n])=>{const can_=uu.role!=="ADM"&&(c!=="?"||uu.role==="APR");return `<button type="button" class="btn btn-sec sm" ${can_?"":"disabled"} onclick="PM.tdr=true;pmFixCo('${u.id}','${c}')" title="${can_?"เพิ่มบริษัท "+c+" ให้ผู้ใช้นี้ (ร่าง)":"กำหนดไม่ได้ตามบทบาท"}">${icon("plus","sm")}เพิ่มบริษัท ${c} <span class="pm-cn">+${n}</span></button>`}).join("");
     else if(why==="notme")fx=Object.entries(o.k).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([a,n])=>`<button type="button" class="btn btn-sec sm" ${uu.role==="EU"?"":"disabled"} onclick="PM.tdr=true;pmAddAcct('${u.id}','${escA(a)}')" title="ผูก ${escA(a)} ให้ผู้ใช้นี้ (ร่าง)">${icon("link","sm")}ผูก ${esc(a)} <span class="pm-cn">+${n}</span></button>`).join("");
     return `<div class="pm-hid"><div><b>${PM_WHY[why]}</b>${fx?`<div class="fx">${fx}</div>`:""}</div><span class="mono b">${o.n}</span></div>`}).join(""):`<div class="pm-hid"><span style="color:var(--ok)">${icon("checkc","sm")} ไม่มีเอกสารที่ถูกซ่อน</span></div>`)+`</div>`;
  h+=`<div class="pm-sec"><div class="pm-sh"><h4>สิทธิ์การดำเนินการ</h4><span>${pp.length} / ${Object.keys(PERM).length}</span></div><div class="pm-sb2"><div class="pm-perm" style="grid-template-columns:repeat(3,1fr)">${Object.keys(PERM).map(p=>`<span class="pm-p ${pp.includes(p)?"on":""}" title="${p}">${esc(PERM[p])}</span>`).join("")}</div></div></div>`}
 main.innerHTML=h}
/* ---------- Change log ---------- */
function pmLogRows(){const q=PM.lq.trim().toLowerCase();return PMH.filter(h=>(PM.lf==="all"||h.ty===PM.lf)&&(!q||(uName(h.u)+" "+h.txt+" "+h.from+" "+h.to+" "+h.ref+" "+h.by).toLowerCase().includes(q)))}
function pmDrawLog(){const body=$("pmLrows");if(!body)return;const L=pmLogRows();
 const c=$("pmLchips");if(c)c.innerHTML=`<button class="chip ${PM.lf==="all"?"on":""}" onclick="PM.lf='all';pmDrawLog()">ทั้งหมด <span class="pm-cn">${PMH.length}</span></button>`+Object.entries(PM_TY).map(([k,[ic,l]])=>`<button class="chip ${PM.lf===k?"on":""}" onclick="PM.lf='${k}';pmDrawLog()">${icon(ic,"sm")}${l} <span class="pm-cn">${PMH.filter(h=>h.ty===k).length}</span></button>`).join("");
 body.innerHTML=L.map(h=>`<tr><td class="mono">${dmy(h.dt)}</td><td class="mono">${h.t}</td><td>${esc(h.by)}</td><td><span class="pill">${icon(PM_TY[h.ty][0],"sm")}${PM_TY[h.ty][1]}</span></td><td><b>${esc(uName(h.u))}</b></td><td>${esc(h.txt)}</td><td class="sm">${esc(h.from)}</td><td class="sm"><b>${esc(h.to)}</b></td><td class="mono sm">${esc(h.ref)}</td></tr>`).join("")
  ||`<tr><td colspan="9"><div class="empty">${icon("inbox")}ไม่พบรายการ</div></td></tr>`}
function pmExport(){const L=pmLogRows(),rows=[["วันที่","เวลา","ผู้ดำเนินการ","ประเภท","ผู้ใช้","รายการ","ก่อน","หลัง","อ้างอิง"],...L.map(h=>[h.dt,h.t,h.by,PM_TY[h.ty][1],uName(h.u),h.txt,h.from,h.to,h.ref])];
 const csv="\ufeff"+rows.map(r=>r.map(x=>'"'+String(x==null?"":x).replace(/"/g,'""')+'"').join(",")).join("\r\n"),b=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
 a.href=URL.createObjectURL(b);a.download="aiva-permission-changes.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("ส่งออก CSV "+L.length+" รายการ")}
/* ---------- Add user (จาก Entra ID) ---------- */
function pmAddUserOpen(){if(!pmGuard())return;PM.dsel=null;
 modal("เพิ่มผู้ใช้จาก Entra ID","เลือกบัญชีที่ยังไม่อยู่ในพอร์ทัล · เพิ่มเป็นร่าง ยังไม่มีผลจนกดบันทึก","userplus","info",
  `<label for="pmDq" class="pm-lb">ค้นหาใน Entra ID</label><input id="pmDq" placeholder="ชื่อหรืออีเมล" oninput="pmDirDraw()" autocomplete="off"><div class="pm-dir" id="pmDir" role="listbox" aria-label="บัญชี Entra ID"></div>
   <label for="pmDr" class="pm-lb">บทบาทเริ่มต้น</label><select id="pmDr">${PM_RK.map(r=>`<option value="${r}">${ROLES[r].n}</option>`).join("")}</select>
   <div class="note i" style="margin-top:10px">${icon("info")}<div>เพิ่มแล้วกำหนด <b>บริษัท</b> และ <b>Oracle account</b> ต่อที่แผงขวา · ผู้ใช้ที่ยังไม่มีบริษัท/account จะไม่เห็นเอกสารใด</div></div>`,icon("userplus","sm")+"เพิ่มเป็นร่าง","btn-teal",pmAddUserDo);
 pmDirDraw()}
function pmDirDraw(){const q=($("pmDq")||{value:""}).value.trim().toLowerCase(),has=new Set(PM.w.users.map(u=>u.email)),L=PM_DIR.filter(p=>!has.has(p.email)&&(!q||(p.n+" "+p.email).toLowerCase().includes(q)));
 $("pmDir").innerHTML=L.map(p=>`<button type="button" class="pm-dirit ${PM.dsel===p.id?"on":""}" role="option" aria-selected="${PM.dsel===p.id}" onclick="PM.dsel='${p.id}';pmDirDraw()"><span class="pm-av">${pmAv(p)}</span><span><b>${esc(p.n)}</b><span class="e">${esc(p.email)} · ${esc(p.unit)}</span></span>${PM.dsel===p.id?icon("check","sm"):""}</button>`).join("")||'<div class="xs muted" style="padding:8px">ไม่พบบัญชีที่ยังไม่อยู่ในพอร์ทัล</div>'}
function pmAddUserDo(){if(!pmGuard()){closeM();return}const p=PM_DIR.find(x=>x.id===PM.dsel);if(!p)return toast("เลือกบัญชีจาก Entra ID ก่อน",1);
 const role=$("pmDr").value,id="u"+(Math.max(...USERS.map(u=>+u.id.slice(1)),...PM.w.users.map(u=>+u.id.slice(1)))+1);
 pmPush();PM.w.users.push({id,n:p.n,email:p.email,role,co:[],emp:null,unit:p.unit,off:false,ll:"—",isNew:true});PM.sel=id;PM.fr="all";PM.fw=false;PM.fd=false;PM.q="";PM.flash=id;PM.tab="users";closeM();pmBuild();pmRefresh();
 toast("เพิ่ม "+p.n+" เป็นร่างแล้ว · กำหนดบริษัทและ Oracle account ต่อได้เลย");const r=document.querySelector(`#pmRows tr[data-id="${id}"]`);if(r)r.scrollIntoView({block:"nearest"})}
/* ---------- Apply ---------- */
function pmDiffHtml(){const by={};PM.cx.forEach(c=>(by[c.u]=by[c.u]||[]).push(c));
 return Object.entries(by).map(([id,L])=>{const u=pmU(id),b=pmU(id,PM.b),n=(PM.cnt[id]||{tot:0}).tot,nb=b?(PM.cb[id]||{tot:0}).tot:0;
  return `<div class="pm-diff"><div class="u"><span class="pm-av" style="background:${ROLES[u.role].bg};color:${ROLES[u.role].c}">${pmAv(u)}</span><b>${esc(u.n)}</b>${pmRole(u.role)}<span class="grow"></span>${u.role==="ADM"?"":`<span class="xs muted">เห็นเอกสาร <b class="mono">${nb}</b> → <b class="mono">${n}</b></span>${n!==nb?`<span class="pm-dl ${n>nb?"up":"dn"}">${n>nb?"+":""}${n-nb}</span>`:""}`}</div>`
   +L.map(c=>{const K=PM_KL[c.k];let t=c.k==="add"?`เป็น <b>${esc(c.to)}</b>`:c.k==="role"||c.k==="off"?`<s>${esc(c.from)}</s> → <b>${esc(c.to)}</b>`:c.k==="co+"||c.k==="acct+"?`<b>${esc(c.to)}</b>`:`<s>${esc(c.from)}</s>`;
    return `<div class="pm-df"><span class="pm-dk ${K[2]}">${icon(K[0])}${K[1]}</span><span>${t}</span>${c.esc?'<span class="esc">ยกระดับสิทธิ์</span>':""}</div>`}).join("")+`</div>`}).join("")}
function pmApplyOpen(){if(!pmGuard())return;if(!PM.cx.length)return;const A=pmAll();
 if(A.errs.length){toast("แก้ข้อผิดพลาดก่อนบันทึก: "+A.errs[0].t,1);pmShowIssues();return}
 const us=new Set(PM.cx.map(c=>c.u)),esc_=PM.cx.some(c=>c.esc),up=PM.cx.filter(c=>c.k==="co+"||c.k==="acct+"||c.k==="add").length,dn=PM.cx.filter(c=>c.k==="co-"||c.k==="acct-"||c.k==="off").length;
 modal("ยืนยันการเปลี่ยนสิทธิ์",PM.cx.length+" รายการ · "+us.size+" ผู้ใช้ · มีผลทันทีหลังบันทึก","shield","warn",
  `<div class="pm-sum"><div class="card"><b>${PM.cx.length}</b><span>รายการ</span></div><div class="card"><b>${us.size}</b><span>ผู้ใช้</span></div><div class="card"><b style="color:var(--ok)">+${up}</b><span>ให้สิทธิ์เพิ่ม</span></div><div class="card"><b style="color:var(--err)">−${dn}</b><span>ลด/ถอนสิทธิ์</span></div></div>
   ${pmDiffHtml()}${A.warns.length?`<div class="note w" style="margin:0 0 8px">${icon("alert")}<div><b>คำเตือน ${A.warns.length} ข้อ (บันทึกได้)</b>${A.warns.slice(0,4).map(w=>`<div style="margin-top:3px">• ${esc(w.t)}</div>`).join("")}</div></div>`:""}
   <label for="pmAref" class="pm-lb">อ้างอิงคำขอ (ticket / อีเมล) <span class="req">*</span></label><input id="pmAref" placeholder="เช่น INC-1055" value="${escA(PM.ref)}" autocomplete="off">
   ${esc_?`<div class="pm-mfa"><label for="pmAmfa" class="pm-lb">รหัส MFA <span class="req">* ยกระดับสิทธิ์</span></label><input id="pmAmfa" type="password" placeholder="mockup ใช้ 123456" autocomplete="off"></div>`:""}`,
  icon("save","sm")+"บันทึก "+PM.cx.length+" รายการ","btn-primary",pmApply)}
function pmSnapLive(){return {users:USERS.map(u=>({id:u.id,role:u.role,co:[...u.co],off:!!u.off})),maps:MAPS.map(m=>({...m}))}}
function pmApply(){if(!pmGuard()){closeM();return}if(!PM.cx.length){closeM();return}
 const ref=($("pmAref").value||"").trim();if(!ref){$("pmAref").focus();return toast("ระบุอ้างอิงคำขอ (ticket / อีเมล) ก่อนบันทึกทุกครั้ง",1)}
 if(PM.cx.some(c=>c.esc)&&($("pmAmfa")||{}).value!=="123456"){log("ยืนยัน MFA ไม่สำเร็จ","—","เปลี่ยนสิทธิ์ (ยกระดับ)");$("pmAmfa").focus();return toast("รหัส MFA ไม่ถูกต้อง",1)}
 const A=pmAll();if(A.errs.length){closeM();return toast("พบข้อผิดพลาด: "+A.errs[0].t,1)}
 const btn=$("mok");btn.classList.add("is-busy");btn.disabled=true;btn.innerHTML='<span class="spn" aria-hidden="true"></span>กำลังบันทึก…';
 setTimeout(()=>pmCommit(ref),RM()?0:450)}
function pmCommit(ref){const cx=PM.cx.slice(),snap=pmSnapLive(),bm=new Set(PM.b.maps.map(m=>m.id)),n=cx.length;PM.ref=ref;
 PM.w.users.forEach(wu=>{let u=USERS.find(x=>x.id===wu.id);if(!u){u={id:wu.id,n:wu.n,email:wu.email,role:wu.role,rcvName:"—",emp:null,co:[],unit:wu.unit,off:false,ll:"—"};USERS.push(u)}u.role=wu.role;u.co=[...wu.co];u.off=wu.off});
 MAPS.length=0;PM.w.maps.forEach(m=>MAPS.push(bm.has(m.id)?{...m}:{...m,by:ME.n,at:TODAY,req:ref}));
 cx.forEach(c=>{const nm=uName(c.u),K=PM_KL[c.k],ty=c.k==="role"?"role":c.k.startsWith("co")?"co":c.k.startsWith("acct")?"acct":c.k;
  PMH.unshift({dt:TODAY,t:now(),by:ME.n,ty,u:c.u,txt:K[1],from:c.from||"—",to:c.to||"—",ref});
  setLog("สิทธิ์ผู้ใช้ · "+nm+" · "+K[1],c.from||"—",c.to||"—",ref)});
 refreshBinding();
 PM.b=pmClone();PM.w=pmClone();PM.bsig=JSON.stringify(PM.b);PM.hist=[];PM.redo=[];PM.applied={snap,n,ref,cx};
 const us=$("user");if(us){us.innerHTML=USERS.map(u=>`<option value="${u.id}">${u.n} — ${ROLES[u.role].n}</option>`).join("");us.value=ME.id}
 const la=$("lgAcct");if(la)la.innerHTML=USERS.map(u=>`<option value="${u.id}">${u.n} · ${ROLES[u.role].n}</option>`).join("");
 closeM();pmFix();pmRefresh();
 document.querySelectorAll(".toast.tu").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast tu";t.setAttribute("role","status");
 t.innerHTML=icon("checkc")+`<span>บันทึกแล้ว ${n} รายการ · อ้างอิง ${esc(ref)} · บันทึกใน Audit</span><button type="button" class="tu-b">ย้อนกลับ</button>`;t.querySelector("button").onclick=()=>{pmUndoApplied();t.remove()};$("toasts").appendChild(t);setTimeout(()=>t.remove(),9000)}
function pmUndoApplied(){const a=PM.applied;if(!a||!pmGuard())return;const S=a.snap,keep=new Set(S.users.map(u=>u.id));
 S.users.forEach(s=>{const u=USERS.find(x=>x.id===s.id);if(u){u.role=s.role;u.co=[...s.co];u.off=s.off}});
 for(let i=USERS.length-1;i>=0;i--)if(!keep.has(USERS[i].id))USERS.splice(i,1);
 MAPS.length=0;S.maps.forEach(m=>MAPS.push({...m}));refreshBinding();
 PMH.unshift({dt:TODAY,t:now(),by:ME.n,ty:"undo",u:a.cx[0].u,txt:"ย้อนกลับการบันทึก "+a.n+" รายการ",from:"—",to:"คืนค่าเดิม",ref:a.ref});
 log("ย้อนกลับการเปลี่ยนสิทธิ์","—",a.n+" รายการ · อ้างอิง "+a.ref);PM.applied=null;
 PM.b=pmClone();PM.w=pmClone();PM.bsig=JSON.stringify(PM.b);PM.hist=[];PM.redo=[];
 const us=$("user");if(us){us.innerHTML=USERS.map(u=>`<option value="${u.id}">${u.n} — ${ROLES[u.role].n}</option>`).join("");us.value=ME.id}
 pmFix();pmRefresh();toast("ย้อนกลับการบันทึกแล้ว · คืนค่าเดิมทั้งหมด")}
/* ---------- keyboard ---------- */
document.addEventListener("keydown",e=>{if(page!=="perm"||!$("pm"))return;const ov=$("ov").classList.contains("on"),tg=e.target.tagName,inp=/INPUT|TEXTAREA|SELECT/.test(tg);
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();if(!ov&&PM.cx.length)pmApplyOpen();return}
 if(ov)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!(inp&&tg!=="SELECT"&&e.target.type!=="checkbox")){e.preventDefault();e.shiftKey?pmRedo():pmUndo();return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"&&!inp){e.preventDefault();pmRedo();return}
 if(inp||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==="/"&&PM.tab==="users"){e.preventDefault();const q=$("pmQ");if(q)q.focus();return}
 if(e.key==="Escape"&&PM.chk.size&&PM.tab==="users"){PM.chk.clear();pmDrawList();return}
 if((e.key==="ArrowDown"||e.key==="ArrowUp")&&PM.tab==="users"){const L=pmList(),i=L.findIndex(u=>u.id===PM.sel),n=L[Math.min(L.length-1,Math.max(0,i+(e.key==="ArrowDown"?1:-1)))];
  if(n&&n.id!==PM.sel){e.preventDefault();pmSel(n.id);const r=document.querySelector(`#pmRows tr[data-id="${n.id}"]`);if(r)r.scrollIntoView({block:"nearest"})}}});

}
