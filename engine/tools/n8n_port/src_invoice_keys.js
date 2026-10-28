// =================================================================================================
// src_invoice_keys.js — the keys a receipt can be found with (application/invoice_keys.py)
//                      + PO-LIST narrowing (application/receipt_scope.py)
// =================================================================================================

const _TOKEN = /[A-Za-z0-9][A-Za-z0-9/\-._]*/g;
const _LABEL_WORDS = /^(NO|NUMBER|INVOICE|TAX|DOC|REF|DOCUMENT|DATE|PO|PAGE|BILL|ORDER|RECEIPT|RECEIVING|SHIPPING|PSC|PURCHASE|CONFIRM|WORK|REV)\.?:?$/i;
const _DATE3 = /^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/;

function normKey(s) { return thaiToArabic(String(s === null || s === undefined ? '' : s)).replace(/\s+/g, '').toUpperCase(); }
function isDate(k) {
  const m = _DATE3.exec(k);
  if (!m) return false;
  const [a, b, c] = [m[1], m[2], m[3]];
  if (a.length === 4) { const y = +a, mo = +b, d = +c; return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && ((y >= 1900 && y <= 2100) || (y >= 2400 && y <= 2700)); }
  const d = +a, mo = +b;
  if (!(d >= 1 && d <= 31 && mo >= 1 && mo <= 12)) return false;
  return c.length === 2 || (c.length === 4 && ((+c >= 1900 && +c <= 2100) || (+c >= 2400 && +c <= 2700)));
}
function tokens(text) {
  const out = [];
  for (let part of String(text === null || text === undefined ? '' : text).split(/[|,;]/).map(p => thaiToArabic(p)).map(p => p.trim())) {
    const whole = normKey(part.replace(/^[^A-Za-z0-9]*/, ''));
    let toks = (part.match(_TOKEN) || []).map(t => t.replace(/[.:-]+$/, ''));
    toks = toks.filter(t => t && !_LABEL_WORDS.test(t));
    for (const t of toks) out.push(t);
    if (whole && out.indexOf(whole) < 0 && toks.length > 1 && toks.length <= 3 && whole.length <= 40) out.push(whole);
  }
  return out;
}
function usable(tok, exclude, notShapes) {
  const k = normKey(tok);
  if (!k || exclude.has(k) || !safeInvoice(k) || !/[0-9]/.test(k)) return false;
  const digits = k.replace(/[^0-9]/g, '');
  if (/^[0-9]+$/.test(k) && (k.length === 8 || k.length === 13)) return false;
  if (exclude.has(digits) && digits.length >= 8) return false;
  if (/^[0-9]+$/.test(k) && (notShapes || []).some(([pre, ln]) => k.startsWith(pre) && k.length === ln)) return false;
  if (isDate(k) || digits.length < 3) return false;
  return true;
}

function documentCandidates(extra, primary, opts) {
  const o = opts || {}, ex = extra || {};
  const types = new Set((o.pageTypes || []).map(t => String(t).toLowerCase()));
  const want = (o.labels || []).map(l => String(l).toLowerCase());
  const pageType = {}; for (const [k, v] of Object.entries(ex.doc_type_by_page || {})) pageType[String(k)] = String(v).toLowerCase();
  const exclude = new Set();
  for (const x of o.exclude || []) if (x) exclude.add(normKey(x));
  if (primary) exclude.add(normKey(primary));
  const shapes = (o.receiptPatterns || []).filter(p => p && p.prefix).map(p => [String(p.prefix), parseInt(p.length, 10)]);
  const seen = {}, count = {};
  const pagesSorted = Object.keys(ex.items_by_page || {}).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  for (const page of pagesSorted) {
    if (!types.has(pageType[String(page)])) continue;
    for (const it of (ex.items_by_page || {})[page] || []) {
      const label = String((it || {}).label || '').toLowerCase();
      if (!want.some(w => label.startsWith(w))) continue;
      for (const tok of tokens((it || {}).text)) {
        if (!usable(tok, exclude, shapes)) continue;
        const k = normKey(tok);
        if (!seen[k]) seen[k] = { key: k, pages: [], labels: [], source: 'document' };
        const d = seen[k];
        if (d.pages.indexOf(parseInt(page, 10)) < 0) d.pages.push(parseInt(page, 10));
        if (d.labels.indexOf(label) < 0) d.labels.push(label);
        count[k] = (count[k] || 0) + 1;
      }
    }
  }
  for (const [page, items] of Object.entries(ex.items_by_page || {})) {
    if (!types.has(pageType[String(page)])) continue;
    let parts = (items || []).filter(it => String((it || {}).label || '').toLowerCase().startsWith('doc_no'))
      .map(it => normKey((it || {}).text));
    parts = parts.filter(p => /^[0-9]+$/.test(p) && p.length >= 3 && p.length <= 8);
    for (let i = 0; i + 1 < parts.length; i++) {
      const k = parts[i] + '/' + parts[i + 1];
      if (!(k in seen) && usable(k, exclude, shapes)) seen[k] = { key: k, pages: [parseInt(page, 10)], labels: ['doc_no+doc_no'], source: 'joined' };
    }
  }
  if (o.cropAlternates !== false) {
    for (const c of ex.crop_reads || []) {
      if (c.field !== 'invoice_num') continue;
      for (const raw of [c.crop, c.vlm]) {
        for (const tok of tokens(raw)) {
          if (usable(tok, exclude, shapes) && !(normKey(tok) in seen)) {
            const k = normKey(tok);
            seen[k] = { key: k, pages: [c.page], labels: ['crop_reread'], source: 'crop' };
            count[k] = (count[k] || 0) + 1;
          }
        }
      }
    }
  }
  return Object.values(seen).sort((x, y) => {
    const a = -(count[x.key] || 0), b = -(count[y.key] || 0);
    if (a !== b) return a - b;
    const mp = (d) => Math.min(...(d.pages.length ? d.pages.map(p => p || 0) : [0]));
    if (mp(x) !== mp(y)) return mp(x) - mp(y);
    return x.key < y.key ? -1 : (x.key > y.key ? 1 : 0);
  });
}

