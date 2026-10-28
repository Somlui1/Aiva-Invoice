// =================================================================================================
// src_rules.js — domain/rules.py : V-01..V-06 (STEP 1 + STEP 2).  STEP 3 (V-07..V-09) lives in
// src_match_rules.js; when it is not reachable the engine itself answers not_evaluated + halted_by.
// =================================================================================================

const Q2R = 2;
class PortPending extends Error { }

function makeCtx(doc, std, opts) {
  const o = opts || {};
  return {
    doc, std, snapshot: o.snapshot === undefined ? null : o.snapshot, groups: [], match_trace: {},
    entity_ai: o.entityAi || null, qty_ai: o.qtyAi || null, ai_trace: {}
  };
}
function F(c, code, rule, msg, opts) {
  const o = opts || {};
  return {
    code, severity: o.sev || c.std.severity(code), rule_id: rule, message_th: msg,
    actual: o.actual === undefined ? null : o.actual, expected: o.expected === undefined ? null : o.expected,
    element_ids: o.element_ids || [], oracle_refs: o.oracle_refs || [], source: o.source === undefined ? null : o.source,
    // v5.7: why this finding has no box when it names no element at all (rules.py Finding.missing_reason)
    missing_reason: o.missing_reason === undefined ? null : o.missing_reason
  };
}

// v5.7 (rules.py::_rv): evidence for a manual_review rule — no code, no severity, never an exception
// and never read by recommend(); it only gives the Portal a button to open.
function RV(msg, elementIds, opts) {
  const o = opts || {};
  return {
    message_th: msg, element_ids: (elementIds || []).filter(x => !!x),
    oracle_refs: o.oracle_refs || [],
    actual: o.actual === undefined ? null : o.actual, expected: o.expected === undefined ? null : o.expected,
    missing_reason: o.missing_reason === undefined ? null : o.missing_reason, is_review: true
  };
}

// v5.7 (rules.py::_line_values): 'qty x price = amount' as read on the invoice line
function lineValues(l) {
  const f = k => lineV(l, k) === null ? '-' : String(lineV(l, k));
  return f('qty') + ' x ' + f('unit_price') + ' = ' + f('amount');
}

// v5.7 (rules.py::v04_receipt fid): element ids of named fields that exist
function fieldsEid(c) {
  return Array.prototype.slice.call(arguments, 1).filter(k => k in c.doc.fields).map(k => c.doc.fields[k].element_id);
}
function OK(rid, detail, data) { return { rule_id: rid, result: 'pass', findings: [], detail: detail === undefined ? null : detail, halted_by: null, data: data || {} }; }
function FAIL(rid, findings, detail, data) {
  const order = ['Low', 'Medium', 'High'];
  let worst = 'Low';
  for (const f of findings) if (order.indexOf(f.severity) > order.indexOf(worst)) worst = f.severity;
  return { rule_id: rid, result: worst !== 'High' && worst !== 'Medium' ? 'pass' : 'fail', findings, detail: detail === undefined ? null : detail, halted_by: null, data: data || {} };
}
function SKIP(rid, by, detail) { return { rule_id: rid, result: 'not_evaluated', findings: [], detail, halted_by: by, data: {} }; }
function flag(c, name) { return !!(((c.std.policy || {}).validation || {})[name] === true); }
function evidenceFlag(c, name) { return !!(((c.std.policy || {}).evidence || {})[name] === true); }
function uomCfg(c, name) { return !!(((((c.std.policy || {}).validation || {}).uom_mismatch) || {})[name] === true); }
function taxLookup(s) { return 'supplier_tax_id_source' in (s.query_keys || {}); }
function lineTag(l) { return 'บรรทัดที่ ' + l.line_no + ' (Invoice: ' + (lineV(l, 'description') || '-') + ')'; }
function snapActive(s) { return s === null || s === undefined ? [] : OracleSession.active(s); }
function snapReceiptNums(s) { return s === null || s === undefined ? [] : OracleSession.receiptNums(s); }

