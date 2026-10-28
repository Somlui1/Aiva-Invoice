// =================================================================================================
// src_normalize.js — node 15: raw -> normalized values  (mirror of domain/normalize.py, Table 3)
// Values cross node boundaries as strings: money/qty are Decimal strings, dates ISO, ids plain.
// =================================================================================================

const MONEY_FIELDS = { sub_total: 1, vat: 1, grand_total: 1, qty: 1, unit_price: 1, amount: 1 };

class Invalid extends Error { }

function taxId(raw) {
  let d = thaiToArabic(String(raw)).replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('0155') === 0) {
    const cand = '011' + d.slice(2);
    const n = cand.split('').map(c => parseInt(c, 10));
    let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
    if ((11 - sum % 11) % 10 === n[12]) d = cand;
  }
  if (d.length !== 13) throw new Invalid('TAX_ID_NOT_13_DIGITS');
  const n = d.split('').map(c => parseInt(c, 10));
  let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
  if ((11 - sum % 11) % 10 !== n[12]) throw new Invalid('TAX_ID_CHECKSUM');
  return d;
}
function taxIdLoose(raw) {
  let d = thaiToArabic(String(raw || '')).replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('0155') === 0) {
    const cand = '011' + d.slice(2);
    const n = cand.split('').map(c => parseInt(c, 10));
    let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
    if ((11 - sum % 11) % 10 === n[12]) d = cand;
  }
  return d.length === 13 ? d : null;
}

