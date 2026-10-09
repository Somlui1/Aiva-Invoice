/* AIVA System A - test portal.

   ซ้าย  = เอกสารจริงจาก Paperless (อ่านผ่าน Paperless reader ของ System A เอง)
   กลาง  = ภาพหน้าเอกสาร + กรอบ bbox ทุกกรอบจาก ocr.elements[] ใน payload ของ System A
   ขวา   = ผลที่ System A คืน (result/3.0) เท่านั้น — final, lines, signatures, rules, exceptions
   ประมวลผล = ให้ System A ทำงานจริงจาก entrypoint ของมันเอง ผลเสียให้ error ลอยขึ้นมาแสดงตามนั้น

   เก็บ view ที่คำนวณเสร็จแล้วไว้ใน browser (localStorage) - restart server แล้วเปิดดูได้ทันที
*/
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let DOCS = [], list = [], cur = 0, COLORS = {}, META = {}, qIds = null, note = '';
const RES = {};                 // id -> สถานะของเอกสารนั้น (ตละฉบับ ไม่แชร์กัน)
const POLL = {};                // id -> timer ที่กำลังรอผล
const RC = { pass: 'ok', fail: 'error', manual_review: 'partial', not_evaluated: 'idle' };
const num = x => x == null ? '' : String(x);
let SHOW = new Set();           // ชนิดกรอบที่เปิดแสดงอยู่ (จำไว้ใน browser)
let ROUNDS = { rounds: [], active: '', err: '' };   // รอบใน engine/results - server เป็นคนบอกเสมอ
let SEL = new Set();            // doc id ที่ติ๊กไว้กับมือ (ว่าง = รันทุกฉบับที่เห็นในรายการ)
let BT = null, BTIMER = null, BATCH_IDS = [];   // สถานะ batch ล่าสุด / timer / id ที่ชุดนี้รัน
let SUMM = null, SUMV = '';     // summary ที่เปิดดูอยู่ / ชื่อรอบตอนที่อ่านมัน
let CMPD = null, CMPF = 'changed';   // ผลเทียบสองรอบล่าสุด / ชิ้นกรองที่เลือกอยู่

// --------------------------------------------------------------------------- ชนิดกรอบที่เปิดแสดง
function initTypes() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('aiva.sysA.types.v1') || 'null') } catch (e) { }
  SHOW = new Set(Array.isArray(saved) && saved.length ? saved : (META.default_types || []));
}
function writeTypes() { try { localStorage.setItem('aiva.sysA.types.v1', JSON.stringify([...SHOW])) } catch (e) { } }
function typeChips(v) {
  return (v.types || []).map(t => `<label class="tg${SHOW.has(t) ? ' on' : ''}" `
    + `style="border-color:${COLORS[t] || '#888'}"><input type=checkbox data-t="${esc(t)}"${SHOW.has(t) ? ' checked' : ''}>`
    + `<span class=sw style="background:${COLORS[t] || '#888'}"></span>${esc(t)}</label>`).join('');
}

// --------------------------------------------------------------------------- case เก็บใน browser ของผู้ทดสอบ
const CASE_KEY = 'aiva.sysA.cases.v1', CASE_MAX = 12;
let CASES = {};
function loadCases() { try { CASES = JSON.parse(localStorage.getItem(CASE_KEY) || '{}') || {} } catch (e) { CASES = {} } }
function writeCases() {                          // quota ต่อ origin: เก็บไม่พอค่อย ๆ ทิ้ง case ที่เก่าสุด
  for (let i = 0; i < 6; i++) {
    try { localStorage.setItem(CASE_KEY, JSON.stringify(CASES)); return } catch (e) {
      const old = Object.entries(CASES).sort((a, b) => (a[1].saved_at || 0) - (b[1].saved_at || 0))[0];
      if (!old) return; delete CASES[old[0]];
    }
  }
}
function saveCase(id, view) {
  const keys = Object.keys(CASES).filter(k => +k !== +id);
  while (keys.length >= CASE_MAX) {
    const old = keys.map(k => ({ k, t: (CASES[k] || {}).saved_at || 0 })).sort((a, b) => a.t - b.t)[0];
    if (!old) break; delete CASES[old.k]; keys.splice(keys.indexOf(old.k), 1);
  }
  CASES[id] = { view: view, saved_at: Date.now(), round: ROUNDS.active };
  writeCases();
}
function dropCase(id) { delete CASES[id]; writeCases() }

// --------------------------------------------------------------------------- API
const api = {
  async j(url, opt) {
    const r = await fetch(url, opt); let b = null; try { b = await r.json() } catch (e) { }
    if (!r.ok) throw Object.assign(new Error((b && b.detail) || ('HTTP ' + r.status)), { status: r.status });
    return b;
  },
  meta: () => api.j('/api/meta'),
  documents: () => api.j('/api/documents'),
  status: id => api.j('/api/documents/' + id),
  refresh: () => api.j('/api/documents/refresh', { method: 'POST' }),
  process: id => api.j('/api/documents/' + id + '/process', { method: 'POST' }),
  result: id => api.j('/api/documents/' + id + '/result'),
  forget: id => api.j('/api/documents/' + id + '/result', { method: 'DELETE' }),
  search: q => api.j('/api/search?q=' + encodeURIComponent(q)),
  post: (url, body) => api.j(url, { method: 'POST', headers: { 'content-type': 'application/json' },
                                    body: JSON.stringify(body || {}) }),
  rounds: () => api.j('/api/rounds'),
  roundCreate: name => api.post('/api/rounds/create', { name: name }),
  roundSelect: name => api.post('/api/rounds/select', { name: name }),
  summary: () => api.j('/api/rounds/summary'),
  summaryRebuild: () => api.post('/api/rounds/summary/rebuild'),
  compare: (b, t) => api.j('/api/rounds/compare?base=' + encodeURIComponent(b) + '&target=' + encodeURIComponent(t)),
  batchStart: (ids, skip, conc) => api.post('/api/batch/start',
    { doc_ids: ids, skip_existing: skip, concurrency: conc }),
  batchStop: () => api.post('/api/batch/stop'),
  batchStatus: () => api.j('/api/batch/status'),
  img: (id, p) => '/api/documents/' + id + '/pages/' + p + '/image',
  pdf: id => '/api/documents/' + id + '/pdf'
};
const stOf = id => RES[id] || (RES[id] = { id: id, state: 'idle', run: 0, step: null, cls: null, rec: null,
  error: null, tb: null, seconds: null, types: [], boxes: 0, started: 0, view: null, from: null, src_err: null,
  probed: false });
// /api/documents ส่ง "pages" เป็นเลขหน้า เช่น [1,2,3] ไม่ใช่วัตถุ — ต้องแปลงเป็นเลขก่อนต่อ url ของรูปหน้า
const pageNums = m => {
  const got = (m.pages || []).map(p => +((p && typeof p === 'object') ? p.page : p)).filter(n => n > 0);
  const total = Math.max(+m.pages_total || 0, ...got, 0) || 1;
  return [...new Set(got.concat(Array.from({ length: total }, (_, i) => i + 1)))].sort((a, b) => a - b);
};
const hasView = r => !!(r.view && r.state === 'done');
const isBusy = r => r.state === 'processing';
const rcls = r => isBusy(r) ? 'partial' : r.state === 'error' ? 'error' : hasView(r) ? (r.cls || 'ok') : 'idle';

function applyServer(m) {                        // 1 แถวของ /api/documents -> สถานะของเอกสารนั้น
  const r = stOf(m.id), first = r.state;
  r.state = m.state; r.run = m.run || 0; r.step = m.step; r.cls = m.cls; r.rec = m.recommendation || null;
  r.error = m.error; r.tb = m.traceback; r.seconds = m.seconds; r.types = m.types || [];
  r.boxes = m.boxes || 0; r.src_err = m.source_error || null;
  if (m.state === 'done') { r.error = null; r.tb = null; if (!r.view) r.probed = false }   // ให้ไปเอาผลมาแสดง
  if (first === 'processing' && m.state === 'error' && m.error) note = `error #${m.id}: ${m.error}`;
  if (m.state !== 'processing' && POLL[m.id]) { clearInterval(POLL[m.id]); delete POLL[m.id] }
}
function useCase(id, c) {                        // case ที่ browser เก็บไว้ (server restart แล้ว)
  const r = stOf(id);
  if (!c || !c.view || c.round !== ROUNDS.active) return;   // case ของรอบอื่น ห้ามเอามาแสดงในรอบนี้
  r.view = c.view; r.from = 'browser'; r.types = c.view.types || [];
  r.cls = c.view.cls; r.rec = c.view.rec; r.boxes = (c.view.counts || {}).boxes || 0;
}
function adoptDocs(rows) {                       // รายการจาก server = สถานะจริงของเอกสารแต่ละฉบับในรอบนี้
  DOCS = rows;
  for (const m of DOCS) applyServer(m);
  hydrate();
}
function hydrate() {
  for (const m of DOCS) {
    const r = stOf(m.id);
    if (r.state === 'processing' || (r.view && r.from === 'server')) continue;
    if (CASES[m.id] && !r.view) useCase(m.id, CASES[m.id]);
  }
}

