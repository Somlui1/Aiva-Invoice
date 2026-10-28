// 05e Parse adjudicate + reselect — fold the second look back into the evidence and run the SAME selection
// rule again. Engine: single_pass.py::_adjudicate returns (classified, selection, log):
//   quote   = " | " of the non-empty quotes
//   named   = kind_word_seen                        // the name the page gives itself
//   kind    = invoice_wording(quote, kind_word=named)
//   a page is reopened ONLY when kind is truthy AND it was not already an invoice page
//   selection = select_invoice_pages(classified)    // unchanged rule: copies, markers, multi-document
// and: "If the second look cannot answer, the original decision stands and the failure is recorded" — the
// engine breaks out of the loop on the first failing page and records page_errors["adjudicate"].
const decode = (function () {                                 // same bytes as lib_answer_decode.js (guarded)
  const _FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gi;
  const _THINK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;
  const strip = (t) => String(t === null || t === undefined ? '' : t).replace(_THINK, '').replace(_FENCE, '').trim();
  const fix = (s) => s.replace(/,(\s*[}\]])/g, '$1');
  function strict(text) {
    const s = strip(text), start = s.indexOf('{');
    if (start < 0) throw new Error('no JSON object');
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) return JSON.parse(fix(s.slice(start, i + 1))); }
    }
    throw new Error('truncated JSON object');
  }
  function salvage(text) {
    const s = strip(text), start = s.indexOf('{');
    if (start < 0) return null;
    const frag = s.slice(start);
    let cut = frag.length;
    const closers = { '{': '}', '[': ']' };
    for (let attempt = 0; attempt < 60; attempt++) {
      let pos = -1;
      for (let i = Math.min(cut, frag.length) - 1; i >= 0; i--) { if (frag[i] === '}') { pos = i; break; } }
      if (pos < 0) return null;
      const cand = frag.slice(0, pos + 1);
      const stack = [];
      let inStr = false, esc = false;
      for (const ch of cand) {
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; }
        else if (ch === '"') inStr = true; else if (closers[ch]) stack.push(closers[ch]);
        else if (ch === '}' || ch === ']') { if (stack.length && stack[stack.length - 1] === ch) stack.pop(); }
      }
      if (!inStr) {
        const closed = cand.replace(/\s+$/, '').replace(/,+$/, '').replace(/,\s*$/, '') + stack.slice().reverse().join('');
        try { return JSON.parse(fix(closed)); } catch (e) { /* next cut */ }
      }
      cut = pos;
    }
    return null;
  }
  return function (text) {
    try { return { obj: strict(text), salvaged: false, error: null }; }
    catch (e) {
      const first = String(e && e.message ? e.message : e);
      const got = salvage(text);
      return got ? { obj: got, salvaged: true, error: first }
                 : { obj: {}, salvaged: false, error: first + ' | salvage: nothing recoverable' };
    }
  };
})();

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
// normalize_classify itself stays in node 05: node 05e receives its already-normalized
// pages_classification (single_pass._adjudicate is handed `classified` too, it does not re-parse the answer).
// <<< END lib_select_wording
// <<< END lib_select_wording

const cfg = $('00 CONFIG (single point)').first().json;
const n5 = $('05 Parse classify pick invoice pages').first().json;
const classified = JSON.parse(JSON.stringify(n5.pages_classification || []));
let selection = n5.selection || {};
const pageErrors = Object.assign({}, n5.page_errors || {});
const log = [];
let changed = false, stopped = null;

const items = $input.all();                                  // node 05d answered one item per page, in order
// node 05d is an HTTP node: its response REPLACES the item's json, so page_no has to come from the request
// side. Order is the pairing that survives: 05c emitted pages in classify order and the HTTP node answers
// them in that same order, item for item. `.item` is unreliable inside a loop over all items, so zip by index.
const asked = $('05c Adjudicate request').all().map((i) => Number(((i || {}).json || {}).page_no));
if (asked.length !== items.length) {
  pageErrors.adjudicate = 'ADJUDICATE_ANSWER_COUNT: asked ' + asked.length + ' pages, got ' + items.length + ' answers';
}
for (let i = 0; i < items.length; i++) {
  const j = items[i].json || {};
  const want = asked[i] !== undefined ? asked[i] : NaN;
  const err = j.error || (j.choices === undefined ? 'no choices in the adjudicate response' : null);
  if (err) {                                                 // engine: page_errors["adjudicate"] = ...; break
    pageErrors.adjudicate = String(typeof err === 'object' ? (err.message || JSON.stringify(err)) : err).slice(0, 200);
    stopped = want;
    break;
  }
  const dec = decode((((j.choices || [])[0] || {}).message || {}).content || '{}');
  const ans = dec.obj || {};
  const entry = classified.find((c) => Number(c.page_no) === want) || {};
  const quote = (Array.isArray(ans.quotes) ? ans.quotes : [])
    .map((q) => String(q).trim()).filter((q) => q).join(' | ');
  const named = String(ans.kind_word_seen || '').trim();
  const kind = invoiceWording(quote, named);
  log.push({ page_no: want, was: entry.doc_type || null, accepted: kind || false, named_as: named.slice(0, 80),
             quote: quote.slice(0, 400), said_tax_invoice: !!(ans.serves_as_tax_invoice), dpi: 150 });
  if (kind && ['tax_invoice', 'invoice'].indexOf(entry.doc_type) < 0) {
    entry.doc_type = kind;
    changed = true;
  }
}
if (changed) selection = selectInvoicePages(classified);     // the same rule, on better evidence
const kept = (selection.selected || []).map(Number);
const first = kept.length ? kept[0] : (classified.length ? Number(classified[0].page_no) : 1);

return [{ json: { total_pages: n5.total_pages, classify_calls: n5.classify_calls,
                  pages_classification: classified, selection: selection, selected_invoice_pages: kept,
                  invoice_page: first, ext_key: 'ext_page_' + first,
                  rotate_degrees: Number(((classified.find((c) => Number(c.page_no) === first) || {}).rotate_degrees) || 0),
                  doc_type: ((classified.find((c) => Number(c.page_no) === first) || {}).doc_type) || null,
                  doc_no_hint: ((classified.find((c) => Number(c.page_no) === first) || {}).doc_no_hint) || null,
                  is_original: ((classified.find((c) => Number(c.page_no) === first) || {}).copy_status) !== 'copy',
                  multi_invoice_detected: !!selection.multi_invoice, pages_complete: !!selection.pages_complete,
                  no_invoice_page: !kept.length, empty_read: !kept.length, adjudication: log,
                  adjudicate_stopped_at: stopped, page_errors: pageErrors,
                  adjudicate_reopened: changed,
                  fallback_used: false, parse_error: n5.parse_error || null, classify_decode: n5.classify_decode,
                  page_dims: n5.page_dims || [], model: cfg.model, dpi_classify: cfg.dpi_classify,
                  selection_source: 'adjudicate' },
          binary: { pdf: $('Get a document').first().binary.data } }];