const CURRENCY_RE = /(฿|THB|บาท)/gi;
function splitNumber(raw) {                         // -> [Decimal-string, unit|null] ; throws Invalid
  let s = thaiToArabic(String(raw)).replace(CURRENCY_RE, '').trim();
  s = s.replace(/(?<=\d)\s*(?:\.-|-)(?=\s|$|\/)/g, '').trim();
  const neg = /^\(\s*(\d[\d,]*(?:\.\d+)?)\s*\)$/.exec(s);
  if (neg) return [dStr(dNeg(D(neg[1].replace(/,/g, '')))), null];
  const m = /^(-?\d[\d,]*(?:\.\d+)?)\s*(.*)$/.exec(s);
  if (!m) throw new Invalid('NOT_A_NUMBER');
  const num = m[1]; let tail = (m[2] || '').trim();
  let unit = null;
  if (tail) {
    const u = /^(?:\/\s*)?([A-Za-z\u0E01-\u0E4E][A-Za-z\u0E01-\u0E4E.]{0,11})$/.exec(tail);
    if (u) { unit = u[1].replace(/\.+$/, '') || null; }
    else if (!/^\([^()]*\)$/.test(tail)) throw new Invalid('NOT_A_NUMBER');
  }
  return [decFromGrouped(num), unit];
}
function decFromGrouped(num) {                      // normalize._dec
  if ((num.match(/,/g) || []).length && !/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(num)) throw new Invalid('NOT_A_NUMBER');
  const t = num.replace(/,/g, '');
  if (D(t) === null || D(t).nan) throw new Invalid('NOT_A_NUMBER');
  return dStr(D(t));
}
function money(raw) { return splitNumber(raw)[0]; }
function invoiceNum(raw) {
  const s = thaiToArabic(String(raw)).replace(/\s+/g, '').toUpperCase();
  if (!s) throw new Invalid('EMPTY');
  return s;
}
function poAndRelease(raw) {                        // -> [po, release|null]
  const s = thaiToArabic(String(raw).trim()).replace(/^\D+/, '');
  const parts = s.split(/[-/\s]+/).filter(x => x !== '');
  if (!parts.length || !/^\d+$/.test(parts[0])) throw new Invalid('PO_NOT_NUMERIC');
  const head = parts[0];
  if (head.length > 8) return [head.slice(0, 8), head.slice(8) || null];
  if (head.length !== 8) throw new Invalid('PO_NOT_8_DIGITS');
  return [head, (parts.length > 1 && /^\d+$/.test(parts[1]) ? parts[1] : null)];
}
const MONTHS = {
  JAN: 1, JANUARY: 1, 'ม.ค.': 1, 'ม.ค': 1, 'มกราคม': 1,
  FEB: 2, FEBRUARY: 2, 'ก.พ.': 2, 'ก.พ': 2, 'กุมภาพันธ์': 2,
  MAR: 3, MARCH: 3, 'มี.ค.': 3, 'มี.ค': 3, 'มีนาคม': 3,
  APR: 4, APRIL: 4, 'เม.ย.': 4, 'เม.ย': 4, 'เมษายน': 4,
  MAY: 5, 'พ.ค.': 5, 'พ.ค': 5, 'พฤษภาคม': 5,
  JUN: 6, JUNE: 6, 'มิ.ย.': 6, 'มิ.ย': 6, 'มิถุนายน': 6,
  JUL: 7, JULY: 7, 'ก.ค.': 7, 'ก.ค': 7, 'กรกฎาคม': 7,
  AUG: 8, AUGUST: 8, 'ส.ค.': 8, 'ส.ค': 8, 'สิงหาคม': 8,
  SEP: 9, SEPTEMBER: 9, SEPT: 9, 'ก.ย.': 9, 'ก.ย': 9, 'กันยายน': 9,
  OCT: 10, OCTOBER: 10, 'ต.ค.': 10, 'ต.ค': 10, 'ตุลาคม': 10,
  NOV: 11, NOVEMBER: 11, 'พ.ย.': 11, 'พ.ย': 11, 'พฤศจิกายน': 11,
  DEC: 12, DECEMBER: 12, 'ธ.ค.': 12, 'ธ.ค': 12, 'ธันวาคม': 12
};
function dateIso(raw) {
  const t = thaiToArabic(String(raw));
  let m = /(?<!\d)(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})(?!\d)/.exec(t);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else {
    const mt = /(?<!\d)(\d{1,2})[\s\-/]+([A-Za-z\u0E01-\u0E4E.]+?)[\s\-/]+(\d{2,4})(?!\d)/.exec(t);
    if (mt && MONTHS[mt[2].trim().toUpperCase()] !== undefined) {
      d = +mt[1]; mo = MONTHS[mt[2].trim().toUpperCase()]; y = +mt[3];
      if (y < 100) y = y >= 50 ? 2500 + y : 2000 + y;
    } else {
      m = /(?<!\d)(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})(?!\d)/.exec(t);
      if (!m) throw new Invalid('DATE_FORMAT');
      d = +m[1]; mo = +m[2]; y = +m[3];
      if (y < 100) y = y >= 50 ? 2500 + y : 2000 + y;
    }
  }
  if (y > 2400) y -= 543;
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) throw new Invalid('DATE_FORMAT');
  return String(y).padStart(4, '0') + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
function textNorm(raw) { return String(raw).replace(/\s+/g, ' ').trim(); }

const NORMALIZERS = {
  customer_tax_id: (r) => taxId(r),
  supplier_tax_id: (r) => { const t = taxIdLoose(r); return t !== null ? t : textNorm(r); },
  invoice_num: invoiceNum, invoice_date: dateIso,
  currency: (r) => textNorm(r).toUpperCase() || 'THB',
  sub_total: money, vat: money, grand_total: money, qty: money, unit_price: money, amount: money
};
function normalizeOne(std, name, rf) {              // normalize._nfield -> NField (plain object)
  if (rf === null || rf === undefined || rf.raw === null || String(rf.raw).trim() === '') {
    const reason = ((rf && rf.null_reason) || 'NOT_PRESENT');
    return { name, element_id: null, raw: null, value: null, confidence: rf && rf.confidence != null ? rf.confidence : null, ok: false, null_reason: reason, evidence: [] };
  }
  const th = std.threshold(name), minConf = th[0], needAgree = th[1];
  let value;
  try { value = (NORMALIZERS[name] || textNorm)(rf.raw); }
  catch (e) { return { name, element_id: null, raw: rf.raw, value: null, confidence: rf.confidence != null ? rf.confidence : null, ok: false, null_reason: 'INVALID_FORMAT:' + e.message, evidence: [] }; }
  const base = { name, element_id: null, raw: rf.raw, value, confidence: rf.confidence != null ? rf.confidence : null };
  if (needAgree && !rf.agreement) return { ...base, ok: false, null_reason: 'CONFLICT_BETWEEN_SOURCES', evidence: [] };
  if (rf.confidence !== null && rf.confidence !== undefined && rf.confidence < minConf) return { ...base, ok: false, null_reason: 'LOW_CONFIDENCE', evidence: [] };
  return { ...base, ok: true, null_reason: null, evidence: [] };
}

