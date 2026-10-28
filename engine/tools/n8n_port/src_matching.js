// =================================================================================================
// src_matching.js — domain/matching.py (V-07 pairing, logic levels M1/N:1/1:N)
// src_v08.js     — domain/v08.py   (facts + logic verdicts + unit-price group check)
// The AI matcher is passed as null here (same as the reference run), so M3/M4/M5 never fire.
// =================================================================================================

const LEVEL_CONF = { M1: 1.0, M3: 0.90, M4: 0.85, M5: 0.80 };

function uomOk(l, r, std) {
  const rg = std.uomGroup(r.uom);
  if (l.uom_group === null || l.uom_group === undefined) return true;
  if (rg === l.uom_group) return true;
  return !rg && !!((((std.policy || {}).validation || {}).uom_mismatch || {}).unknown_unit_uses_price === true);
}
function priceEq(a, b, std) {
  const x = a === null || a === undefined ? null : D(a), y = b === null || b === undefined ? null : D(b);
  return x !== null && y !== null && dCmp(dAbs(dSub(x, y)), std.tol('price_exact')) <= 0;
}
function linePo(line, rows) {
  const known = new Set(rows.map(r => r.po_number).filter(x => x));
  return (line.po_refs || []).filter(p => known.has(p))[0] || null;
}
const keyAlnum = (s) => String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
function codeOnLine(line, r) {
  const code = keyAlnum(r.item_code || ((r.extra || {}).ITEM_CODE));
  if (code.length < 6) return false;
  const d = (line.cells || {}).description, i = (line.cells || {}).item_code;
  const text = keyAlnum(d ? d.raw : '') + keyAlnum(i ? i.raw : '');
  return text.indexOf(code) >= 0;
}
function valuesEqual(l, r, std) {
  const q = D(lineV(l, 'qty')), p = D(lineV(l, 'unit_price')), a = D(lineV(l, 'amount'));
  if (q === null || p === null || a === null) return false;
  return priceEq(p, r.unit_price, std) && dCmp(q, D(r.qty)) === 0 &&
    dCmp(dAbs(dSub(a, D(r.line_amount))), std.tol('line_math')) <= 0 && uomOk(l, r, std);
}
function narrow(l, cands, rows) {
  const po = linePo(l, rows);
  if (cands.length > 1 && po) { const k = cands.filter(r => r.po_number === po); cands = k.length ? k : cands; }
  if (cands.length > 1) { const byCode = cands.filter(r => codeOnLine(l, r)); cands = byCode.length ? byCode : cands; }
  return cands;
}
function numericMatch(l, r, std) {
  const q = D(lineV(l, 'qty')), p = D(lineV(l, 'unit_price')), a = D(lineV(l, 'amount'));
  if (q === null || p === null || a === null) return false;
  return priceEq(p, r.unit_price, std) && dCmp(q, D(r.qty)) === 0 && dCmp(dAbs(dSub(a, D(r.line_amount))), std.tol('line_math')) <= 0;
}
function narrowInv(r, lines, rows) {
  if (lines.length > 1 && r.po_number) {
    let k = lines.filter(x => { const p = linePo(x, rows); return p === null || p === undefined || p === r.po_number; });
    lines = k.length ? k : lines;
    k = lines.filter(x => linePo(x, rows) === r.po_number);
    lines = k.length ? k : lines;
  }
  if (lines.length > 1) { const k = lines.filter(x => codeOnLine(x, r)); lines = k.length ? k : lines; }
  return lines;
}
function exactNumericPair(l, inv, rcv, rows, std) {
  let cands = narrow(l, Object.values(rcv).filter(r => numericMatch(l, r, std)), rows);
  if (!cands.length) return null;
  if (cands.length === 1) {
    const r = cands[0];
    const back = narrowInv(r, Object.values(inv).filter(x => numericMatch(x, r, std)), rows);
    return back.length === 1 && back[0] === l ? r : null;
  }
  const back = Object.values(inv).filter(x => numericMatch(x, cands[0], std));
  return cands.length === back.length ? cands[0] : null;
}
function exactValuePair(l, inv, rcv, rows, std) {
  const cands = narrow(l, Object.values(rcv).filter(r => valuesEqual(l, r, std)), rows);
  if (cands.length !== 1) return null;
  const r = cands[0];
  const back = narrowInv(r, Object.values(inv).filter(x => valuesEqual(x, r, std)), rows);
  return back.length === 1 && back[0] === l ? r : null;
}
function combos(arr, k) {                             // itertools.combinations order
  const res = [], out = [], n = arr.length;
  const rec = (start, left) => {
    if (left === 0) { res.push(out.slice()); return; }
    for (let i = start; i < n; i++) { out.push(arr[i]); rec(i + 1, left - 1); out.pop(); }
  };
  rec(0, k);
  return res;
}
function findNto1(inv, rcv, rows, std) {
  for (const [rid, r] of Object.entries(rcv)) {
    let cands = Object.values(inv).filter(l => priceEq(D(lineV(l, 'unit_price')), r.unit_price, std) && lineV(l, 'qty') !== null && lineV(l, 'amount') !== null);
    if (r.po_number) {
      const pc = cands.filter(l => { const p = linePo(l, rows); return p === null || p === undefined || p === r.po_number; });
      if (pc.length) cands = pc;
    }
    if (cands.length < 2) continue;
    let totQ = D(0), totA = D(0);
    for (const l of cands) { totQ = dAdd(totQ, D(lineV(l, 'qty'))); totA = dAdd(totA, D(lineV(l, 'amount'))); }
    if (dCmp(totQ, D(r.qty)) === 0 && dCmp(dAbs(dSub(totA, D(r.line_amount))), std.tol('line_math')) <= 0) {
      return [cands.map(l => l.line_no), rid];
    }
    if (cands.length <= 10) {
      const found = [];
      for (let k = 2; k < cands.length; k++) {
        for (const sub of combos(cands, k)) {
          let sq = D(0), sa = D(0);
          for (const x of sub) { sq = dAdd(sq, D(lineV(x, 'qty'))); sa = dAdd(sa, D(lineV(x, 'amount'))); }
          if (dCmp(sq, D(r.qty)) === 0 && dCmp(dAbs(dSub(sa, D(r.line_amount))), std.tol('line_math')) <= 0) found.push(sub.map(x => x.line_no));
        }
      }
      if (found.length === 1) return [found[0], rid];
    }
  }
  return [null, null];
}
function find1toN(inv, rcv, rows, std) {
  for (const [nStr, l] of Object.entries(inv)) {
    const n = Number(nStr);
    const q = D(lineV(l, 'qty')), p = D(lineV(l, 'unit_price')), a = D(lineV(l, 'amount'));
    if (q === null || p === null || a === null) continue;
    let cands = Object.values(rcv).filter(r => priceEq(p, r.unit_price, std));
    const po = linePo(l, rows);
    if (po) { const pc = cands.filter(r => r.po_number === null || r.po_number === undefined || r.po_number === po); if (pc.length) cands = pc; }
    if (cands.length < 2) continue;
    let totQ = D(0), totA = D(0);
    for (const r of cands) { totQ = dAdd(totQ, D(r.qty)); totA = dAdd(totA, D(r.line_amount)); }
    if (dCmp(totQ, q) === 0 && dCmp(dAbs(dSub(totA, a)), std.tol('line_math')) <= 0) return [n, cands.map(r => r.rcv_line_id)];
    if (cands.length <= 10) {
      const found = [];
      for (let k = 2; k < cands.length; k++) {
        for (const sub of combos(cands, k)) {
          let sq = D(0), sa = D(0);
          for (const x of sub) { sq = dAdd(sq, D(x.qty)); sa = dAdd(sa, D(x.line_amount)); }
          if (dCmp(sq, q) === 0 && dCmp(dAbs(dSub(sa, a)), std.tol('line_math')) <= 0) found.push(sub.map(x => x.rcv_line_id));
        }
      }
      if (found.length === 1) return [n, found[0]];
    }
  }
  return [null, null];
}
function tieReason(l, r, rows) {
  const bits = [];
  if (linePo(l, rows) === r.po_number && r.po_number) bits.push('PO ' + r.po_number);
  if (codeOnLine(l, r)) bits.push('ITEM ' + (r.item_code || ((r.extra || {}).ITEM_CODE)));
  return bits.join(' + ') || 'คู่เดียวที่ตัวเลขตรง';
}