// --------------------------------------------------------------------------- element_id -> element (จาก payload)
const elOf = (v, id) => (v.elements || {})[id];
function refAttr(v, id) {                        // แถวที่ชี้ element หนึ่งของ System A -> ขยับกรอบนั้นเมื่อชี้แถว
  const e = elOf(v, id);
  return e ? ` data-ref="${esc(id)}" title="${esc(id)} · ${esc(e.type)} · หน้า ${e.page}"` : '';
}
const refSpans = (v, refs) => (refs || []).filter(Boolean).map(r =>
  `<span class=idle data-ref="${esc(r)}">[${esc(r)}]</span>`).join(' ');
const refFirst = (v, refs) => (refs || []).find(r => elOf(v, r)) || null;

// --------------------------------------------------------------------------- แถบสถานะ
function updStat() {
  let done = 0, srv = 0, run = 0, box = 0, cached = 0; const c = {};
  for (const m of DOCS) {
    const r = stOf(m.id);
    if (isBusy(r)) run++;
    if (hasView(r)) { done++; c[r.cls] = (c[r.cls] || 0) + 1; box += r.boxes || 0; if (r.from === 'browser') cached++ }
    else if (r.state === 'done') { srv++; c[r.cls] = (c[r.cls] || 0) + 1 }   // ผลอยู่ในรอบนี้ server อ่านแล้ว
  }
  $('stat').innerHTML = `${DOCS.length} ฉบับ · ${DOCS.reduce((a, d) => a + (d.pages_total || 0), 0)} หน้า`
    + ` · ประมวลแล้ว ${done + srv}${cached ? ` <span class=case>(ใน browser ${cached})</span>` : ''}`
    + `${run ? ` · <span class=partial>กำลังประมวล ${run}</span>` : ''} · ${box} กรอบจาก payload`
    + ` · <span class=ok>ok ${c.ok || 0}</span> <span class=partial>partial ${c.partial || 0}</span>`
    + ` <span class=error>error ${c.error || 0}</span>`;
  const S = META.source || {};
  $('src').innerHTML = `รอบ <b>${esc(ROUNDS.active || '-')}</b>`
    + ` · Paperless <b>${esc(String(S.base_url || '').replace(/^https?:\/\//, ''))}</b>`
    + ` · tag <b>${esc(S.tag || '')}</b> · DMS มี ${S.dms_total ?? '?'} ฉบับ · แสดง ${S.documents} ฉบับ`
    + ` · engine <b>${esc(META.engine)}</b>/${esc(META.mode)}`
    + ` · <b>${META.persist ? 'ผลเก็บที่ server' : 'ผลเก็บใน browser เท่านั้น'}</b>`
    + `${ROUNDS.err ? ` · <span class=error>ไม่มีรอบให้เลือก: ${esc(ROUNDS.err)}</span>` : ''}`
    + `${S.error ? ` · <span class=error>${esc(S.error)}</span>` : ''}`;
}

// --------------------------------------------------------------------------- ขวา: ตารางเทียบ list ของ Oracle ↔ list ของ invoice
const CMP_KEY = 'aiva.sysA.cmp.v1';
let CMP = 'all';                                   // 'all' | 'need' — มุมที่ผู้ทดสอบดูอยู่ล่าสุด (จำไว้ใน browser)
function initCmp() { try { CMP = localStorage.getItem(CMP_KEY) === 'need' ? 'need' : 'all' } catch (e) { CMP = 'all' } }
function writeCmp() { try { localStorage.setItem(CMP_KEY, CMP) } catch (e) { } }

// status ของแถว Oracle หนึ่งแถว = สิ่งที่ payload บอก ไม่ได้ตัดสินเพิ่มเอง
const O_ST = {
  matched: ['ok', 'จับคู่แล้ว'],
  ai_rejected: ['error', 'AI เสนอ แล้วถูกกฎปฏิเสธ'],
  invoice_has_no_line: ['error', 'ไม่มีบรรทัดนี้ใน invoice'],
  qty_zero: ['idle', 'qty = 0 — System A ไม่ใช้จับคู่'],
  unmatched: ['partial', 'ไม่ถูกบรรทัดใดอ้างถึง'],
  outside_receipt: ['partial', 'อ้าง rcv_line_id ที่ไม่มีใน receipt_lines'],
};
const kv = (lab, val) => `<span>${lab}</span><span>${esc(val == null || val === '' ? '—' : val)}</span>`;

function cmpRowHtml(v, l, o) {
  const qc = l && l.qty_check, m = l && l.match, g = (o && o.groups || [])[0] || null;
  const inv = l ? `<td${refAttr(v, l.ref)}>`
    + `<div><b>บรรทัด ${esc(num(l.no))}</b> <span class=idle>หน${esc(num(l.page))}</span>${refSpans(v, l.ref ? [l.ref] : [])}</div>`
    + `<div class=it>${esc(l.desc || '— payload ไม่มี description')}`
    + `${l.item_code ? ` <span class=idle>${esc(l.item_code)}</span>` : ''}</div>`
    + `<div class=v>${kv('qty', l.qty)}${kv('uom', l.uom)}${kv('ราคา/หน่วย', l.unit_price)}${kv('ยอด', l.amount)}`
    + `${kv('กลุ่ม UOM', l.uom_group)}</div>`
    + `${l.line_math ? `<div class=idle>qty × ราคา = ${esc(num(l.line_math.qty_x_unit_price))} · diff ${esc(num(l.line_math.diff))}`
      + `${l.line_math.ok ? ' (ผ่าน)' : ` <span class=error>(ไม่ตรง amount ที่พิมพ์ ${esc(num(l.line_math.amount))})</span>`}</div>` : ''}`
    + `${Object.keys(l.cells_null_reason || {}).length ? `<div class=error>cell ที่ใช้ไม่ได้: ${esc(JSON.stringify(l.cells_null_reason))}</div>` : ''}`
    + `</td>` : `<td class=ph>— ฝั่ง invoice ไม่มีบรรทัดนี้</td>`;
  const mid = `<td>`
    + `${m ? `<span class="${m.relation === 'UNMATCHED' ? 'error' : 'ok'}">${esc(m.level || '')} ${esc(m.relation || '')}</span>`
      : g ? `<span class=ok>${esc(g.level || '')} ${esc(g.relation || '')}</span>` : ''}`
    + `${m || g ? `<div class=idle>${esc((m || g).source || '')}${(m || g).confidence != null ? ' · conf ' + esc((m || g).confidence) : ''}</div>` : ''}`
    + `${qc ? `<div class="${RC[qc.result] || 'idle'}">V-08 ${esc(qc.result || '')}${qc.code ? ' · ' + esc(qc.code) : ''}`
      + `${qc.qty_rcv_compared != null ? ` <span class=idle>เทียบ qty ${esc(qc.qty_inv ?? '')}↔${esc(qc.qty_rcv_compared)}</span>` : ''}`
      + `${qc.qty_diff != null ? ` · diff ${esc(qc.qty_diff)}` : ''}</div>` : ''}`
    + `${o && o.status !== 'matched' ? `<div class="${(O_ST[o.status] || ['idle', o.status])[0]}">${esc((O_ST[o.status] || ['idle', '?'])[1])}</div>` : ''}`
    + `${o && o.ai_rejected ? `<div class=error>เหตุผล: ${esc(o.ai_rejected)}</div>` : ''}`
    + `${(m || g || {}).rationale ? `<div class=idle>${esc((m || g).rationale)}</div>` : ''}</div>`
    + `${l && (l.oracle || []).length > 1 ? `<div class=idle>บรรทัดนี้จับคู่กับ ${l.oracle.length} บรรทัด Oracle</div>` : ''}</td>`;
  const orc = o ? `<td>`
    + `<div><b>${esc(o.id)}</b> <span class=idle>ใบรับ ${esc(o.receipt || '?')} บรรทัด ${esc(num(o.line))}</span></div>`
    + `<div class=it>${esc(o.item || '— Oracle ไม่มี item')}`
    + `${o.item_code ? ` <span class=idle>${esc(o.item_code)}</span>` : ''}</div>`
    + `<div class=v>${kv('qty', o.qty)}${kv('uom', o.uom)}${kv('ราคา/หน่วย', o.unit_price)}${kv('ยอด', o.amount)}`
    + `${kv('PO', o.po_number)}${kv('กลุ่ม UOM', o.uom_group)}</div>`
    + `<div class=idle>${esc([o.receiver ? `ผู้รับ ${o.receiver}` : '', o.po_number ? `PO ${o.po_number}` : '',
      o.shipment_num ? `shipment ${o.shipment_num}` : '', o.packing_slip ? `packing ${o.packing_slip}` : '',
      o.line_status ? `status ${o.line_status}` : '', o.qty_billed ? `billed ${o.qty_billed}` : '']
      .filter(Boolean).join(' · '))}</div>`
    + `${o.source !== 'oracle_snapshot' ? `<div class=partial>แถวนี้มาจาก ${esc(o.source)} (ไม่ปรากฏใน receipt_lines)</div>` : ''}</td>`
    : `<td class=ph>— ฝั่ง Oracle ไม่มีบรรทัดนี้</td>`;
  const need = !l || !o || (m && m.relation === 'UNMATCHED') || !qc || (qc && qc.result !== 'pass')
    || (o && o.status !== 'matched');
  return `<tr class="cmp-r${need ? ' cmp-need' : ''}${!l ? ' orconly' : !o ? ' invonly' : ''}">${inv}${mid}${orc}</tr>`;
}
function cmpHtml(v) {
  const O = v.oracle_lines || {}, L = (v.lines || {}).items || [], rows = O.items || [], C = O.counts || {};
  const body = [];
  L.forEach(l => {
    const ps = l.oracle || [];
    if (!ps.length) { body.push(cmpRowHtml(v, l, null)); return }
    ps.forEach(o => body.push(cmpRowHtml(v, l, o)));
  });
  // rows Oracle has but no invoice line shows: unmatched, refused by a rule, qty 0, or simply never claimed
  const shown = new Set(L.flatMap(l => (l.oracle || []).map(o => String(o.id))));
  rows.filter(o => !shown.has(String(o.id))).forEach(o => body.push(cmpRowHtml(v, null, o)));
  const bad = (v.lines || {}).extra || [];
  return `<div class=sec><b>เทียบรายการ Oracle ↔ invoice</b>`
    + ` <span class="tg${CMP === 'all' ? ' on' : ''}" data-cmp=all>ทั้งหมด</span>`
    + `<span class="tg${CMP === 'need' ? ' on' : ''}" data-cmp=need>เฉพาะที่ต้องตรวจ</span>`
    + ` <span class=idle>(${C.rows ?? '?'} บรรทัด Oracle · จับคู่แล้ว ${C.matched ?? '?'}`
    + `${C.unclaimed ? ` · ไม่ถูกจับคู่ ${C.unclaimed}` : ''}${C.qty_zero ? ` · qty 0 ${C.qty_zero}` : ''}`
    + `${C.rejected ? ` · AI ถูกปฏิเสธ ${C.rejected}` : ''})</span></div>`
    + `<div class=sec>ซ้าย = <span class=idle>normalized_fields.items</span> จากเอกสารจริง · ขวา =` 
    + ` <span class=idle>oracle_snapshot.receipt_lines</span> ที่ Oracle ตอบมา · ผูกกันด้วย <span class=idle>rcv_line_id</span>`
    + ` ใน <span class=idle>line_matching.groups</span> ตามที่ System A ตัดสินไว้แล้ว (V-07/V-08)`
    + ` — ตัวเลขทุกตัวคือของเดิมจาก payload ไม่ได้คำนวณหรือเทียบกันใหม่</div>`
    + `${!O.queried || !rows.length ? `<div class=err>Oracle ไม่มีรายการใบรับสำหรับเอกสารนี้` 
      + ` — ฝั่งขวาจึงว่างเปล่า ทุกบรรทัดของ invoice จะไม่มีคู่</div>` : ''}`
    + `<table class="cmp${CMP === 'need' ? ' need' : ''}">`
    + `<tr><th>รายการที่อ่านจาก invoice</th><th>การจับคู่ของ System A</th><th>รายการที่ Oracle มี</th></tr>`
    + `${body.join('') || '<tr><td colspan=3><span class=ph>payload ไม่มีรายการสินค้า (normalized_fields.items ว่าง)</span></td></tr>'}</table>`
    + `${bad.length ? `<details><summary>ดูข้อมูลดิบที่ System A ปฏิเสธ / ไม่จับคู่</summary><pre>${esc(JSON.stringify(bad, null, 1))}</pre></details>` : ''}`;
}