const PO_TOKEN = /(?<![0-9A-Za-z])(\d{8})(?:-(\d{1,4}))?(?![0-9])/g;
function poTokens(...texts) {                       // normalize.po_tokens
  const out = [];
  for (const t of texts) {
    const re = new RegExp(PO_TOKEN.source, 'g'); let m;
    while ((m = re.exec(thaiToArabic(String(t === null || t === undefined ? '' : t))))) {
      if (out.indexOf(m[1]) < 0) out.push(m[1]);
    }
  }
  return out;
}
function linePoRefs(rawCells) {
  const g = k => (rawCells[k] !== null && rawCells[k] !== undefined) ? rawCells[k].raw : null;
  return poTokens(g('item_code'), g('description'));
}

function normalizeDocument(ext, std) {              // normalize.normalize -> [doc, meta]
  const did = ext.invoice_document_id, fields = {}, meta = {};
  for (const [name, rf] of Object.entries(ext.fields)) {
    const eid = did + '-f-' + name;
    if (name === 'po_number') {
      let nf = normalizeOne(std, 'po_number', rf); nf.element_id = eid;
      if (rf.raw) {
        try {
          const pr = poAndRelease(rf.raw);
          nf = { ...nf, value: pr[0], ok: rf.raw ? nf.ok : nf.ok };
          meta.release_num = pr[1];
        } catch (e) {
          nf = { name: 'po_number', element_id: eid, raw: rf.raw, value: null, confidence: rf.confidence != null ? rf.confidence : null, ok: false, null_reason: 'INVALID_FORMAT:' + e.message, evidence: [] };
        }
      }
      fields[name] = nf;
    } else {
      const nf = normalizeOne(std, name, rf); nf.element_id = eid; fields[name] = nf;
    }
  }
  for (const req of std.policy.required_fields) {
    if (!fields[req]) fields[req] = { name: req, element_id: did + '-f-' + req, raw: null, value: null, confidence: null, ok: false, null_reason: 'NOT_PRESENT', evidence: [] };
  }
  if (meta.release_num === undefined) meta.release_num = null;
  const poRf = ext.fields.po_number;
  meta.po_numbers = poTokens(poRf && poRf.raw !== undefined ? poRf.raw : null);

  const lines = [];
  for (const ln of ext.lines) {
    const lid = did + '-L' + ln.line_no, cells = {};
    for (const [k, rf] of Object.entries(ln.cells)) { const nf = normalizeOne(std, k, rf); nf.element_id = lid + '-' + k; cells[k] = nf; }
    let u = cells.uom || null;
    if ((u === null || !u.ok) && (std.policy.evidence || {}).uom_from_number_cells) {
      const d = uomFromNumberCells(std, ln.cells, lid + '-uom');
      if (d !== null) cells.uom = u = d;
    }
    if (u !== null && u && u.ok) cells.uom = { ...u, value: std.uomGroup(u.value) };
    for (const req of std.policy.required_line_cells) {
      if (!cells[req]) cells[req] = { name: req, element_id: lid + '-' + req, raw: null, value: null, confidence: null, ok: false, null_reason: 'NOT_PRESENT', evidence: [] };
    }
    lines.push({
      line_no: ln.line_no, element_id: lid, cells,
      uom_group: cells.uom && cells.uom.ok ? cells.uom.value : null,
      po_refs: linePoRefs(ln.cells), region: ln.region || null
    });
  }
  const sigs = Object.assign({}, ext.signatures || {});
  const stamp = delivererFromStamp(ext, std, sigs);
  if (stamp !== null) { sigs.deliverer = stamp; meta.deliverer_from_stamp = true; }
  const rcvStamp = receiverFromStamp(ext, std, sigs);
  if (rcvStamp !== null) { sigs.receiver = rcvStamp; meta.receiver_from_stamp = true; }
  const doc = { document_id: did, fields, lines, signatures: sigs, pages_complete: !!ext.pages_complete };
  return [doc, meta];
}

