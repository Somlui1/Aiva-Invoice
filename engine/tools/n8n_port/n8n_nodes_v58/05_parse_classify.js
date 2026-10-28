// รวมคำตอบ classify (node 03 ยิงทีเดียวทุกหน้า -> items มี 1 ตัว) แล้วเลือกเฉพาะหน้า Invoice
// A2: ของเดิมรับ N items (หน้าละ answer) ตอนนี้ได้ 1 answer ที่ครอบคลุมทุกหน้าซึ่งมี 'p' กำกับอยู่แล้ว
//   เลือกหน้า/เรียง/ตัดสำเนา ใช้ logic เดิมที่ port จาก normalize_classify + select_invoice_pages + parse_marker
//   กฎเลขหน้าตอนโมเดลไม่ใส่ 'p' ต้องเหมือน python: int(p or page_no or page or i+1) -> i+1 = ลำดับใน list
// port จาก perception/single_pass.py::normalize_classify + select_invoice_pages + parse_marker
// สำคัญ: Code node ทำ binary หาย จึงส่ง binary 'pdf' ต่อไปด้วย (ดึงจาก node 'Get a document' binary 'data') เพื่อให้ node 06 (PDF Convert) มีไฟล์ใช้
//
// === v5.8 parity fixes in this node (อ่าน source ก่อนแก้ ไม่เดา) ================================
// (1) ถอด "fallback หน้า 1" ออก ของเดิม: ถ้า classify ไม่เจอหน้า invoice เลย จะ inv = classified.slice(0,1)
//     ซึ่ง engine ทำตรงข้าม: single_pass.py::select_invoice_pages returns  selected=[]  พร้อม
//     no_invoice_page=True + pages_complete=False แล้ว return ทันที ("no guessing page 1") ผลคือ E01 -> REVIEW
//     เทสที่จับไว้: harness/test_classify_select.mjs (เดิมรายงาน 3 เคสเป็น gap — ตอนนี้ต้องตรง python)
// (2) ถอดการ parse แบบ slice({..}) ออกมาใช้ ANSWER-DECODE ของ engine (strict แล้วค่อย salvage)
//     คำตอบที่ถูกตัดกลาง (finish_reason=length) engine ยังเก็บ member ที่ครบไว้ flow ต้องทำได้เหมือนกัน
// (3) ตอน decode ไม่ได้เลย = classify_failed -> สร้าง selection แบบเดียวกับ except-branch ของ extract()
// (4) ส่ง page_dims ต่อ (node 03 วัดภาพทุกหน้าที่ 80 DPI) เพื่อ path "ไม่มีหน้า invoice" สร้าง extraction
//     ที่มี pages ครบทุกหน้าได้ โดยไม่ต้องยิง extract
// >>> ANSWER-DECODE (inlined from n8n_nodes_v58/lib_answer_decode.js — test_answer_decode.py guards it)
const ANSWER_DECODE_VERSION = 'litellm_client.decode/1.0';
const SALVAGE_CUTS = 60;
const _FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gi;
const _THINK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;

function _stripFence(text) {
  return String(text === null || text === undefined ? '' : text).replace(_THINK, '').replace(_FENCE, '').trim();
}

// python: json.loads(re.sub(r",\s*([}\]])", r"\1", s[start:i + 1]))
function _fixTrailingCommas(s) { return s.replace(/,(\s*[}\]])/g, '$1'); }

function extractJsonObject(text) {
  if (text !== null && typeof text === 'object' && !Array.isArray(text)) return text;
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) throw new Error('no JSON object');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; } else if (ch === '{') { depth += 1; } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(_fixTrailingCommas(s.slice(start, i + 1)));
    }
  }
  throw new Error('truncated JSON object');
}

function salvageJsonObject(text) {
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) return null;
  const fragment = s.slice(start);
  let cut = fragment.length;
  const closers = { '{': '}', '[': ']' };
  for (let attempt = 0; attempt < SALVAGE_CUTS; attempt++) {
    let pos = -1;
    for (let i = Math.min(cut, fragment.length) - 1; i >= 0; i--) { if (fragment[i] === '}') { pos = i; break; } }
    if (pos < 0) return null;
    const cand = fragment.slice(0, pos + 1);
    const stack = [];
    let inStr = false, esc = false;
    for (const ch of cand) {
      if (inStr) {
        if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      } else if (ch === '"') { inStr = true; } else if (closers[ch]) { stack.push(closers[ch]); }
      else if (ch === '}' || ch === ']') { if (stack.length && stack[stack.length - 1] === ch) { stack.pop(); } }
    }
    if (!inStr) {
      // python: cand = re.sub(r",\s*$", "", cand.rstrip().rstrip(",")); json.loads(cand + "".join(reversed(stack)))
      const closed = cand.replace(/\s+$/, '').replace(/,+$/, '').replace(/,\s*$/, '') + stack.slice().reverse().join('');
      try { return JSON.parse(_fixTrailingCommas(closed)); } catch (e) { /* try the next cut */ }
    }
    cut = pos;
  }
  return null;
}