// --------------------------------------------------------------------------- ขวา: Final Result / Verify Result
function resultHtml(id) {
  const v = stOf(id).view, F = v.final || {}, R = v.recommendation || {}, rc = v.receipt || {};
  const M = v.metrics || {}, dur = M.duration_ms || {}, V = v.versions || {}, Q = v.request || {};
  const sha = (v.integrity || {}).payload_sha256 || '';
  const f = (F.items || []).map(x => `<tr${refAttr(v, refFirst(v, x.refs))}><td>${esc(x.label)}</td><td>`
    + (x.value == null || x.value === '' ? '<span class=error>— ไม่มีใน payload</span>' : esc(x.value))
    + ` ${refSpans(v, x.refs)}</td></tr>`).join('');
  const sg = (v.signatures || []).map(s => `<tr${refAttr(v, refFirst(v, s.refs))}><td>signature · ${esc(s.slot)}</td>`
    + `<td>${s.present === true ? 'พบ' : s.present === false ? 'ไม่พบ' : 'ไม่แน่ใจ'}`
    + `${s.conf != null ? ` <span class=idle>conf ${s.conf}</span>` : ''} · หน้า ${s.page} ${refSpans(v, s.refs)}</td></tr>`).join('');
  const sum = F.summary || {};

  const excBy = {}; (v.exceptions || []).forEach(x => { (excBy[x.rule_id] = excBy[x.rule_id] || []).push(x) });
  const vr = (v.rules || []).map(x => {
    const ev = (excBy[x.id] || []).map(e => `<b>${esc(e.code)} ${esc(e.name)}</b> <span class=error>${esc(e.severity)}</span> `
      + `${esc(e.detail || '')} ${refSpans(v, e.refs)}`
      + `${(e.missing_refs || []).length ? `<br><span class=error>${esc(e.missing_refs.join(' | '))}</span>` : ''}`).join('<br>');
    const data = Object.keys(x.data || {}).length ? ` <span class=idle>${esc(JSON.stringify(x.data))}</span>` : '';
    return `<tr><td>${esc(x.id)} <span class=idle>v${esc(x.version || '')}</span></td>`
      + `<td><span class=${RC[x.result] || 'idle'}>${esc(x.result)}</span></td>`
      + `<td>${esc(x.detail || '')}${x.halted_by ? ` <span class=idle>[halted_by ${esc(x.halted_by)}]</span>` : ''}`
      + `${ev ? '<br>' + ev : ''}${data}</td></tr>`;
  }).join('');
  return `<div class=sec><b>Final Result</b> · <span class=${v.cls}>${esc(v.rec)}</span>`
    + `${(R.codes || []).length ? ' · ' + esc(R.codes.join(', ')) : ''}`
    + `${R.halted_by ? ` · halted_by ${esc(R.halted_by)}` : ''}`
    + `${v.incomplete ? ' · <span class=partial>payload มี system_errors</span>' : ''}`
    + `${v.seconds != null ? ` · ${v.seconds}s` : ''} · engine ${esc(META.engine)}/${esc(META.mode)}</div>`
    + `${(R.reasons || []).length ? `<div class=sec>${R.reasons.map(esc).join('<br>')}</div>` : ''}`
    + `<div class=sec>Oracle: ${rc.queried ? `${esc(rc.path || 'ไม่พบเส้นทางสืบ')} · ใบรับ ${esc((rc.receipt_nums || []).join(', ') || '-')}`
      + ` · PO ${esc((rc.po_numbers || []).join(', ') || '-')}` : 'ไม่ได้สืบ/ไม่พบข้อมูล'}`
    + `${rc.receiver ? ` · ผู้รับ ${esc(rc.receiver)}` : ''}${rc.matched_on ? ` · match ด้วย ${esc(rc.matched_on)}` : ''}`
    + ` · เรียก ${esc(String(M.oracle_calls ?? '?'))} ครั้ง${rc.row_cap_hit ? ' · <span class=error>ชนเพดานจำนวนแถว</span>' : ''}`
    + `${rc.fingerprint ? ` <span class=idle title="${esc(rc.fingerprint)}">fingerprint ${esc(String(rc.fingerprint).slice(7, 19))}</span>` : ''}</div>`
    + `<table class=rt><tr><th>field</th><th>value (จาก payload เท่านั้น)</th></tr>${f}${sg}</table>`
    + `<div class=sec>สรุปบรรทัด: ${esc(num(sum.line_count))} บรรทัด · ใช้ได้ ${esc(num(sum.lines_usable))}`
    + ` · คณิตฯ ผ่าน ${esc(num(sum.lines_math_ok))} · จับคู่ได้ ${esc(num(sum.lines_matched))}`
    + ` · รวม ${esc(num(sum.sum_amount))} vs subtotal ${esc(num(sum.sub_total))}`
    + ` (ต่าง ${esc(num(sum.sum_vs_sub_total_diff))})`
    + `${(F.buyer || {}).name ? `<br>ผู้ซื้อ: ${esc(F.buyer.name)} · ${esc(F.buyer.tax_id || '')}` : ''}</div>`
    + cmpHtml(v)
    + `<div class=sec><a href="/api/documents/${id}/payload" target=_blank>payload JSON</a>`
    + ` · <a href="/api/documents/${id}/extraction" target=_blank>extraction block</a>`
    + ` · ${esc(v.contract)} · standard ${esc(V.standard || '')} ruleset ${esc(V.ruleset || '')}`
    + ` · ${(V.models || {}).line_matcher || ''} · run ${esc(Q.run_id || '')} · ${esc(Q.validation_id || '')}`
    + `${sha ? ` · <span class=idle title="${esc(sha)}">sha ${esc(sha.slice(7, 19))}</span>` : ''}`
    + ` · ${Object.entries(dur).map(([k, x]) => `${k} ${x}ms`).join(' ')}`
    + `${stOf(id).from === 'browser' ? ' · <span class=case>case จาก browser</span>' : ''}</div>`
    + `<div class=sec><b>Verify Result</b> <span class=idle>(คลิก [element_id] เพื่อตรึงกรอบที่ System A ระบุ)</span></div>`
    + `<table class=rt><tr><th>rule</th><th>result</th><th>detail / evidence</th></tr>${vr}</table>`
    + `${(v.dropped || []).length ? `<div class=err>✗ system_errors ${esc(JSON.stringify(v.dropped))}</div>` : ''}`;
}
function elementsHtml(id) {
  const v = stOf(id).view;
  return (v.pages || []).map(p => {
    const rows = (p.elements || []).map(eid => {
      const e = elOf(v, eid) || {};
      return `<tr${refAttr(v, eid)}><td><span class=sw style="background:${COLORS[e.type] || '#888'}"></span>${esc(e.type)}</td>`
        + `<td>${esc(e.field || eid)} <span class=idle>${esc(eid)}</span></td>`
        + `<td>${esc(e.value ?? e.raw ?? '')}</td><td>${e.conf != null ? e.conf : ''}</td>`
        + `<td>${e.has_bbox ? e.bbox.map(z => (+z).toFixed(3)).join(' ') : '<span class=error>no bbox</span>'}</td></tr>`;
    }).join('');
    return `<div class=ocrsec><div class=ocrh>หน้า ${p.page} · ${esc(p.page_type || '?')}`
      + `${p.type_confidence != null ? ' · conf ' + p.type_confidence : ''}`
      + `${p.ocr_quality != null ? ' · OCR ' + p.ocr_quality : ''} · ${(p.elements || []).length} element`
      + ` · ${p.width_pt ?? '?'}×${p.height_pt ?? '?'}pt rot ${p.rotation ?? 0} @${p.render_dpi ?? '?'}dpi</div>`
      + `<table><tr><th>type</th><th>field / id</th><th>value</th><th>conf</th><th>bbox [x y w h]</th></tr>`
      + `${rows || '<tr><td colspan=5><span class=ph>หน้านี้ไม่มี element ใน payload</span></td></tr>'}</table></div>`;
  }).join('');
}
function errorHtml(r) {
  return `<div class=ph><span class=error>✗ ${esc(r.error || 'System A คืน error')}</span>`
    + `${r.tb ? `<details open><summary>traceback ของ System A</summary><pre>${esc(r.tb)}</pre></details>` : ''}`
    + `<br>ไม่มีผลบางส่วนให้ดู - แก้สาเหตุแล้วกด Process ใหม่</div>`;
}
function panelHtml(m) {
  const r = stOf(m.id);
  if (isBusy(r)) return `<div class=ph><span class=partial>กำลังประมวลผล… <span class=el data-d=${m.id}>0.0</span>s</span><br>`
    + `System A กำลังอ่านไฟล์จริงของเอกสารนี้ แล้วตรวจกับ Oracle และกติกาของมันเอง`
    + `${r.src_err ? `<div class=err>${esc(r.src_err)}</div>` : ''}</div>`;
  if (r.state === 'error') return errorHtml(r);
  if (!hasView(r)) return `<div class=ph>ยังไม่ได้ประมวลผลเอกสารนี้ — กด <b>Process</b><br><br>`
    + `portal เรียก entrypoint ของ System A โดยตรง: Paperless → vision → Oracle → กติกา → result 3.0<br>`
    + `กรอบทุกกรอบที่เห็นมาจาก <code>ocr.elements[]</code> ใน payload เท่านั้น`
    + `${r.src_err ? `<div class=err>⚠ ${esc(r.src_err)}</div>` : ''}</div>`;
  const C = (r.view.counts || {});
  return resultHtml(m.id)
    + `<div class=sec><b>element ใน payload</b> <span class=idle>(${C.elements ?? '?'} element · วาดได้ ${C.boxes ?? '?'} กล่อง`
    + `${C.no_bbox ? ` · <span class=error>ไม่มี bbox ${C.no_bbox}</span>` : ''} · ชี้แถวเพื่อดูกรอบบนเอกสาร)</span></div>`
    + elementsHtml(m.id);
}

