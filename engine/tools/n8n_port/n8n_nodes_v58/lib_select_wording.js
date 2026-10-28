// lib_select_wording.js - the page-selection and invoice-wording rules that more than one node must
// apply identically. A Code node has no require(), so each node carries these bytes verbatim and
// harness/test_lib_parity.py fails when a copy drifts. Ported from perception/single_pass.py:
//   thai_to_arabic/norm_key/_raw/parse_marker (the helpers normalize_classify uses),
//   select_invoice_pages, _fold_wording/_wording_in/invoice_wording.
// Node 05 (classify -> selection) and node 05e (adjudicate -> selection) run the SAME function on
// purpose: the second look may change a page's doc_type, it may not bring its own selection rule.

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