// The pair the engine runs when it is not allowed to spend another request: strict first, salvage second.
function decodeAnswer(text) {
  try { return { obj: extractJsonObject(text), salvaged: false, error: null }; }
  catch (e) {
    const first = String(e && e.message ? e.message : e);
    const got = salvageJsonObject(text);
    if (got) return { obj: got, salvaged: true, error: first };
    return { obj: {}, salvaged: false, error: first + ' | salvage: nothing recoverable' };
  }
}
// <<< END ANSWER-DECODE

const cfg = $('00 CONFIG (single point)').first().json;
const items = $input.all();
const n03 = $('03 Build classify request').first().json;
const nPages = n03.n_pages || ((items[0] || {}).json || {}).n_pages || items.length;
// ONE classify answer covers every page; decode it the way the engine decodes an answer
let answerText = ((((items[0] || {}).json || {}).choices || [])[0] || {}).message || {};
answerText = answerText.content || '{}';
const dec = decodeAnswer(answerText);
const ans = dec.obj;
let parseError = dec.error;
const classifyDecode = { version: ANSWER_DECODE_VERSION, salvaged: dec.salvaged, error: dec.error,
                         decode_recoveries_unavailable: dec.error ? 'REPAIR re-ask + enable_thinking=false re-ask are network calls; a Code node cannot re-ask' : null };
// >>> lib_select_wording (inlined from n8n_nodes_v58/lib_select_wording.js - test_lib_parity.py guards these bytes)
const THAI = '๐๑๒๓๔๕๖๗๘๙';
function thaiToArabic(s) { let o = ''; for (const c of String(s == null ? '' : s)) { const i = THAI.indexOf(c); o += i >= 0 ? String(i) : c; } return o; }
function normKey(s) { return thaiToArabic(s).toUpperCase().replace(/[^\p{L}\p{N}]/gu, ''); }
function rawv(c) { let v; if (c && typeof c === 'object') { v = c.raw !== undefined ? c.raw : (c.text !== undefined ? c.text : c.value); } else { v = c; } if (v == null) { return null; } const t = String(v).trim(); if (!t || ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) >= 0) { return null; } return t; }
function marker(m) {
  let t = String(m == null ? '' : m).trim().toLowerCase();
  if (!t) { return null; }
  t = t.split('page').join(' ').split('of').join('/').split('หน้า').join(' ').split('จาก').join('/').split('แผ่น').join(' ').split('ฉบับ').join(' ');
  const parts = t.split('/');
  if (parts.length !== 2) { return null; }
  const a = parseInt(parts[0].replace(/[^0-9]/g, ''), 10);
  const b = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
  if (isNaN(a) || isNaN(b)) { return null; }
  return (a >= 1 && a <= b) ? [a, b] : null;
}
// ---- normalize_classify ------------------------------------------------------------------------