async function resolve(doc, active, std, ai) {
  const groups = [], trace = { ai_rejected: [], ai_called: false };
  let inv = {}, rcv = {};
  for (const l of doc.lines) inv[l.line_no] = l;
  for (const r of active) rcv[r.rcv_line_id] = r;
  const gid = () => 'G' + (groups.length + 1);
  const G = (id, rel, lvl, ins, rids, conf, src, why) => ({ group_id: id, relation: rel, level: lvl, invoice_line_nos: ins, rcv_line_ids: rids, confidence: conf, source: src, rationale: why === undefined ? null : why });
  const keysSorted = (o) => Object.keys(o).map(Number).sort((a, b) => a - b);

  for (const n of keysSorted(inv)) {
    if (!(n in inv)) continue;
    const l = inv[n];
    const r = exactNumericPair(l, inv, rcv, active, std);
    if (r === null) continue;
    groups.push(G(gid(), '1:1', 'M1', [n], [r.rcv_line_id], 1.0, 'logic', 'ราคา/จำนวน/ยอดตรง + ' + tieReason(l, r, active)));
    delete inv[n]; delete rcv[r.rcv_line_id];
  }
  for (const nStr of Object.keys(inv).map(Number)) {
    const n = nStr, l = inv[n];
    if (!(n in inv)) continue;
    const p = D(lineV(l, 'unit_price'));
    let cands = Object.values(rcv).filter(r => priceEq(p, r.unit_price, std) && uomOk(l, r, std));
    if (cands.length > 1) {
      const po = linePo(l, active);
      if (po) cands = cands.filter(r => r.po_number === po);
    }
    if (cands.length !== 1) continue;
    const r = cands[0];
    let rivals = Object.values(inv).filter(x => x.line_no !== n && priceEq(D(lineV(x, 'unit_price')), r.unit_price, std));
    if (rivals.length && r.po_number && linePo(l, active) === r.po_number) rivals = rivals.filter(x => { const p2 = linePo(x, active); return p2 === null || p2 === undefined || p2 === r.po_number; });
    if (rivals.length) continue;
    groups.push(G(gid(), '1:1', 'M1', [n], [r.rcv_line_id], 1.0, 'logic', 'ราคาตรงบรรทัดเดียว'));
    delete inv[n]; delete rcv[r.rcv_line_id];
  }
  if ((((std.policy || {}).matching || {}).m1_exact_values_item_code) === true) {
    for (const n of keysSorted(inv)) {
      if (!(n in inv)) continue;
      const l = inv[n];
      const r = exactValuePair(l, inv, rcv, active, std);
      if (r === null) continue;
      groups.push(G(gid(), '1:1', 'M1', [n], [r.rcv_line_id], 1.0, 'logic', 'ราคา/จำนวน/ยอดตรง + ' + tieReason(l, r, active)));
      delete inv[n]; delete rcv[r.rcv_line_id];
    }
  }
  for (;;) {
    const [ins, rid] = findNto1(inv, rcv, active, std);
    if (!ins) break;
    groups.push(G(gid(), 'N:1', 'M1', sortedNum(ins), [rid], 1.0, 'logic', 'รวมหลายบรรทัดวางบิลตรง 1 บรรทัดใบรับ (ราคาเท่ากัน)'));
    for (const n of ins) delete inv[n];
    delete rcv[rid];
  }
  for (;;) {
    const [n, rids] = find1toN(inv, rcv, active, std);
    if (!n) break;
    groups.push(G(gid(), '1:N', 'M1', [n], rids, 1.0, 'logic', '1 บรรทัดวางบิลตรงหลายบรรทัดใบรับ (ราคาเท่ากัน)'));
    delete inv[n];
    for (const rid of rids) delete rcv[rid];
  }
  if (Object.keys(inv).length && Object.keys(rcv).length && ai !== null && ai !== undefined) {
    // ---- M3/M4/M5 (AI primary), domain/matching.py:306-333.  The model proposes; the four guardrails
    // below are what the code accepts, so a hallucinated line number never reaches a verdict.
    trace.ai_called = true;
    const sub = { document_id: doc.document_id, fields: doc.fields, lines: Object.values(inv),
      signatures: doc.signatures, pages_complete: doc.pages_complete };
    const out = (await ai.propose(invPayload(sub, active), rcvPayload(Object.values(rcv), std))) || {};
    for (const g of (out.groups || [])) {
      const ins = (g.invoice_line_nos || []).map(x => parseInt(String(x), 10));
      const rids = (g.rcv_line_ids || []).map(x => String(x));
      const lvl = g.level === undefined ? 'M5' : g.level;
      let why = null;
      if (!ins.length || !rids.length) why = 'empty_group';
      else if (!ins.every(n => n in inv) || !rids.every(i => i in rcv)) why = 'unknown_or_reused_line';
      else if (ins.length > 1 && rids.length > 1) why = 'n_to_m_not_allowed';
      else if (['M3', 'M4', 'M5'].indexOf(lvl) < 0) why = 'invalid_level';
      if (why) { trace.ai_rejected.push({ proposal: g, reason: why }); continue; }
      const rel = (ins.length === 1 && rids.length === 1) ? '1:1' : (ins.length === 1 ? '1:N' : 'N:1');
      const conf = Number(g.confidence === undefined ? LEVEL_CONF[lvl] : g.confidence);
      groups.push(G(gid(), rel, lvl, ins, rids, conf, 'ai', g.rationale === undefined ? null : g.rationale));
      for (const n of ins) delete inv[n];
      for (const i of rids) delete rcv[i];
    }
  }
  for (const n of keysSorted(inv)) {
    groups.push(G(gid(), 'UNMATCHED', 'NONE', [n], [], 0.0, trace.ai_rejected.length ? 'guardrail' : (trace.ai_called ? 'ai' : 'logic')));
  }
  trace.unmatched_rcv_line_ids = Object.keys(rcv).sort();
  return [groups, trace];
}