function checkRowGeometryAndOverlap(lines) {
  const errs = [];
  const pageLines = {};
  for (const l of lines) {
    const r = l.region;
    if (!r || !r.bbox || r.bbox.length < 4) { errs.push('L' + l.line_no + '.bbox(UNGROUNDED_GEOMETRY)'); continue; }
    const w = Number(r.bbox[2]), h = Number(r.bbox[3]);
    if (h <= 0 || (w / h) < 1.2) { errs.push('L' + l.line_no + '.bbox(UNGROUNDED_GEOMETRY)'); continue; }
    const p = r.page || 1;
    (pageLines[p] = pageLines[p] || []).push(l);
  }
  for (const p of Object.keys(pageLines)) {
    const rows = pageLines[p].slice().sort((a, b) => a.line_no - b.line_no);
    for (let i = 0; i + 1 < rows.length; i++) {
      const cur = rows[i], nxt = rows[i + 1];
      const y1c = Number(cur.region.bbox[1]), hc = Number(cur.region.bbox[3]), y2c = y1c + hc, ycc = y1c + hc / 2;
      const y1n = Number(nxt.region.bbox[1]), hn = Number(nxt.region.bbox[3]), y2n = y1n + hn, ycn = y1n + hn / 2;
      if (ycn < ycc - 0.01) errs.push('L' + nxt.line_no + '.order(INVERTED_ROW_SEQUENCE)');
      const overlapY = Math.max(0, Math.min(y2c, y2n) - Math.max(y1c, y1n));
      const minH = Math.min(hc, hn);
      if (minH > 0) {
        const ratio = overlapY / minH;
        if (ratio > 0.5) errs.push('L' + nxt.line_no + '.overlap(COLLISION_RATIO_' + ratio.toFixed(2) + ')');
      }
    }
  }
  return errs;
}

function v01Required(c) {
  // v5.7: one Finding per field / per line / per page / per geometry problem (was one Finding for all).
  // The branch and the severity are still decided on the whole list, so recommendation /
  // max_severity / exception_codes do not change.
  const d = c.doc, items = [];
  let miss = [];                              // engine appends the geometry errors here (rules.py:164), so not const
  for (const k of c.std.policy.required_fields) {
    const f = d.fields[k];
    if (!f.ok) {
      const t = k + '(' + f.null_reason + ')';
      miss.push(t);
      items.push(['field', t, [f.element_id], null, t]);
    }
  }
  if (!d.lines.length) {
    miss.push('lines(NOT_PRESENT)');
    items.push(['lines', 'lines(NOT_PRESENT)', [], 'NOT_PRESENT', 'lines(NOT_PRESENT)']);
  }
  for (const l of d.lines) {
    const bad = [];
    for (const k of c.std.policy.required_line_cells) {
      const cf = l.cells[k];
      if (!cf.ok) {
        const t = 'L' + l.line_no + '.' + k + '(' + cf.null_reason + ')';
        miss.push(t);
        bad.push([t, cf.element_id]);
      }
    }
    if (bad.length) {
      items.push(['line', bad.map(x => x[0]).join(', '), [l.element_id].concat(bad.map(x => x[1])), null,
        'L' + l.line_no + ': ' + bad.map(x => x[0].slice(x[0].indexOf('.') + 1)).join(', ')]);
    }
  }
  if (!d.pages_complete) {
    miss.push('pages_complete(false)');
    items.push(['pages', 'pages_complete(false)', [], 'PAGES_INCOMPLETE', 'pages_complete(false)']);
  }
  const geoErrs = checkRowGeometryAndOverlap(d.lines);
  const geoItems = [];
  if (geoErrs.length) {
    miss = miss.concat(geoErrs);
    const byNo = {}; for (const l of d.lines) byNo[l.line_no] = l;
    const perLine = new Map();                       // rules.py groups the errors by line number
    for (const g of geoErrs) {
      const no = g.slice(1).split('.')[0];
      const key = /^[0-9]+$/.test(no) ? parseInt(no, 10) : null;
      if (!perLine.has(key)) perLine.set(key, []);
      perLine.get(key).push(g);
    }
    for (const [no, errs] of perLine) {
      const l = byNo[no];
      geoItems.push(['geo', errs.join(', '), (l && l.element_id) ? [l.element_id] : [],
        l ? null : 'NOT_LOCATED', errs.join(', ')]);
    }
  }
  if (!miss.length) return OK('V-01');
  const build = (prefix, sev, rows) => rows.map(([kind, text, eids, why, actual]) =>
    F(c, 'E01', 'V-01', prefix + text,
      { sev, element_ids: eids, missing_reason: why, actual,
        expected: kind !== 'geo' ? 'required' : 'grounded row bbox' }));
  const oracleConfirmed = !!(c.snapshot !== null && c.snapshot !== undefined &&
    (snapActive(c.snapshot).length || ((c.snapshot.receipt_lines || []).length)));
  const allPo = miss.every(m => m.indexOf('po_number') === 0);
  if (allPo && oracleConfirmed && !geoErrs.length) {
    return FAIL('V-01', build('ฟิลด์ PO บนเอกสารมีข้อสังเกต แต่ยืนยันได้จากใบรับในระบบ Oracle: ', 'Low', items));
  }
  if (geoErrs.length && miss.every(m => geoErrs.indexOf(m) >= 0)) {
    return FAIL('V-01', build('พิกัดบรรทัดสินค้าบนเอกสารไม่สมบูรณ์หรือไม่สอดคล้องกับโครงสร้างตาราง: ', 'Medium', geoItems));
  }
  return FAIL('V-01',
    build('ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: ', null, items)
      .concat(build('พิกัดบรรทัดสินค้าบนเอกสารไม่สมบูรณ์หรือไม่สอดคล้องกับโครงสร้างตาราง: ', null, geoItems)));
}

