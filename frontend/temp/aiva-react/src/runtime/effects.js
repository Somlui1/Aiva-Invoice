// Retained runtime module. Dynamic DOM remains owned by this compatibility layer.
export function initializeEffects() {

/* AIVA v5.2 · UI layer — ธีม Dark/Light + FX (สลับธีม · เข้าแอป · กลับเข้าเซสชัน · ออกจากระบบ) · Command Palette · Breadcrumb
   ไม่แก้ logic ธุรกิจ: เรียกเฉพาะฟังก์ชันเดิมของ v4.22 (go / openFromTable / toggleNav / LGX.logout) */
(function(){
"use strict";
var root=document.documentElement,$=function(id){return document.getElementById(id)};
var RMQ=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)");
var NOFX=function(){return !!(RMQ&&RMQ.matches)};
var ic=function(n,c){return typeof icon==="function"?icon(n,c||""):""};
function esc2(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function gUSERS(){try{return USERS}catch(e){return null}}
function gROLES(){try{return ROLES}catch(e){return null}}
function gME(){try{return ME}catch(e){return null}}
function initial(n){n=String(n||"").trim().replace(/^[เแโใไ]/,"");return n?n.charAt(0).toUpperCase():"A"}

var EASE="cubic-bezier(.45,.05,.2,1)",DUR=860;
var FX={exitMs:NOFX()?160:640};
function layer(){var l=$("fxLayer");if(!l){l=document.createElement("div");l.id="fxLayer";l.className="fx-layer";l.setAttribute("aria-hidden","true");document.body.appendChild(l)}return l}
function el(cls,css){var e=document.createElement("div");e.className=cls;if(css)e.style.cssText=css;layer().appendChild(e);return e}
function kill(e,ms){setTimeout(function(){if(e&&e.parentNode)e.parentNode.removeChild(e)},ms)}
function anim(e,kf,opt){try{return e.animate(kf,opt)}catch(x){return null}}
function center(node,fx,fy){var r=node&&node.getBoundingClientRect?node.getBoundingClientRect():null;return r&&r.width?[r.left+r.width/2,r.top+r.height/2]:[fx,fy]}
function bloom(x,y,col,size){var b=el("fx-bloom","left:"+x+"px;top:"+y+"px;--c:"+col+(size?";width:"+size+"px;height:"+size+"px":""));
  anim(b,[{transform:"translate(-50%,-50%) scale(.1)",opacity:.95},{transform:"translate(-50%,-50%) scale(1.15)",opacity:0}],{duration:950,easing:"cubic-bezier(.2,.7,.2,1)",fill:"forwards"});kill(b,1050)}
function sparks(x,y,light,n){var cols=light?["#f59e0b","#fbbf24","#ffffff","#60a5fa","#2563eb"]:["#2dd4c4","#5b9bff","#b49cff","#ffffff","#7ff3e6"];n=n||24;
  for(var i=0;i<n;i++){var c=cols[i%cols.length],sz=2+Math.random()*3.6,a=Math.random()*Math.PI*2,d=70+Math.random()*200;
    var s=el("fx-spark","left:"+x+"px;top:"+y+"px;width:"+sz+"px;height:"+sz+"px;background:"+c+";box-shadow:0 0 9px "+c);
    anim(s,[{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate(calc(-50% + "+(Math.cos(a)*d).toFixed(1)+"px),calc(-50% + "+(Math.sin(a)*d).toFixed(1)+"px)) scale(.2)",opacity:0}],
      {duration:650+Math.random()*600,easing:"cubic-bezier(.1,.7,.3,1)",delay:Math.random()*90,fill:"forwards"});kill(s,1500)}}
function ring(x,y,R,cls,delay){var d=R*2,r=el("fx-ring "+(cls||""),"left:"+(x-R)+"px;top:"+(y-R)+"px;width:"+d+"px;height:"+d+"px");r.appendChild(document.createElement("i"));
  anim(r,[{transform:"scale(0)",opacity:1,offset:0},{opacity:1,offset:.82},{transform:"scale(1)",opacity:0,offset:1}],{duration:DUR,easing:EASE,delay:delay||0,fill:"both"});kill(r,DUR+(delay||0)+200)}
function sweep(delay){var s=el("fx-sweep");anim(s,[{transform:"translateX(-110%)"},{transform:"translateX(110%)"}],{duration:1100,easing:"cubic-bezier(.4,0,.2,1)",delay:delay,fill:"both"});kill(s,delay+1300)}
function hud(light){var h=el("fx-hud "+(light?"l":"d"));
  h.innerHTML='<span class="ic">'+ic(light?"sun":"moon")+'</span><span class="tx"><b>'+(light?"โหมดสว่าง":"โหมดมืด")+'</b><small>'+(light?"Porcelain · คมชัด อ่านเอกสารง่าย":"Graphite · สบายตา ลดแสงจ้า")+'</small></span><i class="pg"></i>';
  h.style.transform="translate(-50%,26px) scale(.94)";
  anim(h,[{opacity:0,transform:"translate(-50%,26px) scale(.94)"},{opacity:1,transform:"translate(-50%,0) scale(1)"}],{duration:560,easing:"cubic-bezier(.2,1.3,.3,1)",delay:260,fill:"both"});
  setTimeout(function(){anim(h,[{opacity:1,transform:"translate(-50%,0) scale(1)"},{opacity:0,transform:"translate(-50%,12px) scale(.97)"}],{duration:340,fill:"forwards"})},2500);kill(h,3000)}

function cur(){return root.getAttribute("data-theme")==="light"?"light":"dark"}
function syncSw(){var l=cur()==="light";document.querySelectorAll(".theme-sw").forEach(function(b){b.setAttribute("aria-checked",l?"true":"false");b.title=l?"โหมดสว่าง · คลิกเพื่อสลับเป็นโหมดมืด":"โหมดมืด · คลิกเพื่อสลับเป็นโหมดสว่าง"});
  var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute("content",l?"#f3f5f9":"#0b0b0e")}
function applyTheme(t){root.setAttribute("data-theme",t);if(window.__aivaStyles)window.__aivaStyles(t);try{localStorage.setItem("aiva.theme",t)}catch(e){}syncSw();
  try{window.dispatchEvent(new CustomEvent("aiva:theme",{detail:t}))}catch(e){}}
var themeBusy=false;
function setTheme(t,from){if(t===cur()||themeBusy)return;
  if(NOFX()){applyTheme(t);return}
  themeBusy=true;setTimeout(function(){themeBusy=false},DUR+250);
  var p=center(from,innerWidth-60,28),x=p[0],y=p[1],toLight=t==="light";
  var R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+40;
  if(from&&from.classList){from.classList.add("pop");setTimeout(function(){from.classList.remove("pop")},950)}
  bloom(x,y,toLight?"rgba(251,191,36,.6)":"rgba(45,212,196,.5)");
  sparks(x,y,toLight);hud(toLight);
  root.classList.add("fx-theme");setTimeout(function(){root.classList.remove("fx-theme")},1700);
  var go=function(){ring(x,y,R,"",0);ring(x,y,R,"e2",110);sweep(DUR*.5)};
  if(document.startViewTransition){
    var vt;root.classList.add("fx-vt");layer();
    try{vt=document.startViewTransition(function(){applyTheme(t)})}catch(e){root.classList.remove("fx-vt");applyTheme(t);go();return}
    var endVT=function(){root.classList.remove("fx-vt")};
    vt.finished.then(endVT,endVT);
    vt.ready.then(function(){
      root.animate({clipPath:["circle(0px at "+x+"px "+y+"px)","circle("+R+"px at "+x+"px "+y+"px)"]},{duration:DUR,easing:EASE,pseudoElement:"::view-transition-new(root)"});go()}).catch(function(){endVT()});
  }else{applyTheme(t);go()}}
function toggleTheme(from){setTheme(cur()==="light"?"dark":"light",from)}
window.AIVA_THEME={get:cur,set:setTheme,toggle:toggleTheme};
function swHTML(){return '<button type="button" class="theme-sw" role="switch" aria-checked="false" aria-label="สลับโหมดสว่าง / มืด">'+ic("sun","i-sun")+ic("moon","i-moon")+'<i class="kn"></i></button>'}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".theme-sw");if(b)toggleTheme(b)});

var appT=null;
FX.appIn=function(o){o=o||{};if(NOFX())return;var h=root;h.classList.remove("fx-in","fx-lite");void h.offsetWidth;h.classList.add("fx-in");if(o.lite)h.classList.add("fx-lite");
  clearTimeout(appT);appT=setTimeout(function(){h.classList.remove("fx-in","fx-lite")},o.lite?1500:2400);
  if(!o.lite){var c=center(document.querySelector(".nav-org .brand-tile"),60,40);bloom(c[0],c[1],"rgba(91,155,255,.55)",520);
    setTimeout(function(){sweep(0)},260)}};
FX.appPrep=function(){FX.appIn({})};
FX.cascade=function(){FX.appIn({lite:true})};
FX.warp=function(x,y){if(NOFX())return;var w=el("fx-warp","left:"+x+"px;top:"+y+"px");
  anim(w,[{transform:"translate(-50%,-50%) scale(.2)",opacity:1},{transform:"translate(-50%,-50%) scale(24)",opacity:0}],{duration:780,easing:"cubic-bezier(.3,.6,.2,1)",fill:"forwards"});kill(w,900);
  bloom(x,y,"rgba(45,212,196,.5)",480);sparks(x,y,false,16)};
FX.loginOut=function(r){if(NOFX())return;var c=center(r&&r.querySelector(".brand-tile"),innerWidth*.12,90);FX.warp(c[0],c[1])};
FX.welcome=function(u,m,skip,resume){if(NOFX()){try{toast("ยินดีต้อนรับ "+u.n)}catch(e){}return}
  var RR=gROLES(),R=(RR&&RR[u.role])||{n:"",c:"var(--t-blue)",bg:"var(--t-blue-bg)"};
  var w=el("fx-welcome");w.innerHTML='<span class="av" style="background:'+R.bg+';color:'+R.c+'">'+esc2(initial(u.n))+'<i class="rg"></i></span><span class="tx"><small>'+(resume?"ยินดีต้อนรับกลับ":(skip?"เข้าสู่ระบบ (ข้ามขั้นตอน)":"เข้าสู่ระบบสำเร็จ"))+'</small><b>'+esc2(u.n)+'</b><em style="background:'+R.bg+';color:'+R.c+'">'+esc2(R.n)+'</em></span><span class="ok">'+ic("check")+'</span><i class="pg"></i>';
  anim(w,[{opacity:0,transform:"translate(-50%,-26px) scale(.93)"},{opacity:1,transform:"translate(-50%,0) scale(1)"}],{duration:600,easing:"cubic-bezier(.2,1.25,.3,1)",delay:resume?150:380,fill:"both"});
  setTimeout(function(){anim(w,[{opacity:1,transform:"translate(-50%,0) scale(1)"},{opacity:0,transform:"translate(-50%,-14px) scale(.97)"}],{duration:380,fill:"forwards"})},3100);kill(w,3700)};
FX.loginIn=function(){var l=$("lg");if(!l||l.hidden||NOFX())return;l.classList.remove("lg-enter");void l.offsetWidth;l.classList.add("lg-enter");setTimeout(function(){l.classList.remove("lg-enter")},1500)};
FX.logoutOut=function(show){if(NOFX()){show();return}root.classList.add("fx-leave");
  setTimeout(function(){show();root.classList.remove("fx-leave");FX.loginIn()},430)};
FX.replay=function(){var u=gME();FX.appIn({});if(u)FX.welcome(u,null,false,true)};
window.AIVA_FX=FX;

var who=document.querySelector(".topbar .who");if(who)who.insertAdjacentHTML("beforebegin",swHTML());
var lg=$("lg");if(lg)lg.insertAdjacentHTML("afterbegin",'<span class="lg-orb"></span><i class="lg-grid"></i>');
syncSw();

var nl=$("navlist"),ct=$("crumbT");
function crumb(){if(!ct||!nl)return;var on=nl.querySelector(".nav-it.on .lbl");ct.textContent=on?on.textContent.trim():""}
if(nl){new MutationObserver(crumb).observe(nl,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});crumb()}

var us=$("user");if(us)us.addEventListener("change",function(){try{sessionStorage.setItem("aiva.sess",us.value)}catch(e){}FX.cascade()});

(function(){var s=$("splash");if(!s)return;
  if(/[?&#]nologin\b/.test(location.search+location.hash)){s.remove();return}
  var sid=null;try{sid=sessionStorage.getItem("aiva.sess")}catch(e){}
  var u=null;try{var UU=gUSERS();u=sid&&UU&&UU.find(function(x){return x.id===sid})}catch(e){}
  var st=$("spSt"),k=0,tx,t;
  if(u&&!u.off){s.classList.add("resume");var RR2=gROLES(),R=(RR2&&RR2[u.role])||{n:"",c:"",bg:""};
    var sub=s.querySelector(".sub"),bd=s.querySelector(".bd");if(sub)sub.textContent="Welcome back";
    if(bd)bd.innerHTML='<span class="uav" style="background:'+R.bg+';color:'+R.c+'">'+esc2(initial(u.n))+'</span><b>'+esc2(u.n)+'</b><em>'+esc2(R.n)+'</em>';
    tx=["Restoring session…","Verifying access…","Loading your queue…","Ready"];t=NOFX()?420:1750;
  }else{tx=["Initializing workspace…","Preparing workspace…","Almost ready…","Ready"];t=NOFX()?500:2100}
  if(st)st.textContent=tx[0];
  var iv=setInterval(function(){k=Math.min(k+1,tx.length-1);if(st)st.textContent=tx[k]},Math.max(120,t/4));
  var fin=false;function done(){if(fin)return;fin=true;clearInterval(iv);s.classList.add("out");
    if(u&&!u.off){FX.appIn({});FX.welcome(u,null,false,true)}else FX.loginIn();
    setTimeout(function(){s.remove()},650)}
  var to=setTimeout(done,t);s.addEventListener("click",function(){clearTimeout(to);done()});
})();

var P={open:false,tab:"all",q:"",items:[],act:0,prev:null};
var TABS=[["all","ทั้งหมด","sparkle"],["page","หน้า","layers"],["doc","เอกสาร","file"],["sys","ระบบ","sliders"]];
function fm(n){try{return Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}catch(e){return n}}
function openDoc(d){try{go("queue");
  var inL=function(){return visible().filter(listFilter).some(function(x){return x.doc===d.doc})},ch=false;
  if(!inL()){ch=true;filt="all";coF=new Set();CF={};qText="";if(typeof cfClose==="function"&&typeof CD!=="undefined"&&CD)cfClose();
    if(!inL()&&!inPer(d))PERS.q={k:"all"};
    if(!inL()&&typeof CLOSED_V!=="undefined"&&CLOSED_V.indexOf(d.status)>=0)showClosed=true;
    if(!inL())filt=d.status}
  openFromTable(d.doc);if(typeof renderNav==="function")renderNav();
  if(ch&&typeof toast==="function")toast("ปรับตัวกรองคิวเพื่อเปิดเอกสาร "+d.inv)}catch(e){if(window.console)console.error(e)}}
function collect(){var L=[];
  var secs="";document.querySelectorAll("#navlist>*").forEach(function(el){
    if(el.classList.contains("nav-sec")){secs=el.textContent.trim();return}
    if(!el.classList.contains("nav-it")||el.classList.contains("dis"))return;
    var lb=el.querySelector(".lbl"),sv=el.querySelector("svg.ico");if(!lb)return;
    var cnt=el.querySelector(".cnt");
    L.push({k:"page",t:lb.textContent.trim(),d:"ไปที่หน้า · "+secs,tag:cnt?cnt.textContent.trim():"",tone:el.classList.contains("sim")?"warn":"info",svg:sv?sv.outerHTML:"",el:el,run:function(){this.el.click()}})});
  try{var M=gME();if(M&&M.role!=="ADM"&&typeof visible==="function"){
    visible().forEach(function(d){L.push({k:"doc",t:d.inv,d:d.doc+" · "+d.vendor+" · PO "+d.po+" · "+fm(d.total)+" บาท",bdg:typeof badge==="function"?badge(d.status):"",tone:"ok",svg:ic("file"),
      kw:[d.doc,d.po,d.rcv,d.receiver,d.status,d.tax,d.oname].join(" "),run:function(){openDoc(d)}})})}}catch(e){}
  var l=cur()==="light";
  L.push({k:"sys",t:l?"เปลี่ยนเป็นโหมดมืด":"เปลี่ยนเป็นโหมดสว่าง",d:"สลับธีมของแอป · มีเอฟเฟกต์เปลี่ยนโหมด",tag:l?"Dark":"Light",tone:"vio",svg:ic(l?"moon":"sun"),kw:"theme dark light ธีม โหมด มืด สว่าง",
    run:function(){var b=document.querySelector(".topbar .theme-sw");setTheme(l?"dark":"light",b)}});
  L.push({k:"sys",t:"เล่นเอฟเฟกต์เข้าแอปอีกครั้ง",d:"ดูแอนิเมชันตอนกลับเข้าแอป (ต้อนรับ + จัดวางหน้า)",tag:"FX",tone:"info",svg:ic("sparkle"),kw:"effect fx welcome เอฟเฟกต์ ต้อนรับ แอนิเมชัน",run:function(){setTimeout(FX.replay,260)}});
  L.push({k:"sys",t:"ย่อ / ขยายเมนูด้านข้าง",d:"เพิ่มพื้นที่ทำงานของตาราง",tag:"Sidebar",tone:"info",svg:ic("chevsL"),kw:"sidebar เมนู ย่อ ขยาย",run:function(){if(typeof toggleNav==="function")toggleNav()}});
  L.push({k:"sys",t:"ออกจากระบบ",d:"สิ้นสุดเซสชัน และกลับไปหน้า login",tag:"Session",tone:"err",svg:ic("logout"),kw:"logout sign out ออก",run:function(){if(window.LGX)LGX.logout()}});
  return L}
function pfilt(){var q=P.q.trim().toLowerCase(),all=collect(),out=[];
  all.forEach(function(it){if(P.tab!=="all"&&it.k!==P.tab)return;
    if(q){var hay=(it.t+" "+it.d+" "+(it.tag||"")+" "+(it.kw||"")).toLowerCase();if(hay.indexOf(q)<0)return}out.push(it)});
  var lim=q?40:(P.tab==="all"?null:60);
  if(!q&&P.tab==="all"){var c={page:0,doc:0,sys:0},cap={page:12,doc:6,sys:4};out=out.filter(function(it){return ++c[it.k]<=cap[it.k]})}
  else if(lim)out=out.slice(0,lim);
  P.counts={all:all.length};all.forEach(function(it){P.counts[it.k]=(P.counts[it.k]||0)+1});return out}
var GN={page:"หน้า",doc:"เอกสาร",sys:"ระบบ"};
function render(){var items=pfilt();P.items=items;if(P.act>=items.length)P.act=Math.max(0,items.length-1);
  var tabs=TABS.map(function(t){return '<button type="button" class="cmdk-tab '+(P.tab===t[0]?"on":"")+'" data-tab="'+t[0]+'">'+ic(t[2])+t[1]+' <span class="n">'+(P.counts[t[0]]||0)+'</span></button>'}).join("");
  var h="",last="";items.forEach(function(it,i){
    if(P.tab==="all"&&it.k!==last){last=it.k;h+='<div class="cmdk-grp">'+(!P.q&&it.k==="doc"?"เอกสารล่าสุดในคิว":GN[it.k])+'</div>'}
    var col={info:"var(--t-blue)",ok:"var(--t-ok)",warn:"var(--t-warn)",vio:"var(--t-vio)",err:"var(--t-err)"}[it.tone]||"var(--t-blue)";
    var bg={info:"var(--t-blue-bg)",ok:"var(--t-ok-bg)",warn:"var(--t-warn-bg)",vio:"var(--t-vio-bg)",err:"var(--t-err-bg)"}[it.tone]||"var(--t-blue-bg)";
    h+='<button type="button" class="cmdk-it '+(i===P.act?"on":"")+'" data-i="'+i+'" role="option"><span class="tl" style="color:'+col+';background:'+bg+'">'+it.svg+'</span>'+
      '<span class="tx"><span class="tt">'+esc2(it.t)+(it.bdg||"")+(it.tag&&!it.bdg?'<span class="tg" style="color:'+col+';background:'+bg+'">'+esc2(it.tag)+'</span>':"")+'</span><span class="ds">'+esc2(it.d)+'</span></span>'+
      '<span class="go">Enter '+ic("corner")+'</span></button>'});
  if(!items.length)h='<div class="cmdk-empty">'+ic("search")+'ไม่พบรายการที่ตรงกับ “'+esc2(P.q)+'”</div>';
  var box=$("cmdkBox");box.querySelector(".cmdk-tabs").innerHTML=tabs;box.querySelector(".cmdk-list").innerHTML=h;
  var a=box.querySelector(".cmdk-it.on");if(a)a.scrollIntoView({block:"nearest"})}
function build(){if($("cmdkOv"))return;var ov=document.createElement("div");ov.id="cmdkOv";ov.className="cmdk-ov";ov.hidden=true;
  ov.innerHTML='<div class="cmdk" id="cmdkBox" role="dialog" aria-modal="true" aria-label="ค้นหา / คำสั่ง">'+
   '<div class="cmdk-in"><span class="ic">'+ic("search")+'</span><input id="cmdkIn" type="text" autocomplete="off" spellcheck="false" placeholder="พิมพ์เลขที่ใบแจ้งหนี้ ผู้ขาย PO หรือคำสั่ง…" aria-label="ค้นหา"><span class="esc">ESC</span></div>'+
   '<div class="cmdk-tabs" role="tablist"></div><div class="cmdk-list" role="listbox"></div>'+
   '<div class="cmdk-ft"><span><kbd class="k2">↑</kbd><kbd class="k2">↓</kbd>เลือก</span><span><kbd class="k2">↵</kbd>เปิด</span><span><kbd class="k2">Tab</kbd>สลับหมวด</span><span><kbd class="k2">Esc</kbd>ปิด</span><span class="br"><i></i>AIVA · Auto Invoice Matching</span></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener("mousedown",function(e){if(e.target===ov)closeP()});
  ov.addEventListener("click",function(e){var t=e.target.closest(".cmdk-tab");if(t){P.tab=t.dataset.tab;P.act=0;render();$("cmdkIn").focus();return}
    var it=e.target.closest(".cmdk-it");if(it){run(+it.dataset.i)}});
  ov.addEventListener("mousemove",function(e){var it=e.target.closest(".cmdk-it");if(it&&+it.dataset.i!==P.act){var o=ov.querySelector(".cmdk-it.on");if(o)o.classList.remove("on");it.classList.add("on");P.act=+it.dataset.i}});
  $("cmdkIn").addEventListener("input",function(e){P.q=e.target.value;P.act=0;render()})}
function openP(){var l=$("lg");if(l&&!l.hidden)return;build();P.open=true;P.q="";P.tab="all";P.act=0;P.prev=document.activeElement;
  var ov=$("cmdkOv");ov.hidden=false;$("cmdkIn").value="";render();setTimeout(function(){$("cmdkIn").focus()},20)}
function closeP(){if(!P.open)return;P.open=false;$("cmdkOv").hidden=true;try{if(P.prev&&P.prev.focus)P.prev.focus()}catch(e){}}
function run(i){var it=P.items[i];if(!it)return;closeP();try{it.run()}catch(e){if(window.console)console.error(e)}}
document.addEventListener("keydown",function(e){
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&(e.key==="k"||e.key==="K")){e.preventDefault();P.open?closeP():openP();return}
  if(!P.open)return;
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeP();return}
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();var n=P.items.length;if(!n)return;P.act=(P.act+(e.key==="ArrowDown"?1:-1)+n)%n;render();return}
  if(e.key==="Enter"){e.preventDefault();run(P.act);return}
  if(e.key==="Tab"){e.preventDefault();var ix=TABS.map(function(t){return t[0]}).indexOf(P.tab);P.tab=TABS[(ix+(e.shiftKey?-1:1)+TABS.length)%TABS.length][0];P.act=0;render();return}
},true);
var cb=$("cmdkBtn");if(cb)cb.addEventListener("click",openP);
window.AIVA_CMDK={open:openP,close:closeP};
})();


}