// domain/matching.py:197 inv_payload / :206 _inv_payload.  Key order and the "only when Oracle confirmed it"
// po_number both change the bytes the model sees, so they are part of the port, not cosmetics.
function invPayload(doc, rows) {
  const out = [];
  for (const l of doc.lines) {
    const d = { invoice_line_no: l.line_no, item_code: lineV(l, 'item_code'), description: lineV(l, 'description'),
      qty: lineV(l, 'qty'), uom: lineV(l, 'uom'), uom_group: l.uom_group,
      unit_price: lineV(l, 'unit_price'), amount: lineV(l, 'amount') };
    const po = linePo(l, rows);
    if (po) d.po_number = po;
    out.push(d);
  }
  return out;
}

// domain/matching.py:213 rcv_payload
function rcvPayload(rows, std) {
  const out = [];
  for (const r of rows) {
    const d = { rcv_line_id: r.rcv_line_id, item: r.item, qty: String(r.qty), uom: r.uom,
      uom_group: std.uomGroup(r.uom), unit_price: String(r.unit_price), line_amount: String(r.line_amount) };
    if (r.po_number) d.po_number = r.po_number;
    if (r.item_code) d.item_code = r.item_code;
    out.push(d);
  }
  return out;
}

function priceCheck(invPrice, rcvPrice, std) {
  const d = dAbs(dSub(D(invPrice), D(rcvPrice)));
  if (dCmp(d, std.tol('price_exact')) <= 0) return 'pass';
  if (dCmp(D(rcvPrice), D(0)) > 0 && dCmp(dDiv(d, D(rcvPrice), 12), std.tol('price_pct')) <= 0 && dCmp(d, std.tol('price_abs')) <= 0) return 'within_tolerance';
  return 'over_tolerance';
}