// --------------------------------------------------------------------------- กลาง: หน้าเอกสาร + กรอบ bbox
function boxesOf(v, p) {
  return (p.elements || []).filter(eid => {
    const e = elOf(v, eid);
    return e && e.has_bbox && SHOW.has(e.type);
  }).map(eid => {
    const e = elOf(v, eid), [x, y, w, h] = e.bbox;
    const lab = String(e.field || e.type || '').slice(0, 22);
    return `<div class=bx data-ref="${esc(eid)}" style="left:${(x * 100).toFixed(3)}%;top:${(y * 100).toFixed(3)}%;`
      + `width:${(w * 100).toFixed(3)}%;height:${Math.max(h * 100, 0.35).toFixed(3)}%;border-color:${COLORS[e.type] || '#888'}">`
      + `<span style="background:${COLORS[e.type] || '#888'}">${esc(lab)}</span></div>`;
  }).join('');
}
function pagesHtml(m) {
  const r = stOf(m.id), v = r.view, show = $('ov').checked;
  const pages = pageNums(m).map(page => ({ page }));
  return pages.map(p => {
    const full = v && (v.pages || []).find(x => x.page === p.page);
    const img = `<img src="${api.img(m.id, p.page)}" data-p="${p.page}" alt="page ${p.page}">`;
    if (!show || !v || !full) return `<div class=pg data-page="${p.page}"><div class=pgh>หน้า ${p.page}</div>`
      + `<div class=imgbox style="aspect-ratio:${(full && full.width_pt) || 595}/${(full && full.height_pt) || 842}">${img}</div></div>`;
    const drawn = (full.elements || []).filter(eid => {
      const e = elOf(v, eid); return e && e.has_bbox && SHOW.has(e.type);
    }).length;
    return `<div class=pg data-page="${p.page}"><div class=pgh>หน้า ${p.page} · ${esc(full.page_type || '?')}`
      + ` · ${(full.elements || []).length} element · ${full.width_pt}×${full.height_pt}pt rot ${full.rotation || 0}`
      + ` · วาด ${drawn} กรอบ</div>`
      + `<div class=imgbox style="aspect-ratio:${full.width_pt}/${full.height_pt}">${img}${boxesOf(v, full)}</div></div>`;
  }).join('');
}
function docHtml(m) {
  const r = stOf(m.id), cls = rcls(r);
  const link = x => `<span class=pglink data-jump="${m.id}:${x}">หน${x}</span>`;
  const nums = pageNums(m);
  const jump = nums.length > 1 ? nums.map(link).join(' ') : '';
  return `<div class=card id=doc-${m.id}><div class=ch><span class="${cls}">[${esc(r.rec || cls)}]</span> <b>#${m.id}</b>`
    + ` · ${esc(m.title || '')} <span class=idle>(${esc(m.file_name || m.mime || '')} · ${esc(m.file_class || '')}`
    + ` · <a href="${esc(m.dms_url || m.viewer_url)}" target=_blank>Paperless</a>`
    + ` · <a href="${api.pdf(m.id)}" target=_blank>ไฟล์เดิม</a>)</span></div>`
    + `<div class=meta><span class=chip>#${m.id}${m.tagged ? ' · มี tag' : ' · ไม่มี tag'}</span>`
    + `<span class=chip>${m.pages_total || "?"} หน้า</span>`
    + (m.correspondent ? `<span class=chip>${esc(m.correspondent)}</span>` : '')
    + (m.created ? `<span class=chip>${esc(String(m.created).slice(0, 10))}</span>` : '') + jump + `</div>`
    + `<div class=pgs>${pagesHtml(m)}</div>`
    + `<div class=acts><button data-act=run data-id="${m.id}">Process เอกสารนี้</button>`
    + `<button data-act=del data-id="${m.id}">ลบผล</button>`
    + `<span class=st data-id="${m.id}">${esc(r.state === 'done' ? 'ประมวลแล้ว' : r.state === 'error' ? 'error' : 'รอประมวลผล')}</span></div>`
    + `</div>`;
}
// ขวา: ผลของเอกสารที่เปิดอยู่ แสดงในคอลัมน์ขวา แยกจาก preview กลาง
function paintPanel(m) {
  const r = m && stOf(m.id), n = m && hasView(r) ? (r.view.counts || {}).elements : null;
  $('panel').innerHTML = m ? `<div class=phd>ผลการประมวลผล <span class=idle>#${m.id}</span>`
    + (n != null ? ` · ${n} element จาก payload` : '') + '</div>' + panelHtml(m) : '';
}
const rowHtml = (m, i) => {
  const r = stOf(m.id), cls = rcls(r), step = isBusy(r) && r.step ? `<span class=step>${esc(r.step)}</span>` : '';
  const ck = `<span class="ck${SEL.has(m.id) ? ' on' : ''}" data-ck="${m.id}" title="ติ๊กเพื่อเลือกฉบับนี้ในชุดถัดไป"></span>`;
  const bm = r.b ? `<span class="b ${r.b}">${r.b === 'bproc' ? 'รันอยู่' : r.b === 'berr' ? 'error' : 'เสร็จ'}</span>` : '';
  return `<div class="row${i === cur ? ' cur' : ''}" data-id="${m.id}" data-cur="${i}">${ck}<span class="${cls}">[${esc(r.rec || cls)}]</span> #${m.id}`
    + ` <span class=d>${esc(m.title || '')}</span> <span class=idle>${m.pages_total || "?"}n</span>${bm}${step}</div>`;
};