function v02LineMath(c) {
  const out = []; let checked = 0;
  for (const l of c.doc.lines) {
    if (!['qty', 'unit_price', 'amount'].every(k => lineOk(l, k))) continue;
    checked++;
    const calc = dQuant(D(lineV(l, 'qty')).v !== null ? dMul(D(lineV(l, 'qty')), D(lineV(l, 'unit_price'))) : null, Q2R);
    if (dCmp(dAbs(dSub(calc, D(lineV(l, 'amount')))), c.std.tol('line_math')) > 0) {
      out.push(F(c, 'E02', 'V-02', lineTag(l) + ': ' + lineV(l, 'qty') + ' × ' + lineV(l, 'unit_price') + ' = ' + dStr(calc) + ' แต่ระบุ ' + lineV(l, 'amount'),
        { actual: lineV(l, 'amount'), expected: dStr(calc), element_ids: [l.element_id, l.cells.qty.element_id, l.cells.unit_price.element_id, l.cells.amount.element_id] }));
    }
  }
  if (out.length) return FAIL('V-02', out);
  if (!checked) return SKIP('V-02', 'V-01', 'ไม่มีบรรทัดที่อ่านค่าครบ');
  return OK('V-02', 'ตรวจ ' + checked + ' บรรทัด');
}

function v03DocTotals(c) {
  const d = c.doc;
  if (!['sub_total', 'vat', 'grand_total'].every(k => docOk(d, k)) || !d.lines.length || !d.lines.every(l => lineOk(l, 'amount'))) {
    return SKIP('V-03', 'V-01', 'ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้');
  }
  const sub = D(docV(d, 'sub_total')), vat = D(docV(d, 'vat')), grand = D(docV(d, 'grand_total'));
  let linesSum = D(0);
  for (const l of d.lines) linesSum = dAdd(linesSum, D(lineV(l, 'amount')));
  const diffs = {
    lines_vs_sub_total: dStr(dAbs(dSub(linesSum, sub))),
    vat_7pct: dStr(dAbs(dSub(dQuant(dMul(sub, c.std.tol('vat_rate')), Q2R), vat))),
    sub_plus_vat_vs_grand: dStr(dAbs(dSub(dAdd(sub, vat), grand)))
  };
  const fe = function () { return Array.prototype.slice.call(arguments).map(k => d.fields[k].element_id); };
  // v5.7: one Finding per FAILED check (was one Finding pointing at all three totals)
  const vatExpect = dQuant(dMul(sub, c.std.tol('vat_rate')), Q2R);
  const checks = [
    ['lines_vs_sub_total', 'total', 'ผลรวมราคาต่อรายการ ≠ ยอดก่อนภาษี', fe('sub_total'), dStr(sub), dStr(linesSum)],
    ['vat_7pct', 'vat', 'VAT ≠ ยอดก่อนภาษี × อัตราภาษี', fe('vat'), dStr(vat), dStr(vatExpect)],
    ['sub_plus_vat_vs_grand', 'total', 'ยอดก่อนภาษี + VAT ≠ ยอดรวมทั้งสิ้น', fe('grand_total', 'sub_total', 'vat'), dStr(grand), dStr(dAdd(sub, vat))]
  ];
  const over = checks.filter(ch => dCmp(D(diffs[ch[0]]), c.std.tol(ch[1])) > 0);
  if (over.length) {
    return FAIL('V-03', over.map(ch => F(c, 'E03', 'V-03',
      'ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง: ' + ch[2] + ' (ต่าง ' + diffs[ch[0]] + ')',
      { source: 'invoice', actual: ch[4], expected: ch[5], element_ids: ch[3] })), null, { diffs });
  }
  const rounding = checks.filter(ch => dCmp(D(diffs[ch[0]]), D(0)) > 0);
  if (rounding.length) {
    return FAIL('V-03', rounding.map(ch => F(c, 'E04', 'V-03',
      'ผลต่างเศษปัดอยู่ในกรอบ: ' + ch[2] + ' (ต่าง ' + diffs[ch[0]] + ')',
      { actual: ch[4], expected: ch[5], element_ids: ch[3] })), null, { diffs });
  }
  return OK('V-03', null, { diffs });
}

