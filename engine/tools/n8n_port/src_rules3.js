// =================================================================================================
// src_rules3.js — domain/rules.py STEP 3: V-07 line match, V-08 quantity, V-09 total vs receipt
// =================================================================================================

function v07LineMatch(c) {
  const rows = {}; for (const r of snapActive(c.snapshot)) rows[r.rcv_line_id] = r;
  const lines = {}; for (const l of c.doc.lines) lines[l.line_no] = l;
  const out = [], minConf = c.std.policy.ai.v07_min_confidence, waived = [], installments = [];
  const D0v = D(0);
  for (const g of c.groups) {
    const refs = g.rcv_line_ids.map(i => 'RCV:' + i);
    if (g.relation === 'UNMATCHED' || g.confidence < minConf) {
      for (const n of g.invoice_line_nos) {
        const l = lines[n];
        out.push(F(c, 'E13', 'V-07', lineTag(l) + ': ระบุบรรทัดในใบรับไม่ได้',
          { element_ids: [l.element_id], oracle_refs: refs, actual: lineValues(l), expected: 'บรรทัดใบรับที่ตรงกัน' }));
      }
      continue;
    }
    const rcv = g.rcv_line_ids.map(i => rows[i]);
    const rcvGroups = [...new Set(rcv.map(r => c.std.uomGroup(r.uom)))];
    let totQ = D0v; for (const r of rcv) totQ = dAdd(totQ, D(r.qty));
    const uniqPrice = new Map();
    for (const r of rcv) { let dup = false; for (const k of uniqPrice.keys()) if (dCmp(D(k), D(r.unit_price)) === 0) dup = true; if (!dup) uniqPrice.set(r.unit_price, 1); }
    const rcvPrice = uniqPrice.size === 1 ? D(rcv[0].unit_price)
      : (dCmp(totQ, D0v) !== 0 ? dDiv(rcv.map(r => D(r.line_amount)).reduce((x, y) => dAdd(x, y), D0v), totQ, 4) : D0v);
    for (const n of g.invoice_line_nos) {
      const l = lines[n];
      const eids = [l.element_id, l.cells.unit_price.element_id];
      const knownRcv = rcvGroups.filter(x => x);
      let mismatch;
      if (uomCfg(c, 'unknown_unit_uses_price') && ((l.uom_group === null || l.uom_group === undefined) || knownRcv.length === 0)) mismatch = false;
      else mismatch = !(rcvGroups.some(x => x === l.uom_group) || (l.uom_group === null && rcvGroups.includes(null))) || rcvGroups.length > 1;
      if (mismatch) {
        const invRaw = l.cells.uom.raw;
        const rcvTxt = [...new Set(rcv.map(r => r.uom + '→' + c.std.uomGroup(r.uom)))].sort().join(', ');
        const ra = rcv.map(r => D(r.line_amount)).reduce((x, y) => dAdd(x, y), D0v);
        const a = D(lineV(l, 'amount'));
        const amountEqual = a !== null && dCmp(dAbs(dSub(a, ra)), c.std.tol('line_math')) <= 0;
        let tail = '';
        if (uomCfg(c, 'amount_check')) {
          tail = amountEqual ? ' · ยอดบรรทัดเท่ากัน ' + fmtThousand(a) + ' = ' + fmtThousand(ra)
            : ' · ยอดบรรทัดไม่ตรง (Inv: ' + (a === null ? '-' : dStr(a)) + ', Rcv: ' + dStr(ra) + ')';
        }
        out.push(F(c, 'E10', 'V-07', lineTag(l) + ': หน่วยนับต่างกลุ่มหลังแปลง (Inv: ' + pyStr(invRaw) + '→' + pyStr(l.uom_group) + ', Rcv: ' + rcvTxt + ')' + tail,
          { sev: amountEqual ? 'Low' : 'Medium', actual: l.uom_group, expected: [...new Set(rcvGroups.map(x => String(x)))].sort().join(','),
            element_ids: [l.element_id, l.cells.uom.element_id, l.cells.amount.element_id], oracle_refs: refs }));
        if (uomCfg(c, 'amount_check') && !amountEqual) {
          out.push(F(c, 'E09', 'V-07', lineTag(l) + ': หน่วยต่างกลุ่มและยอดบรรทัดไม่ตรงใบรับ (Inv: ' + (a === null ? '-' : dStr(a)) + ', Rcv: ' + dStr(ra) + ')',
            { actual: a === null ? null : dStr(a), expected: dStr(ra), element_ids: [l.element_id, l.cells.amount.element_id], oracle_refs: refs }));
        }
        continue;
      }
      const inst = installment(c, l, rcv, g);
      if (inst !== null) { installments.push(inst); continue; }
      const p = D(lineV(l, 'unit_price'));
      if (p === null) {
        if (g.level === 'M4') {
          out.push(F(c, 'E11', 'V-07', (lineTag(l) + ': จับคู่ด้วยคำบรรยาย (' + (g.rationale || '') + ')').slice(0, 200),
            { element_ids: [l.element_id], oracle_refs: refs, actual: lineValues(l), expected: dStr(totQ) + ' x ' + dStr(rcvPrice) }));
        }
        continue;
      }
      const pc = priceCheck(p, rcvPrice, c.std);
      if (pc === 'over_tolerance') out.push(F(c, 'E09', 'V-07', lineTag(l) + ': ราคาต่างเกินกรอบ (Inv: ' + dStr(p) + ', Rcv: ' + dStr(rcvPrice) + ')', { actual: dStr(p), expected: dStr(rcvPrice), element_ids: eids, oracle_refs: refs }));
      else if (pc === 'within_tolerance') out.push(F(c, 'E12', 'V-07', lineTag(l) + ': ราคาต่างในกรอบ (Inv: ' + dStr(p) + ', Rcv: ' + dStr(rcvPrice) + ')', { actual: dStr(p), expected: dStr(rcvPrice), element_ids: eids, oracle_refs: refs }));
      if (g.level === 'M4') {
        if (valuesConfirm(c, l, rcv, g, pc)) {
          waived.push({ invoice_line_no: n, rcv_line_ids: g.rcv_line_ids.slice(), reason: 'price/qty/amount/uom equal receipt', ai_rationale: g.rationale });
          continue;
        }
        out.push(F(c, 'E11', 'V-07', (lineTag(l) + ': จับคู่ด้วยคำบรรยาย (' + (g.rationale || '') + ')').slice(0, 200),
          { element_ids: [l.element_id], oracle_refs: refs, actual: lineValues(l), expected: dStr(totQ) + ' x ' + dStr(rcvPrice) }));
      }
    }
  }
  const data = { groups: c.groups.length, ai_rejected: (c.match_trace.ai_rejected || []).length };
  if (waived.length) data.e11_waived = waived;
  if (installments.length) {
    data.installments = installments;
    c.match_trace.installment_lines = installments.map(i => i.invoice_line_no);
    const mode = installments[0].mode || 'manual_review';
    if (mode === 'exact_amount_pass') {
      c.match_trace.installment_mode = 'exact_amount_pass';
      return out.length ? FAIL('V-07', out, undefined, data) : OK('V-07', 'วางบิลเป็นงวด ' + installments.length + ' บรรทัด (ยอดเงินตรงใบรับ)', data);
    } else if (mode === 'review') {
      c.match_trace.installment_mode = 'review';
      out.push(F(c, 'E12', 'V-07', 'วางบิลเป็นงวด ' + installments.length + ' บรรทัด (ยอดเงินตรงใบรับ)',
        { sev: 'Medium', element_ids: c.doc.lines.filter(l => (c.match_trace.installment_lines || []).indexOf(l.line_no) >= 0).map(l => l.element_id) }));
      return FAIL('V-07', out, undefined, data);
    }
    return { rule_id: 'V-07', result: 'manual_review', findings: out, halted_by: null,
      detail: 'วางบิลเป็นงวด ' + installments.length + ' บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ', data,
      reviews: installments.map(i => installmentReview(lines[i.invoice_line_no], i)) };
  }
  if ((c.match_trace.ai_rejected || []).length) {
    return { rule_id: 'V-07', result: 'manual_review', findings: out, halted_by: null, detail: 'AI เสนอการจับคู่ที่อ้างบรรทัดไม่ถูกต้อง', data,
      reviews: aiRejectedReviews(c.match_trace.ai_rejected, lines) };
  }
  return out.length ? FAIL('V-07', out, undefined, data) : OK('V-07', undefined, data);
}