// ---------------------------------------------------------------- domain/v08.py
const SERVICE_UNITS = ['JOB', 'LOT', 'เหมา', 'งาน', 'SERVICE', 'ACTIVITY'];

function v08BuildPayload(doc, groups, rows, std) {
  const lines = {}; for (const l of doc.lines) lines[l.line_no] = l;
  const invLines = [], mg = [], facts = {}, expected = {};
  for (const l of doc.lines) invLines.push({ invoice_line_no: l.line_no, description: lineV(l, 'description') || '', qty_inv: lineV(l, 'qty') === null ? null : lineV(l, 'qty'), uom_group: l.uom_group });
  for (const g of groups) {
    const rcv = g.rcv_line_ids.filter(i => i in rows).map(i => rows[i]);
    mg.push({ group_id: g.group_id, relation: g.relation, match_level: g.level, invoice_line_nos: g.invoice_line_nos.slice(), rcv_lines: rcv.map(r => ({ rcv_line: r.rcv_line_id, qty_rcv: r.qty, uom_group: std.uomGroup(r.uom) })) });
    if (g.relation === 'UNMATCHED') { for (const n of g.invoice_line_nos) expected[n] = ['not_evaluated', null]; continue; }
    const uomMode = String((((std.policy || {}).validation || {}).v08_uom_mismatch) || 'delegate');
    const ug = new Set([].concat(rcv.map(r => std.uomGroup(r.uom)), g.invoice_line_nos.map(n => lines[n].uom_group)));
    let comparable;
    if ((((std.policy || {}).validation || {}).uom_mismatch || {}).unknown_unit_uses_price === true) comparable = [...ug].filter(x => x !== null && x !== undefined).length <= 1;
    else comparable = ug.size === 1 && !ug.has(null) && !ug.has(undefined);
    let rsum = D(0); for (const r of rcv) rsum = dAdd(rsum, D(r.qty));
    if (!comparable && (g.source === 'logic' || g.level === 'M1')) {
      if (g.relation === '1:1' && rcv.length === 1) {
        const l0 = lines[g.invoice_line_nos[0]];
        if (dCmp(D(lineV(l0, 'qty')), D(rcv[0].qty)) === 0 && lineV(l0, 'amount') !== null && dCmp(dAbs(dSub(D(lineV(l0, 'amount')), D(rcv[0].line_amount))), std.tol('line_math')) <= 0) comparable = true;
      } else if (g.relation === 'N:1' && rcv.length === 1) {
        const allQ = g.invoice_line_nos.map(x => D(lineV(lines[x], 'qty'))), allA = g.invoice_line_nos.map(x => D(lineV(lines[x], 'amount')));
        if (allQ.every(q => q !== null) && allA.every(a => a !== null)) {
          let sq = D(0), sa = D(0);
          for (const q of allQ) sq = dAdd(sq, q);
          for (const a of allA) sa = dAdd(sa, a);
          if (dCmp(sq, D(rcv[0].qty)) === 0 && dCmp(dAbs(dSub(sa, D(rcv[0].line_amount))), std.tol('line_math')) <= 0) comparable = true;
        }
      } else if (g.relation === '1:N' && g.invoice_line_nos.length === 1) {
        const l0 = lines[g.invoice_line_nos[0]];
        let totRa = D(0); for (const r of rcv) totRa = dAdd(totRa, D(r.line_amount));
        if (dCmp(D(lineV(l0, 'qty')), rsum) === 0 && lineV(l0, 'amount') !== null && dCmp(dAbs(dSub(D(lineV(l0, 'amount')), totRa)), std.tol('line_math')) <= 0) comparable = true;
      }
    }
    const per = [];
    if (g.relation === 'N:1') {
      const allQty = g.invoice_line_nos.map(n => D(lineV(lines[n], 'qty')));
      const hasNone = allQty.some(q => q === null);
      let invSum = null; if (!hasNone) for (const q of allQty) invSum = dAdd(invSum === null ? null : invSum, q);
      invSum = hasNone ? null : allQty.reduce((x, y) => dAdd(x, y), D(0));
      const diff = invSum === null ? null : dSub(invSum, rsum);
      const allA = g.invoice_line_nos.map(x => D(lineV(lines[x], 'amount')));
      const totA = allA.some(a => a === null) || !allA.length ? null : allA.reduce((x, y) => dAdd(x, y), D(0));
      const amtMatch = totA !== null && rcv.length === 1 && dCmp(dAbs(dSub(totA, D(rcv[0].line_amount))), std.tol('line_math')) <= 0;
      const isService = hasNone || g.invoice_line_nos.some(x => SERVICE_UNITS.indexOf(lines[x].uom_group) >= 0) || rcv.some(r => SERVICE_UNITS.indexOf(std.uomGroup(r.uom)) >= 0);
      for (const n of g.invoice_line_nos) {
        per.push({ invoice_line_no: n, qty_rcv_compared: dStr(rsum), qty_diff: diff === null ? null : dStr(diff) });
        if (!comparable) { if (isService && amtMatch) expected[n] = ['pass', null]; else expected[n] = uomMode === 'delegate' ? ['not_evaluated', null] : ['manual_review', null]; }
        else if (diff === null) { if (isService && amtMatch) expected[n] = ['pass', null]; else expected[n] = ['manual_review', null]; }
        else if (dCmp(diff, D(0)) === 0) expected[n] = ['pass', null];
        else expected[n] = ['fail', dCmp(diff, D(0)) > 0 ? 'E14' : 'E15'];
      }
    } else {
      for (const n of g.invoice_line_nos) {
        const q = D(lineV(lines[n], 'qty'));
        const cmp = g.relation === '1:N' ? rsum : (rcv.length ? D(rcv[0].qty) : D(0));
        const diff = q === null ? null : dSub(q, cmp);
        per.push({ invoice_line_no: n, qty_rcv_compared: dStr(cmp), qty_diff: diff === null ? null : dStr(diff) });
        let totRa = D(0); for (const r of rcv) totRa = dAdd(totRa, D(r.line_amount));
        const targetAmt = g.relation === '1:N' ? totRa : (rcv.length ? D(rcv[0].line_amount) : D(0));
        const isService = q === null || SERVICE_UNITS.indexOf(lines[n].uom_group) >= 0 || rcv.some(r => SERVICE_UNITS.indexOf(std.uomGroup(r.uom)) >= 0);
        const amtMatch = lineV(lines[n], 'amount') !== null && dCmp(dAbs(dSub(D(lineV(lines[n], 'amount')), targetAmt)), std.tol('line_math')) <= 0;
        if (!comparable) { if (isService && amtMatch) expected[n] = ['pass', null]; else expected[n] = uomMode === 'delegate' ? ['not_evaluated', null] : ['manual_review', null]; }
        else if (diff === null) { if (isService && amtMatch) expected[n] = ['pass', null]; else expected[n] = ['manual_review', null]; }
        else if (dCmp(diff, D(0)) === 0) expected[n] = ['pass', null];
        else expected[n] = ['fail', dCmp(diff, D(0)) > 0 ? 'E14' : 'E15'];
      }
    }
    facts[g.group_id] = { uom_comparable: comparable, rcv_qty_sum: dStr(rsum), per_line: per };
  }
  return [{ INVOICE_LINES: invLines, MATCH_GROUPS: mg, COMPUTED_FACTS: facts }, expected];
}