// --------------------------------------------------------------------------- วาดรายการ + เอกสารที่เปิดอยู่
function typeOptions() {
  const seen = [...new Set(DOCS.flatMap(x => stOf(x.id).types || []).concat(META.element_types || []))].filter(Boolean);
  $('ft').innerHTML = '<option value="">ชนิดกรอบทั้งหมด</option>' + seen.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  $('ft').value = '';
}
function apply() {
  if (!DOCS.length) { $('main').innerHTML = '<div class=ph>ไม่มีเอกสารใน DMS ที่ตรงกับ tag นี้</div>'; $('types').innerHTML = ''; return }
  const q = $('q').value.trim().toLowerCase();
  list = q ? DOCS.filter(m => String(m.id) === q || (m.title || '').toLowerCase().includes(q)
    || (m.file_name || '').toLowerCase().includes(q) || (m.correspondent || '').toLowerCase().includes(q)) : DOCS;
  if (cur >= list.length) cur = 0;
  $('side').innerHTML = list.map((m, i) => rowHtml(m, i)).join('') || '<div class=row>ไม่พบที่ตรงคำค้น</div>';
  const m = list[cur];
  $('main').innerHTML = m ? docHtml(m) : '<div class=ph>ไม่พบเอกสาร</div>';
  paintPanel(m);
  $('run').onclick = () => (m ? startRun(m.id) : alert('ยังไม่มีเอกสารที่เปิดอยู่'));
  $('run').disabled = !!m && isBusy(stOf(m.id));
  typeOptions();
  $('types').innerHTML = m && hasView(stOf(m.id)) ? typeChips(stOf(m.id).view) : '';
  if (m) ensureView(m.id);
  updStat(); renderPin();
}
$('ov').onchange = apply;

const loading = new Set();
async function ensureView(id) {                  // ผลที่ server ประมวลไว้แล้ว แต่ยังไม่ได้เปิดดู
  if (loading.has(id)) return;
  const r = stOf(id);
  if (r.state === 'done' && r.view) return;
  if (r.state === 'processing' || r.state === 'error') return;
  if (r.probed) return;                                  // ถามครั้งเดียว: ที่ server ไม่มีผลของเอกสารนี้เก็บไว้
  r.probed = true;
  loading.add(id);
  try {
    const v = await api.result(id);
    if (v && v.elements) {
      r.state = 'done'; r.view = v; r.from = 'server'; r.types = v.types || r.types;
      r.cls = v.cls; r.rec = v.rec; r.boxes = (v.counts || {}).boxes || 0;
      saveCase(id, v); refresh(id);
    }
  } catch (e) {
    if (e.status === 404 || e.status === 409) { if (CASES[id]) useCase(id, CASES[id]); }
    else { r.error = e.message; refresh(id) }
  } finally { loading.delete(id) }
}
function refresh(id) {                           // วาดใหม่เฉพาะเอกสารนี้
  const i = list.findIndex(x => String(x.id) === String(id));
  const m = i >= 0 ? list[i] : DOCS.find(x => String(x.id) === String(id));
  if (!m) return apply();
  if (i === cur) { $('main').innerHTML = docHtml(m); paintPanel(m) }
  const row = $('side').querySelector(`.row[data-id="${m.id}"]`);
  if (row) row.outerHTML = rowHtml(m, i); else apply();
  updStat();
}

// --------------------------------------------------------------------------- Process (ให้ System A ทำงานจริง)
let last = 'พร้อม';
function syncRun() {
  const ids = Object.keys(RES).filter(k => isBusy(stOf(+k)));
  $('strip').innerHTML = ids.map(k => {
    const r = stOf(+k);
    return `<span class="t${r.state === 'error' ? ' f' : ''}">#${k} ${esc(r.step || 'รอ')} ${((performance.now() - r.started) / 1000).toFixed(1)}s</span>`;
  }).join('') || `<span class="t${note.startsWith('error') ? ' f' : ''}">${esc(last)}</span>`;
}
function startTimer(id) {
  stOf(id).started = performance.now();
  const t = setInterval(() => {
    const r = stOf(id);
    document.querySelectorAll(`.el[data-d="${id}"]`).forEach(e =>
      e.textContent = ((performance.now() - r.started) / 1000).toFixed(1));
    syncRun();
    if (!isBusy(r)) clearInterval(t);
  }, 250);
}
async function startRun(id) {
  if (isBusy(stOf(id))) return alert('เอกสารนี้กำลังประมวลผลอยู่');
  const r = stOf(id);
  r.error = null; r.tb = null;
  try {
    const m = await api.process(id);
    applyServer(Object.assign({}, m, { state: 'processing' }));
    startTimer(id); watch(id); apply();
    last = `เริ่ม #${id}`; syncRun();
  } catch (e) {
    if (e.status === 409) { last = 'กำลังประมวลเอกสารอื่นอยู่'; setTimeout(apply, 800); return syncRun(); }
    alert('เริ่มงานไม่ได้: ' + e.message);
  }
}
function watch(id) {                             // ถามสถานะเอกสารนี้จน System A ตอบกลับมา
  POLL[id] = setTimeout(async () => {
    delete POLL[id];
    try {
      const m = await api.status(id);
      applyServer(m);
      if (m.state === 'done') {
        last = `เสร็จ #${id} · ${m.recommendation || '-'} · ${m.seconds}s`;
        const r0 = stOf(id); r0.probed = true;
        try { const v = await api.result(id); const r = stOf(id); r.view = v; r.from = 'server'; saveCase(id, v) } catch (e) { }
        apply();
      } else if (m.state === 'error') { last = `error #${id} · ${m.error}`; apply(); }
      else { watch(id); apply(); }
      syncRun();
    } catch (e) { last = `poll ไม่ได้: ${e.message}`; watch(id); syncRun(); }
  }, 2000);
}
async function forget(id) {                      // ลบผลของเอกสารนี้ทิ้งทั้งใน browser และที่ server
  if (!confirm(`ลบผลของเอกสาร #${id} ?`)) return;
  try { await api.forget(id) } catch (e) { }
  dropCase(id);
  const r = stOf(id);
  Object.assign(r, { state: 'idle', view: null, cls: null, rec: null, error: null, tb: null, boxes: 0, from: null,
    probed: true });                             // เพิ่งลบผล — ไม่ต้องไปถาม server ซ้ำ
  apply();
}

// --------------------------------------------------------------------------- ชี้ = ดูข้อมูล · คลิก = ตรึงกรอบของ element
const tip = $('tip'), pin = $('pin');
let pinned = null;
const anchor = el => el.closest ? (el.closest('.bx') || el.closest('[data-ref]')) : null;