function v06Signatures(c) {
  // V-06 v2.0 (engine 5.6, rules.py): a slot passes when ANY mark (signature or stamp) was detected,
  // however faint.  No confidence gate, no Oracle waive, no manual_review branch.
  if (!c.doc.pages_complete) return SKIP('V-06', 'V-01', 'สแกนไม่ครบหน้า (E01 ไม่ใช่ E08)');
  const out = [], boxes = {};
  for (const [slot, sev, label] of [['receiver', 'High', 'ผู้รับของ'], ['deliverer', 'Medium', 'ผู้ขาย/ผู้ส่งของ']]) {
    const s = (c.doc.signatures || {})[slot];
    if (s !== undefined && s !== null && s.present === true) continue;
    const hasBox = s !== undefined && s !== null && s.region !== undefined && s.region !== null;
    // v5.7: always name the slot element (buildElements emits one for every slot); without a box the
    // evidence carries bbox_missing_reason instead of pointing at nothing.
    const eid = [c.doc.document_id + '-sig-' + slot];
    if (hasBox) boxes[slot] = { page: s.region.page, bbox: s.region.bbox ? Array.prototype.slice.call(s.region.bbox) : null };
    const detail = 'ไม่พบลายเซ็นหรือตราในช่อง' + label + (hasBox ? '' : ' (ไม่พบกล่องลายเซ็นบนเอกสาร)');
    out.push(F(c, 'E08', 'V-06', detail, {
      sev, element_ids: eid, actual: hasBox ? 'empty' : 'no box', expected: 'signed'
    }));
  }
  if (out.length) {
    const signed = {};
    for (const [slot, v] of Object.entries(c.doc.signatures || {})) if (v.present === true) signed[slot] = true;
    return FAIL('V-06', out, null, {
      missing_slots: ['receiver', 'deliverer'].filter(k => !signed[k]), signature_boxes: boxes
    });
  }
  return OK('V-06');
}