function v08Decide(payload, expected) {
  const inv = Object.fromEntries(payload.INVOICE_LINES.map(l => [l.invoice_line_no, l]));
  const grp = {}; for (const g of payload.MATCH_GROUPS) for (const n of g.invoice_line_nos) grp[n] = g;
  const per = {};
  for (const g of payload.MATCH_GROUPS) for (const p of ((payload.COMPUTED_FACTS || {})[g.group_id] || {}).per_line || []) per[p.invoice_line_no] = p;
  const out = [];
  for (const nStr of Object.keys(expected).map(Number).sort((a, b) => a - b)) {
    const n = nStr, [res, code] = expected[n];
    const g = grp[n] || {}, p = per[n] || {}, line = inv[n] || {};
    let msg = null;
    if (code) {
      const word = code === 'E14' ? 'เกินใบรับ' : 'น้อยกว่าใบรับ';
      msg = ('บรรทัดที่ ' + n + ' (Invoice: ' + (line.description || '-') + '): จำนวนวางบิล' + word + ' (Inv: ' + (line.qty_inv === undefined ? null : line.qty_inv) + ', Rcv: ' + (p.qty_rcv_compared === undefined ? null : p.qty_rcv_compared) + ')').slice(0, 160);
    }
    let reason;
    if (res === 'not_evaluated') reason = g.relation === 'UNMATCHED' ? 'V-07 ระบุบรรทัดใบรับไม่ได้' : 'DELEGATED_TO_V07_E10';
    else if (res === 'manual_review') reason = 'หน่วยนับต่างกลุ่มหรือ qty เป็น null';
    else if (line.qty_inv === undefined || line.qty_inv === null) reason = 'service line amount match';
    else reason = 'ตาม COMPUTED_FACTS';
    out.push({
      invoice_line_no: n, group_id: g.group_id === undefined ? null : g.group_id, relation: g.relation === undefined ? null : g.relation,
      qty_inv: line.qty_inv === undefined ? null : line.qty_inv, qty_rcv_compared: p.qty_rcv_compared === undefined ? null : p.qty_rcv_compared,
      qty_diff: p.qty_diff === undefined ? null : p.qty_diff, result: res, code: code === undefined ? null : code,
      severity: code === 'E14' ? 'High' : (code === 'E15' ? 'Medium' : null), message: msg, reason
    });
  }
  return out;
}