function receiptNumCandidates(extra, patterns, limit) {
  const pats = (patterns || []).filter(p => p && p.prefix && p.length).map(p => [String(p.prefix), parseInt(p.length, 10)]);
  if (!pats.length) return [];
  const found = {}, count = {};
  const rx = /(?<![0-9])([0-9]{6,15})(?![0-9])/g;
  for (const page of Object.keys((extra || {}).items_by_page || {}).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))) {
    for (const it of (extra || {}).items_by_page[page] || []) {
      const text = thaiToArabic(String((it || {}).text || '')).replace(/\s+/g, '');
      let m; rx.lastIndex = 0;
      while ((m = rx.exec(text)) !== null) {
        const n = m[1];
        if (!pats.some(([pre, ln]) => n.startsWith(pre) && n.length === ln)) continue;
        if (!found[n]) found[n] = { receipt_num: n, pages: [], labels: [] };
        const d = found[n];
        if (d.pages.indexOf(parseInt(page, 10)) < 0) d.pages.push(parseInt(page, 10));
        const lab = String((it || {}).label || '');
        if (d.labels.indexOf(lab) < 0) d.labels.push(lab);
        count[n] = (count[n] || 0) + 1;
      }
    }
  }
  return Object.values(found)
    .sort((x, y) => {
      const a = -(count[x.receipt_num] || 0), b = -(count[y.receipt_num] || 0);
      if (a !== b) return a - b;
      if (Math.min(...x.pages) !== Math.min(...y.pages)) return Math.min(...x.pages) - Math.min(...y.pages);
      return x.receipt_num < y.receipt_num ? -1 : (x.receipt_num > y.receipt_num ? 1 : 0);
    })
    .slice(0, Math.max(0, parseInt(limit === undefined ? 2 : limit, 10)));
}

// ---------------------------------------------------------------- receipt_scope.py (PO-LIST narrowing)
const _key = (s) => String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
function narrowPoList(snap, doc, std) {
  if (snap === null || snap === undefined) return snap;
  if (!((((std.policy || {}).oracle || {}).lookup || {}).po_list_narrowing) === true) return snap;
  if (snap.lookup_path !== 'PO-LIST' || OracleSession.receiptNums(snap).length <= 1) return snap;
  const active = OracleSession.active(snap);
  const byRcv = {};
  for (const r of active) (byRcv[r.receipt_num] = byRcv[r.receipt_num] || []).push(r);
  const keys = new Set((((snap.query_keys || {}).invoice_variants) || []).map(_key));
  if ((snap.query_keys || {}).invoice_num) keys.add(_key(snap.query_keys.invoice_num));
  keys.delete('');
  let chosen = [], rule = null;
  const hit = sortedStr(Object.keys(byRcv).filter(n =>
    byRcv[n].some(r => [_key(r.shipment_num), _key(r.packing_slip), _key(r.waybill_num),
      _key((r.extra || {}).SHIPMENT_NUM), _key((r.extra || {}).PACKING_SLIP)].some(x => keys.has(x)))));
  if (hit.length) { chosen = hit; rule = 'header_key_equals_invoice_num'; }
  if (!chosen.length) {
    const sub = D((doc.fields.sub_total || {}).value);
    if (sub !== null && dIsPos(sub)) {
      const tol = std.tol('total');
      const same = sortedStr(Object.keys(byRcv).filter(n => {
        let s = null; for (const r of byRcv[n]) s = dAdd(s, D(r.line_amount));
        return dCmp(dAbs(dSub(s === null ? D(0) : s, sub)), tol) <= 0;
      }));
      if (same.length === 1) { chosen = same; rule = 'receipt_total_equals_sub_total'; }
    }
  }
  if (!chosen.length) {
    const open = sortedStr(Object.keys(byRcv).filter(n => byRcv[n].some(r => dCmp(D(r.qty_billed), D(r.qty)) < 0)));
    if (open.length === 1) { chosen = open; rule = 'only_receipt_with_unbilled_qty'; }
  }
  const note = { from_receipts: Object.keys(byRcv).length, from_rows: snap.rows.length, rule };
  if (!chosen.length) {
    note.result = 'ambiguous';
    return { ...snap, query_keys: { ...(snap.query_keys || {}), po_list_narrowing: note, po_list_ambiguous: true } };
  }
  const keep = new Set(chosen);
  const rows = snap.rows.filter(r => keep.has(r.receipt_num));
  const last = snap.rows.map(r => r.receipt_num).sort().slice(-1)[0];
  const capped = snap.row_cap_hit && keep.has(last);
  note.result = 'narrowed'; note.kept_receipts = sortedStr(chosen);
  note.set_aside_receipts = sortedStr(Object.keys(byRcv).filter(n => !keep.has(n)));
  note.row_cap_hit_before = snap.row_cap_hit;
  return {
    ...snap, rows, row_cap_hit: capped,
    po_numbers: sortedStr([...new Set(rows.map(r => r.po_number).filter(x => x !== null && x !== undefined && x !== ''))]),
    query_keys: { ...(snap.query_keys || {}), po_list_narrowing: note }
  };
}