// ---- select_invoice_pages ----------------------------------------------------------------------
function selectInvoicePages(pages) {
  const taxes = pages.filter(function (p) { return p.doc_type === 'tax_invoice'; });
  const invoices = pages.filter(function (p) { return p.doc_type === 'invoice'; });
  const inv = taxes.length ? taxes : (invoices.length ? invoices : []);
  const info = { invoice_pages_seen: inv.map(function (p) { return p.page_no; }), dropped: [], multi_invoice: false,
                 doc_numbers: [], no_invoice_page: false, pages_complete: true, marker_gaps: null };
  if (!inv.length) {                                  // engine: "no guessing page 1" -> return ทันที
    info.no_invoice_page = true; info.pages_complete = false; info.selected = [];
    return info;
  }
  let target = inv;
  const numbers = [];
  target.forEach(function (p) { const k = normKey(p.doc_no_hint); if (k.length >= 3 && numbers.indexOf(k) < 0) { numbers.push(k); } });
  info.doc_numbers = numbers;
  if (numbers.length > 1) {
    info.multi_invoice = true;
    const keep = target.filter(function (p) { const k = normKey(p.doc_no_hint); return k === numbers[0] || k === ''; });
    info.dropped = target.filter(function (p) { return keep.indexOf(p) < 0; })
      .map(function (p) { return { page: p.page_no, reason: 'other_document_number', doc_no_hint: p.doc_no_hint }; });
    target = keep;
  }
  const ordered = target.slice().sort(function (a, b) { return (a.copy_status === 'copy' ? 1 : 0) - (b.copy_status === 'copy' ? 1 : 0) || a.page_no - b.page_no; });
  const seen = {}; let kept = [];
  const keepers = [];
  ordered.forEach(function (p) {
    const m = marker(p.page_marker);
    const dk = normKey(p.doc_no_hint);
    const key = m ? (dk + '|' + m[0] + '/' + m[1]) : null;
    if (key && seen[key]) { info.dropped.push({ page: p.page_no, reason: 'reprint_same_number_and_marker', doc_no_hint: p.doc_no_hint, page_marker: p.page_marker }); return; }
    if (!m && dk.length >= 3 && p.copy_status === 'copy') {
      const hasOrig = ordered.some(function (x) { return x !== p && kept.indexOf(x.page_no) >= 0 && normKey(x.doc_no_hint) === dk && x.copy_status !== 'copy'; });
      if (hasOrig) { info.dropped.push({ page: p.page_no, reason: 'copy_sheet_of_existing_original', doc_no_hint: p.doc_no_hint }); return; }
    }
    if (key) { seen[key] = 1; }
    kept.push(p.page_no); keepers.push(p);
  });
  kept.sort(function (a, b) { return a - b; });
  const keptPages = target.filter(function (p) { return kept.indexOf(p.page_no) >= 0; });
  const printed = keptPages.map(function (p) { return marker(p.page_marker); }).filter(Boolean);
  if (printed.length) {
    const beyond = Math.max.apply(null, printed.map(function (m) { return m[1]; }));
    const reading = [];
    target.forEach(function (p) {
      if (kept.indexOf(p.page_no) < 0) { return; }
      if (p.page_no <= beyond || marker(p.page_marker)) { reading.push(p.page_no); } else { info.dropped.push({ page: p.page_no, reason: 'unmarked_page_beyond_printed_count', printed_pages: beyond, doc_no_hint: p.doc_no_hint }); }
    });
    kept = reading.sort(function (a, b) { return a - b; });
  }
  const keptNow = target.filter(function (p) { return kept.indexOf(p.page_no) >= 0; });
  const markers = keptNow.map(function (p) { return marker(p.page_marker); }).filter(Boolean);
  if (markers.length) {
    const total = Math.max.apply(null, markers.map(function (m) { return m[1]; }));
    const gaps = [];
    for (let i = 1; i <= total; i++) { if (!markers.some(function (m) { return m[0] === i; })) { gaps.push(i); } }
    if (gaps.length) { info.pages_complete = false; info.marker_gaps = gaps; }
  }
  info.selected = kept;
  return info;
}

// ---- single_pass.py::_fold_wording / _wording_in / invoice_wording (the R6-6 second-look gate) ----
// Node 05 never calls these; node 05e does. They live in this same block because the second look is only
// trustworthy when it applies the SAME selection rule as the first one: copy/pasting a second edition of
// select_invoice_pages is how a rescue starts overriding the gate it was never allowed to override.
function foldWording(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/[ัิ-ฺ็-๎]/g, '').split(' ').join('').toLowerCase();
}
const _TAX_INVOICE_WORD = foldWording('ใบกำกับภาษี');
const _TAX_INVOICE_EN = foldWording('TAX INVOICE');
const _INVOICE_WORD = foldWording('ใบแจ้งหนี้');
const _INVOICE_EN = foldWording('INVOICE');
const _DENIALS = ['ไม่ใช่', 'มิใช่', 'not a ', 'no tax', 'not the tax', 'this is not a tax'].map(foldWording);
const _DENIAL_WINDOW = 10;
function _wordingIn(folded) {
  const found = [];
  const groups = [['tax_invoice', [_TAX_INVOICE_WORD, _TAX_INVOICE_EN]], ['invoice', [_INVOICE_WORD, _INVOICE_EN]]];
  for (const grp of groups) {
    for (const needle of grp[1]) {
      let at = folded.indexOf(needle);
      while (at >= 0) {
        const before = folded.slice(Math.max(0, at - _DENIAL_WINDOW), at);
        if (!_DENIALS.some((d) => before.indexOf(d) >= 0)) found.push(grp[0]);
        at = folded.indexOf(needle, at + 1);
      }
    }
  }
  return found.indexOf('tax_invoice') >= 0 ? 'tax_invoice' : (found.indexOf('invoice') >= 0 ? 'invoice' : '');
}
function invoiceWording(text, kindWord) {                    // single_pass.invoice_wording
  const named = foldWording(kindWord === undefined ? '' : kindWord);
  return named ? _wordingIn(named) : _wordingIn(foldWording(text === undefined ? '' : text));
}
// <<< END lib_select_wording