// domain/v08.py:148 vote - self-consistency across the N judge calls.  Ties keep the first answer seen,
// which is how Counter.most_common behaves (stable sort), so the merged answer is reproducible.
function v08Vote(answers) {
  if (answers.length === 1) return [answers[0], true];
  const byLine = {};
  for (const a of answers) for (const lr of ((a || {}).line_results || [])) {
    const k = lr.invoice_line_no;
    if (!byLine[k]) byLine[k] = [];
    byLine[k].push(lr);
  }
  const merged = [];
  let ok = true;
  for (const n of Object.keys(byLine).map(Number).sort((a, b) => a - b)) {
    const lrs = byLine[n];
    const keyOf = (x) => JSON.stringify([x.result, x.code === undefined ? null : x.code]);
    const counts = new Map();
    for (const x of lrs) {
      const k = keyOf(x);
      if (!counts.has(k)) counts.set(k, { key: k, n: 0 });
      counts.get(k).n += 1;
    }
    let best = null;
    for (const v of counts.values()) if (best === null || v.n > best.n) best = v;
    if (best.n * 2 <= answers.length) {
      ok = false;
      merged.push(Object.assign({}, lrs[0], { result: 'manual_review', code: null, severity: null, reason: 'AI_NO_MAJORITY' }));
    } else {
      merged.push(lrs.find(x => keyOf(x) === best.key));
    }
  }
  return [{ rule_id: 'V-08', line_results: merged }, ok];
}