function v04Receipt(c) {
  const s = c.snapshot;
  const keys = ['po_number', 'invoice_num'].map(k => c.doc.fields[k].element_id);
  const data = { lookup_path: s.lookup_path, rows: s.rows.length, active_rows: snapActive(s).length, receipt_nums: snapReceiptNums(s) };
  if (taxLookup(s)) { data.po_numbers = (s.po_numbers || []).slice(); data.matched_on_column = s.matched_on_column; }
  const q0 = s.query_keys || {};
  for (const k of ['invoice_key_matched', 'receipts_set_aside', 'receipt_num_lookup', 'receipt_num_candidates', 'supplier_tax_id_rejected', 'invoice_num_rejected', 'invoice_suffix_match']) {
    if (q0[k]) data[k] = q0[k];
  }
  const notFound = String((((c.std.policy.oracle || {}).lookup || {}).not_found_result));
  if (!snapActive(s).length && taxLookup(s) && notFound === 'manual_review') {
    const tried = [q0.invoice_num].concat((q0.invoice_candidates || []).map(x => x.key));
    const triedR = (q0.receipt_num_lookup || []).map(x => x.receipt_num);
    return {
      rule_id: 'V-04', result: 'manual_review', findings: [], halted_by: null,
      detail: 'ไม่พบใบรับของผู้ขาย ' + (q0.supplier_tax_id || '-') + ' ด้วยเลข Invoice ' + tried.filter(t => t).map(String).join(', ')
        + (triedR.length ? ' หรือเลขใบรับ ' + triedR.join(', ') : '')
        + ' — ตรวจเลข Invoice / Tax ID ที่อ่านได้ หรือยังไม่รับของ'
        + (q0.supplier_tax_id ? '' : ' (ไม่ทราบ Tax ID ผู้ขาย)'),
      data: Object.assign({}, data, { not_found: true }),
      reviews: [RV('ไม่พบใบรับด้วยเลข Invoice / Tax ID ผู้ขายที่อ่านได้ — ตรวจค่าที่อ่านบนเอกสาร', fieldsEid(c, 'invoice_num', 'supplier_tax_id'),
        { actual: String(q0.invoice_num || '-'), expected: 'ใบรับใน Oracle' })]
    };
  }
  if (snapActive(s).length && s.lookup_path === 'RCV-BY-NUM') {
    const acc = (q0.receipt_num_lookup || []).filter(x => x.accepted)[0] || {};
    const heads = sortedStr([...new Set(snapActive(s).flatMap(r => [r.shipment_num, r.packing_slip]).filter(v => v))]);
    return {
      rule_id: 'V-04', result: 'manual_review', findings: [], halted_by: null,
      detail: 'พบใบรับ ' + (acc.receipt_num === undefined ? '' : acc.receipt_num) + ' จากเลขใบรับที่เขียนบนเอกสาร (ผู้ขายและยอดเงินตรง) แต่เลข Invoice ในใบรับ (' + (heads.join(', ') || '-') + ') ไม่ตรงกับเลขที่พิมพ์บนเอกสาร — ตรวจเลข Invoice',
      data: Object.assign({}, data, { continue_checks: true }),
      reviews: [RV('เลข Invoice บนเอกสารไม่ตรงกับเลขในใบรับที่พบจากเลขใบรับ', fieldsEid(c, 'invoice_num'),
        { oracle_refs: snapReceiptNums(s).map(n => 'RCV:' + n), actual: String(docV(c.doc, 'invoice_num') || '-'),
          expected: heads.join(', ') || null })]
    };
  }
  if (snapActive(s).length && q0.invoice_candidates_ambiguous) {
    const amb = 'เลขบนเอกสารหลายเลขพบใบรับคนละใบ: ' + q0.invoice_candidates_ambiguous.join(', ');
    return { rule_id: 'V-04', result: 'manual_review', findings: [], halted_by: null, detail: amb, data,
      reviews: [RV(amb, fieldsEid(c, 'invoice_num'), { oracle_refs: snapReceiptNums(s).map(n => 'RCV:' + n) })] };
  }
  if (!snapActive(s).length) {
    if (taxLookup(s)) {
      const q = s.query_keys;
      const why = q.invoice_rejected ? ' (เลข Invoice มีอักขระที่ไม่อนุญาต จึงไม่ค้นหา)' : (q.supplier_tax_id ? '' : ' (ไม่ทราบ Tax ID ผู้ขาย)');
      const msg = 'ไม่พบใบรับที่ QTY > 0 สำหรับ Tax ID ผู้ขาย ' + (q.supplier_tax_id || '-') + ' + Invoice ' + q.invoice_num + why;
      const ids = ['supplier_tax_id', 'invoice_num'].filter(k => k in c.doc.fields).map(k => c.doc.fields[k].element_id);
      return FAIL('V-04', [F(c, 'E05', 'V-04', msg, { element_ids: ids.length ? ids : keys })], null, data);
    }
    return FAIL('V-04', [F(c, 'E05', 'V-04', 'ไม่พบใบรับที่ QTY > 0 สำหรับ PO ' + s.query_keys.po_number + ' + Invoice ' + s.query_keys.invoice_num, { element_ids: keys })], null, data);
  }
  const rnums = snapReceiptNums(s);
  if (rnums.length > 1 && (s.query_keys || {}).po_list_ambiguous) {
    const nar = (s.query_keys || {}).po_list_narrowing || {};
    const d2 = Object.assign({}, data, { po_list_narrowing: nar });
    return { rule_id: 'V-04', result: 'manual_review', findings: [], halted_by: null, detail: 'ค้นด้วย PO ได้ใบรับ ' + rnums.length + ' ใบ ระบุใบรับของ Invoice นี้ไม่ได้ (เลขที่ใบรับ/ยอดเงิน/จำนวนค้างวางบิล ไม่ชี้ใบเดียว)', data: d2,
      reviews: [RV('ค้นด้วย PO ได้ใบรับ ' + rnums.length + ' ใบ — เลือกใบรับของ Invoice นี้', fieldsEid(c, 'po_number', 'invoice_num'),
        { oracle_refs: rnums.map(n => 'RCV:' + n) })] };
  }
  if ((s.query_keys || {}).po_list_narrowing) data.po_list_narrowing = s.query_keys.po_list_narrowing;
  if (rnums.length > 1 && flag(c, 'multi_po_receipts')) {
    const sups = sortedStr([...new Set(snapActive(s).map(r => r.supplier_tax_id).filter(x => x))]);
    const ous = sortedNum([...new Set(snapActive(s).map(r => (r.ou_org_id !== null && r.ou_org_id !== undefined ? r.ou_org_id : r.org_id)).filter(x => x !== null && x !== undefined))]);
    data.multi_receipt = true; data.supplier_tax_ids = sups; data.ou_org_ids = ous;
    if (sups.length > 1 || ous.length > 1) {
      const what = sups.length > 1 ? 'ผู้ขาย' : 'หน่วยธุรกิจ (OU)';
      const vals = sups.length > 1 ? sups : ous.map(String);
      return FAIL('V-04', [F(c, 'E06', 'V-04', 'พบใบรับหลายใบที่มาจาก' + what + 'ต่างกัน: ' + vals.join(', '), { element_ids: keys, oracle_refs: rnums.map(n => 'RCV:' + n) })], null, data);
    }
  } else if (rnums.length > 1) {
    return FAIL('V-04', [F(c, 'E06', 'V-04', 'พบใบรับมากกว่า 1 ใบ: ' + rnums.join(', '), { element_ids: keys, oracle_refs: rnums.map(n => 'RCV:' + n) })], null, data);
  }
  if (s.row_cap_hit) {
    const ora = c.std.policy.oracle;
    const cap = ((ora.row_caps || {})[s.lookup_path || ''] !== undefined ? ora.row_caps[s.lookup_path || ''] : ora.row_cap);
    return { rule_id: 'V-04', result: 'manual_review', findings: [], halted_by: null, detail: 'SQL คืน ' + cap + ' แถวพอดี (ถึงเพดาน อาจได้ไม่ครบ)', data,
      reviews: [RV('ผลค้นใบรับถึงเพดาน ' + cap + ' แถว อาจได้ไม่ครบ — ตรวจใบรับใน Oracle', [], { missing_reason: 'NOT_LOCATED' })] };
  }
  if (rnums.length > 1) return OK('V-04', 'ใบรับ ' + rnums.length + ' ใบ (' + s.lookup_path + '): ' + rnums.join(', '), data);
  return OK('V-04', 'ใบรับ ' + rnums[0] + ' (' + s.lookup_path + ')', data);
}