function boxDescr(v, e) {
  if (!e) return '';
  const b = e.has_bbox ? e.bbox.map(z => (+z).toFixed(3)).join(' ') : 'ไม่มี bbox';
  return `<div><b>${esc(e.id)}</b> · <span style="color:${COLORS[e.type] || '#888'}">${esc(e.type)}</span>`
    + ` · หน้า ${e.page}${e.parent ? ` · ใน ${esc(e.parent)}` : ''}${e.field ? ` · <b>${esc(e.field)}</b>` : ''}</div>`
    + `<div class=big>${esc(e.text)}</div>`
    + `${e.raw != null ? `<div>raw = ${esc(e.raw)}</div>` : ''}`
    + `${e.value != null && e.value !== e.raw ? `<div>normalized = ${esc(e.value)}</div>` : ''}`
    + `${e.conf != null ? `<div>conf = ${e.conf}</div>` : ''}`
    + `<div>bbox [x y w h] = ${esc(b)}</div>`
    + `${e.source_ref ? `<div>source = ${esc(e.source_ref)}</div>` : ''}`;
}
function showTip(text, x, y) {
  tip.innerHTML = text; tip.style.display = 'block';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(Math.max(8, x - w / 2), innerWidth - w - 8) + 'px';
  tip.style.top = (y + 16 + h > innerHeight ? Math.max(8, y - h - 10) : y + 16) + 'px';
}
const hideTip = () => { tip.style.display = 'none' };
function setMark(id, page, on) {
  document.querySelectorAll(`#main .pg[data-page="${page}"] .bx[data-ref="${id}"]`).forEach(bx =>
    bx.classList[on ? 'add' : 'remove']('hl'));
  document.querySelectorAll(`#main [data-ref="${id}"], #panel [data-ref="${id}"]`).forEach(row => row.classList[on ? 'add' : 'remove']('hl'));
}
function tipFrom(a, x, y) {
  const m = list[cur]; if (!m) return hideTip();
  const r = stOf(m.id); if (!r.view) return hideTip();
  const id = a.dataset.ref, e = elOf(r.view, id);
  if (!e) return hideTip();
  if (!pinned) showTip(boxDescr(r.view, e), x, y);
}
function renderPin() {
  if (!pinned) { pin.style.display = 'none'; return }
  const m = list[cur], r = m && m.id === pinned.doc ? stOf(pinned.doc) : null, v = r && r.view;
  const e = v && elOf(v, pinned.id);
  if (!e) { pin.style.display = 'none'; return }
  pin.innerHTML = `<div class=ttl>ผลจาก payload · element_id <b>${esc(pinned.id)}</b>`
    + ` <span class=idle>· กด Esc หรือคลิกที่เดิมเพื่อปิด</span></div>` + boxDescr(v, e);
  pin.style.display = 'block';
}
function clickAnchor(a) {
  const m = list[cur]; if (!m) return;
  const id = a.dataset.ref;
  if (pinned && pinned.id === id && pinned.doc === m.id) pinned = null;
  else { const r = stOf(m.id); if (!elOf(r.view, id)) return; pinned = { doc: m.id, id: id } }
  renderPin();
}
document.addEventListener('mouseover', e => { const a = anchor(e.target); if (a) tipFrom(a, e.clientX, e.clientY) });
document.addEventListener('mousemove', e => { const a = anchor(e.target); if (a && tip.style.display === 'block') tipFrom(a, e.clientX, e.clientY) });
document.addEventListener('mouseout', e => { if (anchor(e.target)) hideTip() });
document.addEventListener('click', e => {
  const t = e.target, cf = t.closest && t.closest('[data-cmp]');
  const mx = t.closest && t.closest('.mx'), back = t.classList && t.classList.contains('modal');
  if (mx || back) { closeModalAll(); return }                                  // ปิด modal ที่เปิดอยู่
  const cf2 = t.closest && t.closest('[data-cmpf]');
  if (cf2) { CMPF = cf2.dataset.cmpf; cmpPaint(); return }                     // ชิ้นกรองของตารางเทียบ
  const open = t.closest && t.closest('[data-open]');
  if (open) { closeModalAll(); openDoc(+open.dataset.open); return }           // แถวของ modal -> เปิดเอกสารนั้น
  const ck = t.closest && t.closest('[data-ck]');
  if (ck) { const cid = +ck.dataset.ck; if (SEL.has(cid)) SEL.delete(cid); else SEL.add(cid); apply(); return }
  if (cf) { CMP = cf.dataset.cmp === 'need' ? 'need' : 'all'; writeCmp(); apply(); return }   //มุมมองของตารางเทียบ
  const chip = t.closest && t.closest('label.tg');
  if (chip) {
    const cb = chip.querySelector('input[data-t]'), k = cb.dataset.t;
    SHOW.has(k) ? SHOW.delete(k) : SHOW.add(k);
    writeTypes();
    chip.classList[SHOW.has(k) ? 'add' : 'remove']('on');
    cb.checked = SHOW.has(k);
    apply();
    return;
  }
  if (t.closest && t.closest('#pin')) { if (pinned) setMark(pinned.id, pinned.page, false); pinned = null; renderPin(); return }
  if (t.tagName === 'IMG') {                       // คลิกที่ภาพหน้า: ตรึงกรอบแรกของหน้านี้ไว้
    const pg = t.closest('.pg'), b = pg && pg.querySelector('.bx');
    if (b) { pinned = { doc: list[cur] && list[cur].id, id: b.dataset.ref }; renderPin() }
    return;
  }
  const bx = t.closest && t.closest('.bx'), a = bx || (t.closest && t.closest('[data-ref]'));
  if (a && a.dataset.ref) return clickAnchor(a);
  const jump = t.closest && t.closest('[data-jump]');
  if (jump) {
    const [id, page] = jump.dataset.jump.split(':');
    const i = list.findIndex(x => String(x.id) === String(id));
    if (i >= 0 && i !== cur) { cur = i; apply(); }
    const el = document.querySelector(`#main .pg[data-page="${page}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const ft = t.closest && t.closest('select#ft');
  if (ft) {
    if (ft.value) SHOW = new Set([ft.value]); else SHOW = new Set(META.element_types || []);
    writeTypes(); apply();
    return;
  }
  const row = t.closest && t.closest('.row');
  if (row) { cur = +row.dataset.cur; pinned = null; hideTip(); apply(); return }
  const act = t.closest && t.closest('button[data-act]');
  if (act) {
    const id = +act.dataset.id;
    if (act.dataset.act === 'run') startRun(id); else forget(id);
    return;
  }
});
document.addEventListener('mouseover', e => {
  if (!$('strip').contains(e.target)) return;
  const m = /#(\d+)/.exec(e.target.textContent || '');
  if (!m) return;
  const id = +m[1], r = stOf(id);
  const el = document.querySelector(`#main #doc-${id} img[data-p="1"]`) || document.querySelector(`#main #doc-${id} img`);
  const pg = el && el.closest('.pg'), page = pg && pg.dataset.page;
  if (r.view && r.view.elements) Object.keys(r.view.elements).forEach(x => setMark(x, page, true));
});
document.addEventListener('mouseout', e => {
  if (!$('strip').contains(e.target)) return;
  const m = /#(\d+)/.exec(e.target.textContent || '');
  if (!m) return;
  const r = stOf(+m[1]);
  const el = document.querySelector(`#main #doc-${m[1]} img`), pg = el && el.closest('.pg'), page = pg && pg.dataset.page;
  if (r.view && r.view.elements) Object.keys(r.view.elements).forEach(x => setMark(x, page, false));
});
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!list.length) return;
    cur = Math.min(list.length - 1, Math.max(0, cur + (e.key === 'ArrowDown' ? 1 : -1)));
    e.preventDefault(); pinned = null; apply();
    const row = $('side').querySelector(`.row[data-cur="${cur}"]`);
    if (row) row.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'PageDown' || e.key === 'PageUp') {
    e.preventDefault(); $('main').scrollBy({ top: (e.key === 'PageDown' ? 1 : -1) * $('main').clientHeight * 0.82 });
  } else if (e.key === 'f') { $('ov').checked = !$('ov').checked; apply() }
  else if (e.key === 'Escape') { if (document.querySelector('.modal.on')) { closeModalAll(); return }
    if (pinned) setMark(pinned.id, pinned.page, false); pinned = null; hideTip(); renderPin() }
});

// --------------------------------------------------------------------------- คำค้น: คำนี้อยู่ในกรอบ/บรรทัดไหน
let qTimer = null;
$('q').addEventListener('input', () => {
  clearTimeout(qTimer);
  const t = $('q').value.trim();
  if (!t) { qIds = null; note = ''; apply(); return }
  qTimer = setTimeout(async () => {
    try {
      const g = await api.search(t);
      qIds = g.ids || [];
      const v = stOf(list[cur] ? list[cur].id : 0).view;
      const local = (v && v.search && v.search.phrases && v.search.phrases[t]) || [];
      if (local.length) qIds = qIds.concat(stOf(list[cur].id).id);
      note = `${qIds.length} เอกสารที่ตรง "${t}"` + (local.length ? ` · พบในผลที่เปิดอยู่ ${local.length} ที่` : '');
      apply();
    } catch (e) { qIds = null; note = 'ค้นหาไม่ได้: ' + e.message; apply() }
  }, 400);
});
$('rf').onclick = async () => {
  $('rf').disabled = true; $('rf').textContent = 'กำลังโหลด…';
  try { adoptDocs(await api.documents()); cur = 0; qIds = null; $('q').value = ''; apply(); }
  catch (e) { $('main').innerHTML = `<div class=err>โหลดรายการจาก Paperless ไม่ได้: ${esc(e.message)}</div>` }
  finally { $('rf').disabled = false; $('rf').textContent = 'รีเฟรชรายการ' }
};
$('clr').onclick = () => {                      // case ที่เก็บใน browser ทั้งหมด (ผลที่ server ยังเก็บอยู่ไม่หาย)
  if (!confirm('ลบ case ที่เก็บไว้ใน browser นี้ทั้งหมด?')) return;
  CASES = {}; writeCases();
  for (const id of Object.keys(RES)) { const r = stOf(+id); if (r.from === 'browser') { r.view = null; r.from = null } }
  apply();
};
addEventListener('resize', () => { if (pinned) renderPin() });