// domain/v08.py:168 guard - the facts the code already computed outrank the model's opinion.
function v08Guard(ai, expected, enabled) {
  const seen = {}; for (const lr of ((ai || {}).line_results || [])) if (lr && typeof lr === 'object') seen[lr.invoice_line_no] = lr;
  const out = [], dis = [];
  for (const n of Object.keys(expected).map(Number).sort((a, b) => a - b)) {
    const expRes = expected[n][0], expCode = expected[n][1];
    if (expRes === 'not_evaluated') {
      out.push({ invoice_line_no: n, result: 'not_evaluated', code: null, severity: null, message: null, reason: 'DELEGATED_TO_V07_E10' });
      continue;
    }
    let lr = seen[n];
    if (lr === undefined) {
      out.push({ invoice_line_no: n, result: 'manual_review', code: null, severity: null, message: null, reason: 'AI_LINE_MISSING' });
      dis.push({ invoice_line_no: n, reason: 'missing' });
      continue;
    }
    if ([null, 'E14', 'E15'].indexOf(lr.code === undefined ? null : lr.code) < 0) lr = Object.assign({}, lr, { result: 'manual_review', code: null, reason: 'AI_INVALID_CODE' });
    const lrCode = lr.code === undefined ? null : lr.code;
    if (enabled === true && (lr.result !== expRes || lrCode !== expCode) && lr.result !== 'manual_review') {
      dis.push({ invoice_line_no: n, ai: [lr.result, lrCode], facts: [expRes, expCode] });
      lr = Object.assign({}, lr, { result: 'manual_review', code: null, severity: null, reason: 'AI_FACTS_DISAGREE' });
    }
    out.push(lr);
  }
  return [out, dis];
}