// v5.7 (rules.py::_installment_review) — one evidence row per installment line for the Portal
function installmentReview(l, inst) {
  if (l === undefined || l === null) {
    return RV('บรรทัดที่ ' + inst.invoice_line_no + ' วางบิลเป็นงวด', [],
      { missing_reason: 'NOT_LOCATED', actual: inst.invoice === undefined ? null : inst.invoice, expected: inst.receipt === undefined ? null : inst.receipt });
  }
  return RV(lineTag(l) + ': วางบิลเป็นงวด (ยอดเงินตรงใบรับ ราคา/จำนวนเป็นสัดส่วนงวด)',
    [l.element_id, l.cells.unit_price.element_id, l.cells.qty.element_id],
    { oracle_refs: inst.rcv_line_id ? ['RCV:' + inst.rcv_line_id] : [],
      actual: inst.invoice === undefined ? null : inst.invoice, expected: inst.receipt === undefined ? null : inst.receipt });
}

// v5.7 (rules.py::_ai_rejected_reviews)
function aiRejectedReviews(rejected, lines) {
  const out = [];
  for (const r of rejected) {
    const prop = r.proposal || {};
    const nos = prop.invoice_line_nos || [];
    const ids = nos.filter(n => lines[n] !== undefined && lines[n] !== null).map(n => lines[n].element_id);
    out.push(RV('AI เสนอการจับคู่ที่ถูกปฏิเสธ: ' + (r.reason || '-'), ids, { missing_reason: ids.length ? null : 'NOT_LOCATED' }));
  }
  return out.length ? out : [RV('AI เสนอการจับคู่ที่อ้างบรรทัดไม่ถูกต้อง', [], { missing_reason: 'NOT_LOCATED' })];
}