// --------------------------------------------------------------------------- รอบ (engine/results/<round>/)
function roundOpts(names) {
  return (names || []).map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
}
function fillRounds() {
  const names = ROUNDS.rounds || [], a = ROUNDS.active || '';
  const keepB = $('cmp_base').value, keepT = $('cmp_target').value;   // อย่าเลือกแทนสิ่งที่ผู้ทดสอบเลือกไว้
  $('round_sel').innerHTML = (names.includes(a) ? '' : `<option value="${esc(a)}">${esc(a)} (ยังไม่มีไฟล์)</option>`)
    + roundOpts(names);
  $('round_sel').value = a;
  const o = roundOpts(names) || '<option value="">(ยังไม่มีรอบใน results)</option>';
  $('cmp_base').innerHTML = o; $('cmp_target').innerHTML = o;
  $('cmp_base').value = names.includes(keepB) ? keepB : (names[0] || '');
  $('cmp_target').value = names.includes(keepT) ? keepT
    : (names.includes(a) ? a : (names[names.length - 1] || ''));
  const off = !!ROUNDS.err;                       // WEBAPP_PERSIST=0: ไม่มีโฟลเดอร์รอบให้เลือก
  $('round_sel').disabled = $('btn_new_round').disabled = $('btn_summary').disabled = $('btn_compare').disabled = off;
}
async function loadRounds() {
  try { ROUNDS = await api.rounds(); ROUNDS.err = ''; } catch (e) { ROUNDS = { rounds: [], active: '', err: e.message } }
  fillRounds();
}
function resetForRound() {          // ผลที่จำไว้ทั้งหมดเป็นของคนละรอบ - ของรอบใหม่ต้องอ่านจาก server ใหม่
  for (const k of Object.keys(RES)) {
    Object.assign(stOf(+k), { state: 'idle', run: 0, step: null, cls: null, rec: null, error: null, tb: null,
      seconds: null, boxes: 0, view: null, from: null, probed: false, b: '' });
  }
  SUMM = null; CMPD = null; SEL.clear(); cur = 0;
  last = `เปิดรอบ ${ROUNDS.active}`; note = '';
}
async function switchRound(name) {
  if (BT && BT.running) return alert('batch กำลังรันอยู่ — กดหยุดก่อนสลับรอบ');
  try { if (name && name !== ROUNDS.active) await api.roundSelect(name); }
  catch (e) { alert(`เปิดรอบ ${name} ไม่ได้: ${e.message}`); return loadRounds() }
  ROUNDS.active = name;
  resetForRound();
  await loadRounds();
  try { adoptDocs(await api.documents()); } catch (e) { note = 'อ่านรายการไม่ได้อย่างที่ควร'; }
  apply(); syncRun();
}
$('round_sel').onchange = () => switchRound($('round_sel').value);
$('btn_new_round').onclick = async () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const guess = 'run_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_'
    + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  const name = prompt(`ตั้งชื่อรอบใหม่ (ตัวอักษร/ตัวเลข/_/- เท่านั้น — ว่างคือ ${guess})`, guess);
  if (name === null) return;
  try { const r = await api.roundCreate((name || '').trim() || guess); await switchRound(r.round); }
  catch (e) { alert('สร้างรอบใหม่ไม่ได้: ' + e.message); loadRounds() }
};

// --------------------------------------------------------------------------- รันเป็นชุด (batch)
function batchIds() {
  const picked = list.filter(m => SEL.has(m.id)).map(m => m.id);
  return picked.length ? picked : list.map(m => m.id);
}
async function startBatch() {
  const ids = batchIds();
  if (!ids.length) return alert('ไม่มีเอกสารจะรัน — ล้างคำค้นหรือเลือกเอกสารก่อน');
  $('btn_batch').disabled = true;
  try {
    const r = await api.batchStart(ids, $('skip_existing').checked, +$('concurrency').value || 0);
    BATCH_IDS = ids;
    last = r.status === 'nothing-to-run' ? 'รอบนี้มีผลครบแล้ว ไม่มีอะไรต้องรัน'
      : `เริ่ม ${r.total} ฉบับ · ข้าม ${r.skipped || 0}` + (r.unknown ? ` · ไม่รู้จัก ${r.unknown}` : '');
    await batchPoll();
  } catch (e) { $('btn_batch').disabled = false; alert('รันชุดนี้ไม่ได้: ' + e.message) }
}
async function batchPoll() {
  clearTimeout(BTIMER);
  try {
    const st = await api.batchStatus();
    applyBatch(st);
    if (st.running) { BTIMER = setTimeout(batchPoll, 1200); return }        // จบแล้วค่อยอ่านรายการรอบนี้อีกครั้ง
    $('btn_batch').disabled = false;
    for (const id of BATCH_IDS) {                 // ผลของฉบับที่รันใหม่ต้องอ่านจากไฟล์ใหม่ ไม่ใช่ภาพที่จำไว้
      const r = stOf(id);
      if (r.view && r.from === 'server') { r.view = null; r.probed = false }
      if (CASES[id]) dropCase(id);                // case เก่าใน browser ก็ของคนละรอบกับที่เพิ่งรัน
    }
    BATCH_IDS = [];
    try { adoptDocs(await api.documents()); } catch (e) { }
    apply();
  } catch (e) { $('btn_batch').disabled = false; applyBatch(); note = `ถามสถานะ batch ไม่ได้: ${e.message}` }
}
function applyBatch(st) {
  if (st) BT = st;
  const b = BT || {}, on = !!b.running;
  $('batch_bar').classList[on ? 'add' : 'remove']('on');
  $('batch_fill').style.width = (b.percent || 0) + '%';
  $('batch_txt').innerHTML = on ? `รอบ <b>${esc(b.round || '')}</b> · ${b.processed}/${b.total} (${b.percent}%)`
    + ` · เสร็จ <span class=ok>${b.completed}</span> · <span class=error>error ${b.errors}</span>`
    + ` · ยกเลิก ${b.cancelled} · ข้าม ${b.skipped} · พร้อมกัน ${b.concurrency} ฉบับ`
    + `${b.current ? ` · กำลังรัน #${b.current}` : ''}${b.stopped ? ' · <b>หยุดตามคำขอ</b>' : ''}` : '';
  for (const m of DOCS) { const r = stOf(m.id); r.b = on && +b.current === +m.id ? 'bproc' : ''; }
  $('btn_stop').disabled = !on;
}
$('btn_batch').onclick = startBatch;
$('btn_stop').onclick = () => api.batchStop().then(applyBatch).catch(e => alert('หยุดไม่ได้: ' + e.message));
async function resumeBatch() {      // เปิด browser ใหม่ระหว่างที่ batch ยังรันอยู่ - server ยังรู้เสมอว่ารันอยู่
  try { const st = await api.batchStatus(); applyBatch(st);
    if (st.running) { $('btn_batch').disabled = true; batchPoll() } } catch (e) { }
}

// --------------------------------------------------------------------------- modal
function openModal(id) { closeModalAll(); $(id).classList.add('on') }
function closeModalAll() { $('modal_summary').classList.remove('on'); $('modal_compare').classList.remove('on') }
function openDoc(id) {                                  // แถวใน modal → ไปดูเอกสารนั้นใน portal
  let i = list.findIndex(x => +x.id === +id);
  if (i < 0 && DOCS.some(x => +x.id === +id)) { $('q').value = ''; qIds = null; apply();
    i = list.findIndex(x => +x.id === +id) }
  if (i < 0) return alert(`ไม่พบเอกสาร #${id} ในรายการของ DMS ตอนนี้`);
  cur = i; pinned = null; apply(); $('main').scrollTo(0, 0);
}
const pctOf = (n, total) => total ? (n / total * 100) : 0;
const vbar = (name, n, total) => `<div class=vbar><span>${esc(name)}</span>`
  + `<span class=vb><span class="vb-in v-${esc(name)}" style="width:${pctOf(n, total)}%"></span></span><b>${n || 0}</b></div>`;
const dot = v => `<span class="dot v-${esc(v || 'NONE')}"></span>`;