async function v05Customer(c) {
  const active = snapActive(c.snapshot);
  const orgs = sortedNum([...new Set(active.map(r => r.org_id).filter(x => x !== null && x !== undefined))]);
  if (orgs.length > 1 && flag(c, 'multi_po_receipts')) {
    return { rule_id: 'V-05', result: 'not_evaluated', findings: [], detail: 'ใบรับมาจากหลาย ORG_ID: [' + orgs.join(', ') + '] (ดู V-04)', halted_by: 'V-04', data: { org_ids: orgs } };
  }
  const org = active.length ? active[0].org_id : null;
  const ent = org === null || org === undefined ? null : (c.std.entities || {})[String(org)];
  const base = { org_id: org, short_name: ent ? (ent.short || null) : null };
  const sup = docV(c.doc, 'supplier_tax_id');
  base.intercompany = !!sup && Object.values(c.std.entities || {}).some(e => e.tax_id === sup);
  if (ent === null || ent === undefined || ent.status === 'unknown' || ent.status === 'cancelled' || !ent.tax_id) {
    return { rule_id: 'V-05', result: 'manual_review', findings: [], halted_by: null, detail: 'ORG_ID ' + org + ' สถานะ ' + (ent ? ent.status : 'ไม่อยู่ในตารางที่ 4') + ' หรือไม่มี Tax ID', data: base,
      reviews: [RV('ORG_ID ' + org + ' ไม่มีข้อมูลนิติบุคคลให้เทียบ — ตรวจผู้ซื้อบนเอกสาร', [c.doc.fields.customer_tax_id.element_id],
        { actual: String(docV(c.doc, 'customer_tax_id') || '-') })] };
  }
  const d = c.doc;
  if (!docOk(d, 'customer_tax_id')) return SKIP('V-05', 'V-01', 'Tax ID ลูกค้าอ่านไม่ได้');
  const fid = (k) => [d.fields[k].element_id];
  if (docV(d, 'customer_tax_id') !== ent.tax_id) {
    return FAIL('V-05', [F(c, 'E07', 'V-05', 'Tax ID ลูกค้า ' + docV(d, 'customer_tax_id') + ' ≠ ' + ent.tax_id + ' (ORG_ID ' + org + ')', { sev: 'High', actual: docV(d, 'customer_tax_id'), expected: ent.tax_id, element_ids: fid('customer_tax_id') })], null, Object.assign({}, base, { tax_id_match: false }));
  }
  const findings = [];
  const data = Object.assign({}, base, { tax_id_match: true });
  const th = Number(c.std.policy.ai.v05_name_min_confidence);
  const pyStr = (x) => (x === null || x === undefined ? 'None' : String(x));   // engine str(None) == 'None'
  const aiTrace = (rec) => { (c.ai_trace.v05 = c.ai_trace.v05 || []).push(rec); };
  let nameIssue = null;
  if (docOk(d, 'customer_name') && isCovered(d.fields.customer_name)) data.name_match = null, data.name_check = 'covered_by_customer_tax_id';
  else if (docOk(d, 'customer_name')) {
    const cands = { name_th: ent.name_th || null, name_en: ent.name_en || null };
    (ent.former || []).forEach((n, i) => { cands['former_' + i] = n; });
    let hit = null;
    for (const [k, n] of Object.entries(cands)) if (n && normName(n) === normName(docV(d, 'customer_name'))) { hit = k; break; }
    if (hit) { data.name_match = true; data.matched_on = hit; }
    else if (c.entity_ai) {
      // rules.py:421-437 - logic failed, ask the model.  Low confidence is a human question (manual_review),
      // a confident "no" is the E07 finding; only a confident "yes" passes, and it records which candidate.
      const candsTrue = {}; for (const [k, v] of Object.entries(cands)) if (v) candsTrue[k] = v;
      const r = await c.entity_ai.nameEquivalent(docV(d, 'customer_name'), candsTrue) || {};
      aiTrace(Object.assign({ task: 'name' }, r));
      const conf = Number(r.confidence === undefined ? 0 : r.confidence);
      if (r.equivalent && conf >= th) { data.name_match = true; data.matched_on = 'ai_semantic:' + pyStr(r.matched_candidate); }
      else if (conf < th) { data.name_match = null; nameIssue = ['manual', 'AI ไม่มั่นใจเรื่องชื่อลูกค้า']; }
      else {
        data.name_match = false;
        nameIssue = F(c, 'E07', 'V-05', 'ชื่อลูกค้าไม่ตรงกับ ORG_ID ' + org, { sev: 'Medium', actual: docV(d, 'customer_name'), expected: ent.name_th || null, element_ids: fid('customer_name') });
      }
    }
    else { data.name_match = false; nameIssue = F(c, 'E07', 'V-05', 'ชื่อลูกค้าไม่ตรงกับ ORG_ID ' + org, { sev: 'Medium', actual: docV(d, 'customer_name'), expected: ent.name_th || null, element_ids: fid('customer_name') }); }
  }
  if (nameIssue !== null && !evidenceFlag(c, 'customer_name_advisory')) {
    if (Array.isArray(nameIssue)) return { rule_id: 'V-05', result: 'manual_review', findings, halted_by: null, detail: nameIssue[1], data,
      reviews: [RV(nameIssue[1], [d.fields.customer_name.element_id], { actual: docV(d, 'customer_name'), expected: ent.name_th || null })] };
    findings.push(nameIssue); nameIssue = null;
  }
  if (docOk(d, 'customer_address') && isCovered(d.fields.customer_address)) { data.address_match = null; data.address_check = 'covered_by_customer_tax_id'; }
  else if (docOk(d, 'customer_address')) {
    const addrs = { head_office_th: ent.addr_th || null, head_office_en: ent.addr_en || null };
    for (const [k, v] of Object.entries(ent.branches || {})) addrs['branch ' + k] = v;
    const keys = {}; for (const [k, v] of Object.entries(addrs)) if (v) keys[k] = addrKey(v);
    const invKey = addrKey(docV(d, 'customer_address'));
    const addrMiss = () => 'ที่อยู่ลูกค้า (เลขที่ ' + invKey[0] + ', รหัสไปรษณีย์ ' + invKey[1] + ') ไม่ตรงกับที่อยู่ของ ORG_ID ' + org;
    let hit = null;
    for (const [k, v] of Object.entries(keys)) if (invKey[0] !== null && invKey[1] !== null && v[0] === invKey[0] && v[1] === invKey[1]) { hit = k; break; }
    if (!hit && c.entity_ai && c.std.policy.ai.v05_address_ai_enabled) {
      // rules.py:455-482 - the address is often printed in a shape the house/postal script cannot read,
      // so the model parses it and the same script compares the parsed keys.  Still low-confidence -> human.
      const r = await c.entity_ai.parseAddress(docV(d, 'customer_address')) || {};
      aiTrace(Object.assign({ task: 'address' }, r));
      const conf = Number(r.confidence === undefined ? 0 : r.confidence);
      if (conf < th) {
        data.address_match = null; data.address_method = 'ai_unconfident';
        if (data.tax_id_match === true && evidenceFlag(c, 'customer_name_advisory')) {
          data.address_check = 'advisory'; data.address_issue = 'AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า';
        } else if (data.tax_id_match === true) {
          findings.push(F(c, 'E07', 'V-05', 'AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า', { sev: 'Medium', actual: docV(d, 'customer_address'), element_ids: fid('customer_address') }));
        } else {
          return { rule_id: 'V-05', result: 'manual_review', findings, halted_by: null, detail: 'AI ไม่มั่นใจเรื่องที่อยู่', data,
            reviews: [RV('AI ไม่มั่นใจเรื่องที่อยู่ลูกค้า', [d.fields.customer_address.element_id], { actual: docV(d, 'customer_address') })] };
        }
      } else {
        const aiKey = [thaiToArabic(String((r.house_no === undefined || r.house_no === null) ? '' : r.house_no)) || null,
          thaiToArabic(String((r.postal_code === undefined || r.postal_code === null) ? '' : r.postal_code)) || null];
        let aHit = null;
        for (const [k, v] of Object.entries(keys)) if (aiKey[0] !== null && aiKey[1] !== null && v[0] === aiKey[0] && v[1] === aiKey[1]) { aHit = k; break; }
        data.address_match = !!aHit; data.address_matched = aHit; data.address_method = aHit ? 'ai_normalized' : null;
        if (!aHit) {
          if (evidenceFlag(c, 'customer_name_advisory') && data.tax_id_match === true) { data.address_check = 'advisory'; data.address_issue = addrMiss(); }
          else findings.push(F(c, 'E07', 'V-05', addrMiss(), { sev: 'Medium', actual: docV(d, 'customer_address'), element_ids: fid('customer_address') }));
        }
      }
    } else if (!hit) {
      data.address_match = false; data.address_matched = null; data.address_method = null;
      if (evidenceFlag(c, 'customer_name_advisory') && data.tax_id_match === true) {
        data.address_check = 'advisory';
        data.address_issue = 'ที่อยู่ลูกค้า (เลขที่ ' + invKey[0] + ', รหัสไปรษณีย์ ' + invKey[1] + ') ไม่ตรงกับที่อยู่ของ ORG_ID ' + org;
      } else {
        findings.push(F(c, 'E07', 'V-05', 'ที่อยู่ลูกค้า (เลขที่ ' + invKey[0] + ', รหัสไปรษณีย์ ' + invKey[1] + ') ไม่ตรงกับที่อยู่ของ ORG_ID ' + org, { sev: 'Medium', actual: docV(d, 'customer_address'), element_ids: fid('customer_address') }));
      }
    } else { data.address_match = true; data.address_matched = hit; data.address_method = 'logic'; }
  }
  if (nameIssue !== null) {
    const addressOk = data.address_match === true || data.address_check === 'covered_by_customer_tax_id' || data.address_check === 'advisory';
    if (addressOk || (evidenceFlag(c, 'customer_name_advisory') && data.tax_id_match === true)) { data.name_check = 'advisory'; data.name_issue = Array.isArray(nameIssue) ? nameIssue[1] : nameIssue.message_th; }
    else if (Array.isArray(nameIssue)) {
      return { rule_id: 'V-05', result: 'manual_review', findings, halted_by: null, detail: nameIssue[1], data,
        reviews: [RV(nameIssue[1], [d.fields.customer_name.element_id], { actual: docV(d, 'customer_name'), expected: ent.name_th || null })] };
    }
    else findings.unshift(nameIssue);
  }
  if (!docOk(d, 'customer_name') || !docOk(d, 'customer_address')) {
    if (findings.length) return FAIL('V-05', findings, null, data);
    if (data.tax_id_match === true && evidenceFlag(c, 'customer_name_advisory')) return OK('V-05', null, data);
    return SKIP('V-05', 'V-01', 'ชื่อหรือที่อยู่ลูกค้าอ่านไม่ได้');
  }
  return findings.length ? FAIL('V-05', findings, null, data) : OK('V-05', null, data);
}

const STEP1 = [v01Required, v02LineMath, v03DocTotals, v06Signatures];
const STEP2 = [v04Receipt, v05Customer];
const ALL_RULE_IDS = ['V-01', 'V-02', 'V-03', 'V-04', 'V-05', 'V-06', 'V-07', 'V-08', 'V-09'];