function installment(c, l, rcv, g) {
  const mode = String((((c.std.policy || {}).validation || {}).milestone_installment) || 'off');
  if (['manual_review', 'exact_amount_pass', 'review'].indexOf(mode) < 0 || g.relation !== '1:1' || rcv.length !== 1) return null;
  const r = rcv[0];
  const q = D(lineV(l, 'qty')), p = D(lineV(l, 'unit_price')), a = D(lineV(l, 'amount'));
  if (q === null || p === null || a === null || dCmp(D(r.qty), D(0)) <= 0) return null;
  if (!!(((c.std.policy || {}).validation || {}).installment_requires_lower_qty === true) && !(dCmp(D(r.qty), q) < 0)) return null;
  const tol = c.std.tol('line_math');
  if (dCmp(dAbs(dSub(a, D(r.line_amount))), tol) > 0) return null;
  if (dCmp(dAbs(dSub(dQuant(dMul(q, p), 2), a)), tol) > 0) return null;
  if (dCmp(dAbs(dSub(p, D(r.unit_price))), tol) <= 0) return null;
  return {
    invoice_line_no: l.line_no, rcv_line_id: r.rcv_line_id,
    invoice: dStr(q) + ' x ' + dStr(p) + ' = ' + dStr(a),
    receipt: r.qty + ' x ' + r.unit_price + ' = ' + r.line_amount,
    receipt_fraction: dNorm(dDiv(D(r.qty), q, 20)), mode
  };
}