// --------------------------------------------------------------------------- summary ของรอบที่เปิดอยู่
function summaryHtml(s) {
  const md = s.metadata || {}, st = s.statistics || {}, c = st.counts || {}, rules = st.rules || {}, cs = s.cases || [];
  const total = +md.total_documents || cs.length || 0;
  const bars = Object.keys(c).map(k => vbar(k, c[k], total)).join('') || '<div class=ph>รอบนี้ยังไม่มีตัวเลข</div>';
  const rl = Object.keys(rules).map(k => {
    const r = rules[k] || {};
    return `<tr><td>${esc(k)}</td><td class=ok>${r.pass || 0}</td><td class=error>${r.fail || 0}</td>`
      + `<td class=partial>${r.manual_review || 0}</td><td class=idle>${r.not_evaluated || 0}</td></tr>`;
  }).join('');
  const rows = cs.map(x => `<tr data-open="${x.doc_id}"><td>${x.doc_id}</td>`
    + `<td>${dot(x.recommendation)} ${esc(x.recommendation || '—')}</td>`
    + `<td>${esc(x.invoice_num || '')}</td><td>${esc(x.po_number || '')}</td><td>${esc(x.max_severity || '')}</td>`
    + `<td>${esc(x.grand_total || '')} ${esc(x.currency || '')}</td>`
    + `<td>${x.elapsed_s == null ? '' : x.elapsed_s + 's'}</td>`
    + `<td>${(x.rule_results || []).filter(z => z.result !== 'pass')
      .map(z => `${esc(z.rule_id)}:${esc(z.result)}`).join(' ') || '—'}</td>`
    + `<td>${esc(x.error || '')}</td></tr>`).join('');
  return `<div class=st>รอบ <b>${esc(SUMV)}</b> · ${esc(md.title || '')} · ${esc(md.mode || '')}`
    + ` · ${esc(md.executed_at || '')} · ${total} ฉบับ · ${md.total_elapsed_s || 0}s · ${esc(md.output_directory || '')}</div>`
    + `<h4 class=sec>Recommendation ทั้งรอบ</h4>${bars}`
    + `<h4 class=sec>กฎแต่ละข้อ (rule_id · นับจากเอกสารทั้งรอบ)</h4><table><tr><th>rule_id</th><th>pass</th>`
    + `<th>fail</th><th>manual_review</th><th>not_evaluated</th></tr>${rl || '<tr><td colspan=5>ไม่มี</td></tr>'}</table>`
    + `<h4 class=sec>เอกสาร ${cs.length} ฉบับ — คลิกแถวเพื่อดูใน portal</h4><table><tr><th>doc_id</th><th>recommendation</th>`
    + `<th>invoice</th><th>PO</th><th>severity</th><th>ยอดรวม</th><th>เวลา</th><th>กฎที่ไม่ pass</th><th>error</th></tr>`
    + `${rows || '<tr><td colspan=9>ยังไม่มี</td></tr>'}</table>`;
}
async function showSummary(rebuild) {
  openModal('modal_summary');
  $('sm_body').innerHTML = '<div class=ph>กำลังอ่าน summary.json ของรอบนี้…</div>';
  $('sm_note').textContent = '';
  try {
    SUMM = rebuild ? await api.summaryRebuild() : await api.summary();
    SUMV = ROUNDS.active;
    $('sm_title').textContent = 'Summary ของรอบ ' + SUMV;
    $('sm_body').innerHTML = summaryHtml(SUMM);
  } catch (e) {
    SUMM = null;
    $('sm_body').innerHTML = `<div class=err>${esc(e.message)}</div>`
      + `<div class=ph>รอบที่ยังไม่ได้รันอะไรเลยย่อมไม่มี summary — กด “รวมใหม่” หลังรันเสร็จได้เสมอ</div>`;
  }
}
$('btn_summary').onclick = () => showSummary(false);
$('sm_rebuild').onclick = () => showSummary(true);
$('sm_dl').onclick = () => {                                 // ไฟล์เดียวกับที่ server เขียน ให้เก็บได้
  if (!SUMM) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(SUMM, null, 2)], { type: 'application/json' }));
  a.download = (SUMV || 'round') + '_summary.json'; a.click();
};

// --------------------------------------------------------------------------- เทียบสองรอบ
const D_LAB = { improved: ['d-up', 'ดีขึ้น'], regressed: ['d-down', 'แย่ลง'], unchanged: ['d-flat', 'เท่าเดิม'],
  added: ['d-added', 'เพิ่มมา'], removed: ['d-removed', 'หายไป'] };
function cmpShown(cs) {
  return cs.filter(x => CMPF === 'all' ? true : CMPF === 'changed' ? x.delta !== 'unchanged'
    : CMPF === 'up' ? x.delta === 'improved' || x.delta === 'added'
    : x.delta === 'regressed' || x.delta === 'removed');
}
function compareHtml(d) {
  const a = d.aggregate || {}, cs = d.cases || [];
  const chips = [['changed', 'เฉพาะที่เปลี่ยน'], ['all', 'ทั้งหมด'], ['up', '🟢 ดีขึ้น'], ['down', '🔴 แย่ลง']];
  const card = (lab, n, cls) => `<div class="crd ${cls || ''}"><b>${n || 0}</b>${lab}</div>`;
  const vs = Object.keys(a).filter(k => a[k] && typeof a[k] === 'object').map(k => {
    const n = a[k];
    return `<tr><td>${dot(k)} ${esc(k)}</td><td>${n.base}</td><td>${n.target}</td>`
      + `<td class="${n.diff > 0 ? 'up' : n.diff < 0 ? 'down' : 'flat'}">${n.diff > 0 ? '+' + n.diff : n.diff}</td></tr>`;
  }).join('');
  const rows = cmpShown(cs).map(x => {
    const L = D_LAB[x.delta] || ['', esc(x.delta || '')];
    const rc = (x.rule_changes || []).map(z => `${esc(z.rule_id)}:${esc(z.base || '—')}→${esc(z.target || '—')}`).join(' ');
    return `<tr data-open="${x.doc_id}"><td>${x.doc_id}</td>`
      + `<td>${dot(x.base_recommendation)} ${esc(x.base_recommendation || '—')}`
      + ` <span class=idle>${esc(x.base_severity || '')}</span></td>`
      + `<td class="${L[0]}">${dot(x.target_recommendation)} ${esc(x.target_recommendation || '—')}`
      + ` <span class=idle>${esc(x.target_severity || '')}</span></td>`
      + `<td>${esc(x.invoice_num || '')}</td><td>${esc(x.title || '')}</td>`
      + `<td class="${L[0]}">${L[1]}</td><td>${rc || '—'}</td></tr>`;
  }).join('');
  return `<div class=st>Base <b>${esc(d.base)}</b> → Target <b>${esc(d.target)}</b>`
    + ` · เอกสารที่เทียบได้ ${a.documents || 0} ฉบับ</div>`
    + `<div style="margin:6px 0">${card('ดีขึ้น', a.improved_count, 'up')}${card('แย่ลง', a.regressed_count, 'down')}`
    + ` ${card('เท่าเดิม', a.unchanged_count, 'flat')}${card('เพิ่มมา', a.added_count)}${card('หายไป', a.removed_count)}</div>`
    + `<div style="margin:6px 0">${chips.map(x => `<span class="chip${CMPF === x[0] ? ' on' : ''}" data-cmpf="${x[0]}">${x[1]}</span>`).join(' ')}</div>`
    + `<h4 class=sec>จำนวนแต่ละ recommendation เทียบกัน</h4><table><tr><th>recommendation</th><th>base</th>`
    + `<th>target</th><th>ผลต่าง</th></tr>${vs || '<tr><td colspan=4>ไม่มี</td></tr>'}</table>`
    + `<h4 class=sec>ทีละเอกสาร — คลิกแถวเพื่อดูใน portal</h4><table class=diff><tr><th>doc</th><th>base</th><th>target</th>`
    + `<th>invoice</th><th>ชื่อไฟล์</th><th>เปลี่ยนเป็น</th><th>กฎที่ขยับ</th></tr>`
    + `${rows || '<tr><td colspan=7>ไม่มีแถวที่ตรงกับชิ้นกรองนี้</td></tr>'}</table>`;
}
function cmpPaint() { $('cmp_body').innerHTML = compareHtml(CMPD || { aggregate: {}, cases: [] }) }
async function runCompare() {
  const b = $('cmp_base').value, t = $('cmp_target').value;
  CMPD = null;
  if (!b || !t) { $('cmp_body').innerHTML = '<div class=err>เลือกทั้งสองรอบก่อน (ใน results ยังไม่มีรอบไหนมีผล?)</div>'; return }
  $('cmp_note').textContent = 'กำลังเทียบ…';
  try { CMPD = await api.compare(b, t); $('cmp_note').textContent = ''; cmpPaint() }
  catch (e) { $('cmp_note').textContent = ''; $('cmp_body').innerHTML = `<div class=err>เทียบไม่ได้: ${esc(e.message)}</div>` }
}
$('btn_compare').onclick = () => { openModal('modal_compare'); if (!CMPD) runCompare() };
$('cmp_run').onclick = runCompare;
$('cmp_base').onchange = runCompare;
$('cmp_target').onchange = runCompare;


// --------------------------------------------------------------------------- เริ่มงาน
(async function boot() {
  try {
    META = await api.meta();
    COLORS = META.colors || {};
    initTypes(); initCmp(); loadCases();
    await loadRounds();                      // ต้องรู้ก่อนว่าเปิดรอบอยู่ เพราะ case ที่จำไว้ผูกกับรอบ
    updStat(); syncRun(); applyBatch();
    adoptDocs(await api.documents());
    apply();
    resumeBatch();
  } catch (e) {
    $('main').innerHTML = `<div class=err>โหลดรายการจาก Paperless ไม่ได้: ${esc(e.message)}<br>`
      + `<span class=idle>ตรวจ PAPERLESS_BASE_URL / PAPERLESS_API_TOKEN / PAPERLESS_TAG ใน .env</span></div>`;
    updStat(); syncRun();
  }
})();