function receiverFromStamp(ext, std, sigs) {
  // v5.6: a mark is a mark. The reader's yes/no is the whole answer, so the stamp's own confidence is
  // reported as audit data but never decides anything (policy.signature.min_confidence is not read).
  const cur = sigs.receiver;
  if (cur !== undefined && cur !== null && cur.present === true) return null;
  for (const rg of ext.regions || []) {
    const label = String(rg.label || '').toLowerCase();
    if ((rg.kind === 'stamp' || label.indexOf('stamp') >= 0) && ['received', 'receiving', 'receiver'].some(w => label.indexOf(w) >= 0)) {
      return { present: true, confidence: rg.confidence, kind: rg.label || 'received_stamp', region: { page: rg.page, bbox: rg.bbox, rbox: null } };
    }
  }
  return null;
}
function delivererFromStamp(ext, std, sigs) {
  if (!(((std.policy.evidence || {}).deliverer_from_stamp) === true)) return null;
  const cur = sigs.deliverer;
  if (cur !== undefined && cur !== null && cur.present === true) return null;   // v5.6: confidence is never a gate
  const invPages = {};
  for (const d of ext.documents) if (d.document_id === ext.invoice_document_id) for (const p of d.pages) invPages[p] = 1;
  for (const rg of ext.regions || []) {
    if (rg.kind === 'stamp' && invPages[rg.page] && String(rg.text || '').toLowerCase().indexOf('stamped') >= 0) {
      return { present: true, confidence: rg.confidence, kind: 'company_stamp_region', region: { page: rg.page, bbox: rg.bbox, rbox: null } };
    }
  }
  return null;
}
function uomFromNumberCells(std, rawCells, eid) {   // normalize._uom_from_number_cells
  const known = new Set();
  for (const [g, members] of Object.entries(std.uom_groups)) {
    known.add(String(g).toUpperCase().replace(/\.+$/, ''));
    for (const m of members) known.add(String(m).toUpperCase().replace(/\.+$/, ''));
  }
  for (const src of ['unit_price', 'qty']) {
    const rf = rawCells[src];
    if (!rf || !rf.raw) continue;
    let sp;
    try { sp = splitNumber(rf.raw); } catch (e) { continue; }
    const unit = sp[1];
    if (unit && known.has(String(unit).toUpperCase().replace(/\.+$/, ''))) {
      return { name: 'uom', element_id: eid, raw: unit, value: unit, confidence: rf.confidence != null ? rf.confidence : null, ok: true, null_reason: null, evidence: ['derived:' + src + '_suffix'] };
    }
  }
  return null;
}

// ---------------------------------------------------------------- V-05 helpers (normalize.py Table 9)
const LEGAL_RE = /บริษัท|จำกัด|\(มหาชน\)|มหาชน|public|company|limited|co\.?|ltd\.?|pcl|บมจ\.?|บจ\.?|[.,()\-]/g;
function normName(s) { return String(s === null || s === undefined ? '' : s).toLowerCase().replace(LEGAL_RE, ' ').replace(/\s+/g, ' ').trim(); }
function addrKey(s) {
  s = String(s || '');
  let house = /เลขที่\s*([0-9]+(?:\/[0-9]+)?(?:-[0-9]+(?:\/[0-9]+)?)?)/.exec(s);
  if (!house) house = /\b([0-9]+(?:\/[0-9]+)?(?:-[0-9]+(?:\/[0-9]+)?)?)\b/.exec(s);
  const post = s.match(/\b([0-9]{5})\b/g) || [];
  return [house ? house[1] : null, post.length ? post[post.length - 1] : null];
}