// ---- normalize_classify ----
const TYPES = ['tax_invoice', 'invoice', 'delivery', 'po', 'other'];
const byPage = {};
(ans.pages || []).forEach(function (e, i) {
  if (!e || typeof e !== 'object') { return; }
  const p = parseInt(e.p || e.page_no || e.page || (i + 1), 10);   // '||' = int(a or b or i+1) ของ python (0/'' ตกไปค่าถัดไป)
  if (isNaN(p)) { return; }
  let t = String(e.t || e.doc_type || 'other').trim().toLowerCase();
  if (TYPES.indexOf(t) < 0) { t = t.indexOf('tax') >= 0 ? 'tax_invoice' : 'other'; }
  const c = String(e.c || e.copy_status || 'original').trim().toLowerCase();
  let r = parseInt(e.r != null ? e.r : (e.rotate_degrees != null ? e.rotate_degrees : 0), 10);
  if (isNaN(r)) { r = 0; }
  byPage[p] = { page_no: p, doc_type: t, copy_status: c === 'copy' ? 'copy' : 'original', doc_no_hint: rawv(e.n !== undefined ? e.n : e.doc_no_hint), page_marker: rawv(e.m !== undefined ? e.m : e.page_marker), rotate_degrees: [0, 90, 180, 270].indexOf(r) >= 0 ? r : 0, handwritten: (Array.isArray(e.h) ? e.h : []).map(function (x) { return String(x).trim(); }).filter(Boolean) };
});
const classified = [];
for (let p = 1; p <= nPages; p++) { classified.push(byPage[p] || { page_no: p, doc_type: 'other', copy_status: 'original', doc_no_hint: null, page_marker: null, rotate_degrees: 0, handwritten: [], missing_in_answer: true }); }

let selection = selectInvoicePages(classified);
// decode พังสนิท = engine's except-branch ใน extract(): ทุกหน้าเป็น 'other', ไม่อ่านหน้าไหน, บันทึกเหตุผล
if (dec.error && !(ans && ans.pages)) {
  selection = { invoice_pages_seen: [], dropped: [], multi_invoice: false, doc_numbers: [],
                no_invoice_page: true, pages_complete: false, marker_gaps: null, selected: [],
                classify_failed: dec.error };
}
const kept = selection.selected || [];
const fallback = false;                     // คง key ไว้ให้ node 12/22 เดิมไม่พัง แต่ค่าคือ false เสมอ (engine ไม่ fallback)
const first = kept.length ? kept[0] : (classified.length ? classified[0].page_no : 1);
const primary = classified.filter(function (p) { return p.page_no === first; })[0] || classified[0] || { rotate_degrees: 0, doc_type: 'other', doc_no_hint: null, copy_status: 'original' };
return [{ json: { total_pages: nPages, classify_calls: items.length, pages_classification: classified,
                  selection: selection, selected_invoice_pages: kept, invoice_page: first,
                  ext_key: 'ext_page_' + first, rotate_degrees: primary.rotate_degrees, doc_type: primary.doc_type,
                  doc_no_hint: primary.doc_no_hint, is_original: primary.copy_status !== 'copy',
                  multi_invoice_detected: selection.multi_invoice, pages_complete: selection.pages_complete,
                  no_invoice_page: !!selection.no_invoice_page, empty_read: !kept.length,
                  fallback_used: fallback, fallback_note: 'engine ไม่เดาหน้า 1: ไม่มีหน้า invoice = ไม่อ่านหน้าไหน (E01 -> REVIEW)',
                  parse_error: parseError, classify_decode: classifyDecode,
                  page_dims: n03.page_dims || [], model: cfg.model, dpi_classify: cfg.dpi_classify },
          binary: { pdf: $('Get a document').first().binary.data } }];