function v08ValidateUnitPriceGroups(lines, rcvRows, tol) {
  const invGroups = new Map();
  for (const l of lines) {
    const p = D(lineV(l, 'unit_price')), q = D(lineV(l, 'qty')), a = D(lineV(l, 'amount'));
    if (p === null) continue;
    const dp = dQuant(p, 2);
    if (dCmp(dp, D(0)) <= 0) continue;
    const k = dStr(dp);
    if (!invGroups.has(k)) invGroups.set(k, { qty: D(0), amount: D(0), lines: [], has_qty: false, dp });
    const e = invGroups.get(k);
    if (q !== null && dCmp(q, D(0)) > 0) { e.qty = dAdd(e.qty, q); e.has_qty = true; }
    e.amount = dAdd(e.amount, a === null ? D(0) : a);
    e.lines.push(l.line_no);
  }
  const orcGroups = new Map();
  for (const r of rcvRows) {
    if (dCmp(D(r.qty), D(0)) <= 0) continue;
    if (r.unit_price === null || r.unit_price === undefined) continue;
    const dp = dQuant(D(r.unit_price), 2), k = dStr(dp);
    if (!orcGroups.has(k)) orcGroups.set(k, { qty: D(0), amount: D(0), rcv_ids: [], dp });
    const e = orcGroups.get(k);
    e.qty = dAdd(e.qty, D(r.qty || 0));
    const amt = (r.line_amount === null || r.line_amount === undefined) ? dMul(D(r.qty), D(r.unit_price)) : D(r.line_amount);
    e.amount = dAdd(e.amount, amt === null ? D(0) : amt);
    e.rcv_ids.push(r.rcv_line_id);
  }
  const errors = [];
  for (const e of [...invGroups.values()].sort((x, y) => dCmp(x.dp, y.dp))) {
    const o = orcGroups.get(dStr(e.dp)) || { qty: D(0), amount: D(0) };
    const qd = dAbs(dSub(e.qty, o.qty)), ad = dAbs(dSub(e.amount, o.amount));
    const mismatch = e.has_qty ? (dCmp(qd, tol) > 0 || dCmp(ad, tol) > 0) : dCmp(ad, tol) > 0;
    if (mismatch) errors.push('unit_price:' + dToFixed(e.dp, 2) + '(qty_inv=' + dStr(e.qty) + ',qty_orc=' + dStr(o.qty) + ',amt_inv=' + dStr(e.amount) + ',amt_orc=' + dStr(o.amount) + ')');
  }
  return errors;
}