function valuesConfirm(c, l, rcv, g, pc) {
  if (!evidenceFlag(c, 'e11_waive_when_values_match') || pc !== 'pass' || g.relation !== '1:1') return false;
  const r = rcv[0];
  const q = D(lineV(l, 'qty')), a = D(lineV(l, 'amount'));
  return q !== null && a !== null && dCmp(q, D(r.qty)) === 0 && dCmp(dAbs(dSub(a, D(r.line_amount))), c.std.tol('line_math')) <= 0;
}

async function v08Quantity(c) {
  const rows = {}; for (const r of snapActive(c.snapshot)) rows[r.rcv_line_id] = r;
  const [payload, expected] = v08BuildPayload(c.doc, c.groups, rows, c.std);
  const v08Mode = String(c.std.policy.ai.v08_mode || 'ai');
  let results, n = 0, majority = true, dis = [];
  if (v08Mode === 'logic') { results = v08Decide(payload, expected); }
  else {
    if (c.qty_ai === null || c.qty_ai === undefined) return { rule_id: 'V-08', result: 'manual_review', findings: [], detail: 'ไม่มี AI สำหรับ V-08', halted_by: null, data: {},
      reviews: [RV('ไม่มี AI สำหรับ V-08 — ตรวจจำนวนเทียบใบรับ', [], { missing_reason: 'NOT_LOCATED' })] };
    // rules.py:690-692 - N independent judgements, then majority per line, then the code's own facts
    // veto anything the model says that contradicts the arithmetic it was shown.
    n = Number(c.std.policy.ai.v08_votes);
    const answers = [];
    for (let i = 0; i < n; i++) answers.push(await c.qty_ai.judge(payload));
    const voted = v08Vote(answers);
    majority = voted[1];
    const guarded = v08Guard(voted[0], expected, c.std.policy.ai.v08_consistency_guard === true);
    results = guarded[0]; dis = guarded[1];
  }
  const inst = new Set((c.match_trace.installment_lines || []));
  const instMode = c.match_trace.installment_mode || String((((c.std.policy || {}).validation || {}).milestone_installment) || 'off');
  if (inst.size) {
    const over = instMode === 'exact_amount_pass' ? { result: 'pass', reason: 'INSTALLMENT: ยอดเงินตรงใบรับ' }
      : instMode === 'review' ? { result: 'not_evaluated', reason: 'INSTALLMENT (ดู V-07)' }
        : { result: 'manual_review', reason: 'INSTALLMENT (ดู V-07)' };
    results = results.map(lr => inst.has(lr.invoice_line_no) ? Object.assign({}, lr, over, { code: null, severity: null, message: null }) : lr);
  }
  c.ai_trace.v08 = { mode: v08Mode, votes: n, majority, disagreements: dis };
  const lines = {}; for (const l of c.doc.lines) lines[l.line_no] = l;
  const gidOf = {}; for (const g of c.groups) for (const x of g.invoice_line_nos) gidOf[x] = g;
  const out = [];
  for (const lr of results) {
    if (lr.result === 'fail') {
      const l = lines[lr.invoice_line_no], g = gidOf[lr.invoice_line_no];
      out.push(F(c, lr.code, 'V-08', lr.message || (lineTag(l) + ': จำนวนไม่เท่าใบรับ'),
        { actual: dStr(D(lineV(l, 'qty'))), expected: lr.qty_rcv_compared, element_ids: [l.element_id, l.cells.qty.element_id], oracle_refs: g.rcv_line_ids.map(i => 'RCV:' + i) }));
    }
  }
  const active = snapActive(c.snapshot);
  if (!out.length && !inst.size && c.snapshot && active.length) {
    const matchedIds = new Set(); for (const g of c.groups) if (g.relation !== 'UNMATCHED') for (const i of g.rcv_line_ids) matchedIds.add(i);
    const activeRcv = active.filter(r => matchedIds.size === 0 || matchedIds.has(r.rcv_line_id));
    for (const ge of v08ValidateUnitPriceGroups(c.doc.lines, activeRcv, c.std.tol('line_math'))) {
      out.push(F(c, 'E14', 'V-08', 'ยอดรวมกลุ่มราคาต่อหน่วยไม่ตรงกับใบรับ: ' + ge, { actual: ge, expected: 'equal', element_ids: c.doc.lines.map(l => l.element_id) }));
    }
  }
  const res = results.map(lr => lr.result);
  const data = { line_results: results, engine: v08Mode, prompt: v08Mode !== 'logic' ? ((c.std.rules['V-08'] || {}).prompt || null) : null };
  if (out.length) return FAIL('V-08', out, undefined, data);
  if (res.indexOf('manual_review') >= 0) {
    const reviews = [];
    for (const lr of results) {
      if (lr.result !== 'manual_review') continue;
      const l = lines[lr.invoice_line_no];
      const msg = (l ? lineTag(l) : 'บรรทัดที่ ' + String(lr.invoice_line_no)) + ': ' +
        (lr.reason || lr.message || 'เทียบจำนวนกับใบรับไม่ได้');
      reviews.push(RV(msg, l ? [l.element_id, l.cells.qty.element_id] : [],
        { missing_reason: l ? null : 'NOT_LOCATED',
          actual: (!l || lineV(l, 'qty') === null) ? null : String(lineV(l, 'qty')),
          expected: lr.qty_rcv_compared === undefined || lr.qty_rcv_compared === null ? null : String(lr.qty_rcv_compared) }));
    }
    return { rule_id: 'V-08', result: 'manual_review', findings: [], halted_by: null, detail: 'AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้', data, reviews };
  }
  if (res.length && res.every(r => r === 'not_evaluated')) return SKIP('V-08', 'V-07', 'ทุกบรรทัดระบุคู่ในใบรับไม่ได้');
  return OK('V-08', undefined, data);
}

function v09TotalVsReceipt(c) {
  if (!docOk(c.doc, 'sub_total')) return SKIP('V-09', 'V-01', 'ยอดก่อนภาษีอ่านไม่ได้');
  const sub = D(docV(c.doc, 'sub_total'));
  let data = {}, rows;
  if (flag(c, 'v09_compare_matched_only')) {
    const matched = new Set(); for (const g of c.groups) if (g.relation !== 'UNMATCHED') for (const i of g.rcv_line_ids) matched.add(i);
    const active = snapActive(c.snapshot);
    rows = active.filter(r => matched.has(r.rcv_line_id));
    data = { compared: 'matched_only', matched_rcv_line_ids: sortedStr([...matched]), unmatched_rcv_line_ids: active.filter(r => !matched.has(r.rcv_line_id)).map(r => r.rcv_line_id).sort() };
  } else rows = snapActive(c.snapshot);
  const rcv = rows.map(r => D(r.line_amount)).reduce((x, y) => dAdd(x, y), D(0));
  if (dCmp(dAbs(dSub(sub, rcv)), c.std.tol('total')) > 0) {
    return FAIL('V-09', [F(c, 'E03', 'V-09', 'ยอดก่อนภาษี ' + dStr(sub) + ' ≠ ยอดใบรับ ' + dStr(rcv),
      { source: 'receipt', actual: dStr(sub), expected: dStr(rcv), element_ids: [c.doc.fields.sub_total.element_id], oracle_refs: snapReceiptNums(c.snapshot).map(n => 'RCV:' + n) })], undefined, data);
  }
  return OK('V-09', 'invoice ' + fmtThousand(sub) + ' = receipt ' + fmtThousand(rcv), data);
}

const STEP3 = [v07LineMatch, v08Quantity, v09TotalVsReceipt];
