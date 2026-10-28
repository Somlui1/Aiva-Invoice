// =================================================================================================
// src_evidence.js — node 16/17: domain/evidence.py (doc-level corroboration + collapse + audit)
// NField.value / cell values are Decimal-as-string here; Decimal work happens through D()/dCmp.
// =================================================================================================

const PROMOTABLE = ['CONFLICT_BETWEEN_SOURCES', 'LOW_CONFIDENCE'];
const COVERED_TAG = 'covered_by_customer_tax_id';
const Q2D = 2;

function evEnabled(std, name) { return !!(((std.policy || {}).evidence || {})[name] === true); }
function isPromotable(f) { return f !== null && f !== undefined && f.value !== null && !f.ok && PROMOTABLE.indexOf(f.null_reason) >= 0; }
function promote(f, tag) {
  if (f === null || f === undefined || f.ok || f.value === null || PROMOTABLE.indexOf(f.null_reason) < 0) return f;
  return { ...f, ok: true, null_reason: null, evidence: (f.evidence || []).concat([tag]) };
}
function fval(f) {                                   // evidence._val
  if (f === null || f === undefined || f.value === null) return null;
  return (f.ok || PROMOTABLE.indexOf(f.null_reason) >= 0) ? f.value : null;
}
function fdec(v) { if (v === null || v === undefined) return null; const d = D(v); return (d === null || d.nan) ? null : d; }
function fieldOf(doc, k) { return (doc.fields || {})[k]; }
function fieldValAny(doc, k) { const f = fieldOf(doc, k); return (f === undefined || f === null) ? null : f.value; }
function docOk(doc, k) { const f = fieldOf(doc, k); return !!(f && f.ok); }
function docV(doc, k) { const f = fieldOf(doc, k); return (f && f.ok) ? f.value : null; }
function lineOk(l, k) { const c = (l.cells || {})[k]; return !!(c && c.ok); }
function lineV(l, k) { const c = (l.cells || {})[k]; return (c && c.ok) ? c.value : null; }
function lineValAny(l, k) { const c = (l.cells || {})[k]; return (c === undefined || c === null) ? null : c.value; }
function withCells(line, cells) {
  const next = Object.assign({}, line.cells);
  for (const [k, v] of Object.entries(cells)) if (v !== null && v !== undefined) next[k] = v;
  return { ...line, cells: next };
}
function rebuild(doc, fields, lines) { return { ...doc, fields, lines: lines.slice() }; }
function nField(name, elementId, raw, value, confidence, ok, nullReason) {
  return { name, element_id: elementId, raw, value, confidence, ok, null_reason: nullReason || null, evidence: [] };
}

function normOcr(s) {
  return String(s || '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '').replace(/0/g, 'O').replace(/1/g, 'I');
}
function _isWordChar(c) { return c !== undefined && /[\p{L}\p{N}_]/u.test(c); }
function seqRatio(a, b) {                              // difflib.SequenceMatcher(None,a,b).ratio()
  const la = a.length, lb = b.length;
  if (la + lb === 0) return 1;
  const blocks = (alo, ahi, blo, bhi) => {
    if (ahi <= alo || bhi <= blo) return 0;
    let besti = alo, bestj = blo, bestsize = 0, j2best = null;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const next = new Map();
      for (let j = blo; j < bhi; j++) {
        const prev = (j2len.get(j) || 0) + 1;
        next.set(j + 1, prev);
        if (prev > bestsize) { bestsize = prev; besti = i - prev + 1; bestj = j - prev + 1; j2best = j + 1; }
      }
      j2len = next;
    }
    if (!bestsize) return 0;
    return bestsize + blocks(alo, besti, blo, bestj) + blocks(besti + bestsize, ahi, bestj + bestsize, bhi);
  };
  return 2 * blocks(0, la, 0, lb) / (la + lb);
}
function isSameText(s0, s1) {                          // -> [is_match, is_conflict]
  if (!s0 || !s1) return [false, false];
  const n0 = normOcr(s0), n1 = normOcr(s1);
  if (n0 === n1) return [true, false];
  if (n0 && n1 && /[0-9]$/.test(n0) && /[0-9]$/.test(n1) && n0.slice(-1) !== n1.slice(-1)) return [false, true];
  const r = seqRatio(n0, n1);
  if (r >= 0.85) return [true, false];
  if (r < 0.6) return [false, true];
  return [false, false];
}
function hasWord(text, word) {                         // re.search(rf"\b{word}\b", text, IGNORECASE)
  const t = String(text), w = String(word).toLowerCase(), tl = t.toLowerCase();
  let i = 0;
  while ((i = tl.indexOf(w.toLowerCase(), i)) >= 0) {
    const before = i === 0 ? undefined : t[i - 1], after = t[i + w.length];
    if (!_isWordChar(before) && !_isWordChar(after)) return true;
    i += 1;
  }
  return false;
}
function rowSimilarity(r0, r1, tol) {
  let matchC = false, matchD = false;
  if (r0.item_code && r1.item_code) { const [, conf] = isSameText(r0.item_code, r1.item_code); if (conf) return 0.0; else matchC = isSameText(r0.item_code, r1.item_code)[0]; }
  if (r0.desc && r1.desc) { const [m, conf] = isSameText(r0.desc, r1.desc); if (conf) return 0.0; else matchD = m; }
  const near = (a, b) => a !== null && b !== null && dCmp(dAbs(dSub(a, b)), tol) <= 0;
  if (near(r0.amount, r1.amount)) {
    if ((r0.qty === null || r1.qty === null) || dCmp(r0.qty, r1.qty) === 0) {
      if ((r0.unit_price === null || r1.unit_price === null) || near(r0.unit_price, r1.unit_price)) return 1.0;
    }
  }
  const shared = ['qty', 'unit_price', 'amount'].filter(k => r0[k] !== null && r1[k] !== null);
  if (shared.length && shared.every(k => near(r0[k], r1[k]))) {
    if (shared.length >= 2 || (shared.length === 1 && shared[0] === 'amount')) return 0.95;
  }
  if (matchC || matchD) {
    if (r0.qty !== null && r1.qty !== null && dCmp(r0.qty, r1.qty) === 0) {
      if (r0.amount !== null && r1.amount !== null) {
        const maxAmt = dAbs(r0.amount).v > dAbs(r1.amount).v ? dAbs(r0.amount) : dAbs(r1.amount);
        const m = dCmp(maxAmt, D(1)) > 0 ? maxAmt : D(1);
        if (dCmp(dDiv(dAbs(dSub(r0.amount, r1.amount)), m, 6), D('0.05')) <= 0) return 0.9;
      } else return 0.85;
    }
  }
  if (r0.qty !== null && r1.qty !== null && dCmp(r0.qty, r1.qty) === 0 && r0.amount !== null && r1.amount !== null) {
    const maxAmt = dAbs(r0.amount).v > dAbs(r1.amount).v ? dAbs(r0.amount) : dAbs(r1.amount);
    const m = dCmp(maxAmt, D(1)) > 0 ? maxAmt : D(1);
    if (dCmp(dDiv(dAbs(dSub(r0.amount, r1.amount)), m, 6), D('0.03')) <= 0) return 0.8;
  }
  return 0.0;
}

function collapseRepeatedCopies(doc, std) {
  if (!evEnabled(std, 'collapse_repeated_copies')) return [doc, null];
  const lines = doc.lines.slice();
  const sub = fdec(fval(fieldOf(doc, 'sub_total')));
  const n = lines.length;
  if (n < 2 || sub === null || dCmp(sub, D(0)) <= 0) return [doc, null];
  const tol = std.tol('total');
  const info = lines.map(l => {
    let q = fdec(fval((l.cells || {}).qty)), p = fdec(fval((l.cells || {}).unit_price));
    let a = fdec(fval((l.cells || {}).amount));
    if (a === null && q !== null && p !== null) a = dQuant(dMul(q, p), Q2D);
    return { qty: q, unit_price: p, amount: a, item_code: String(fval((l.cells || {}).item_code) || '').trim().toUpperCase(), desc: String(fval((l.cells || {}).description) || '').trim().toUpperCase(), line: l };
  });
  const amounts = info.map(r => r.amount);
  let total = null;
  if (!amounts.some(a => a === null)) {
    for (const a of amounts) total = dAdd(total, a);
    if (dCmp(dAbs(dSub(total, sub)), tol) <= 0) return [doc, null];
  } else { for (const a of amounts) if (a !== null) total = dAdd(total, a); }
  total = total === null ? D(0) : total;

  for (let k = n; k > 1; k--) {
    if (n % k) continue;
    const size = n / k;
    const blocks = [];
    for (let i = 0; i < k; i++) blocks.push(info.slice(i * size, (i + 1) * size));
    const b0 = blocks[0];
    let b0Sum = D(0);
    for (const r of b0) if (r.amount !== null) b0Sum = dAdd(b0Sum, r.amount);
    let allMatch = true;
    for (const b of blocks.slice(1)) {
      const sims = []; for (let i = 0; i < size; i++) sims.push(rowSimilarity(b0[i], b[i], tol));
      const blockSim = sims.reduce((x, y) => x + y, 0) / size;
      const matchedRows = sims.filter(s => s >= 0.7).length;
      if (size === 1) {
        if (blockSim < 0.9) { allMatch = false; break; }
        const words = (d) => new Set(String(d).match(/[0-9A-Za-z_\u0E00-\u0E7F]+/g) || []);
        const t0 = words(b0[0].desc), t1 = words(b[0].desc);
        if (t0.size && t1.size && ![...t0].some(x => t1.has(x))) { allMatch = false; break; }
      } else if (blockSim < 0.75 && (matchedRows / size) < 0.75) { allMatch = false; break; }
    }
    if (!allMatch) continue;
    const standardMatch = dCmp(dAbs(dSub(total, dMul(sub, D(k)))), dMul(tol, D(k))) <= 0 && dCmp(dAbs(dSub(b0Sum, sub)), tol) <= 0;
    const fuzzyStandard = dCmp(dAbs(dSub(b0Sum, sub)), tol) <= 0 &&
      dCmp(dAbs(dSub(total, dMul(sub, D(k)))), dCmp(dMul(tol, D(k)), dMul(sub, D('0.05'))) > 0 ? dMul(tol, D(k)) : dMul(sub, D('0.05'))) <= 0;
    const installmentMatch = dCmp(b0Sum, D(0)) > 0 &&
      dCmp(dAbs(dSub(total, dMul(D(k), b0Sum))), dCmp(dMul(tol, D(k)), dMul(b0Sum, D('0.05'))) > 0 ? dMul(tol, D(k)) : dMul(b0Sum, D('0.05'))) <= 0 &&
      dCmp(dAbs(dSub(total, sub)), tol) > 0;
    if (!(standardMatch || fuzzyStandard || installmentMatch)) continue;
    const keptLines = [];
    for (let i = 0; i < size; i++) {
      const cur = lines[i];
      let cells = Object.assign({}, cur.cells);
      for (const dup of blocks.slice(1)) {
        const dupLine = dup[i].line;
        for (const key of ['unit_price', 'qty', 'amount', 'uom', 'item_code']) {
          const cc = cells[key], dc = (dupLine.cells || {})[key];
          if ((cc === undefined || cc === null || !cc.ok || cc.value === null) && dc !== undefined && dc !== null && dc.ok && dc.value !== null) cells[key] = promote(dc, 'copy_page_reconciled');
        }
      }
      keptLines.push({ ...cur, cells });
    }
    const note = {
      copies: k, kept_line_nos: keptLines.map(l => l.line_no), dropped_line_nos: lines.slice(size).map(l => l.line_no),
      rule: (standardMatch || fuzzyStandard)
        ? 'k identical (qty, unit_price, amount) blocks and sum(amount) = k x sub_total'
        : 'k repeated blocks in installment invoice (sub_total != block_sum)'
    };
    return [{ ...doc, lines: keptLines }, note];
  }
  return [doc, null];
}

function collapseGhostRows(doc) {
  if (!doc.lines.length) return doc;
  const out = [];
  for (const l of doc.lines) {
    const q = fdec(fval((l.cells || {}).qty)), p = fdec(fval((l.cells || {}).unit_price)), a = fdec(fval((l.cells || {}).amount));
    if (q === null && p === null && a === null && out.length) {
      const prev = out[out.length - 1];
      const pf = (prev.cells || {}).description, cf = (l.cells || {}).description;
      const pd = pf ? (pf.raw || '') : '', cd = cf ? (cf.raw || '') : '';
      const combined = (pd + ' ' + cd).trim();
      if (pf !== undefined && pf !== null) {
        const cells = Object.assign({}, prev.cells);
        cells.description = { ...pf, raw: combined, value: combined };
        out[out.length - 1] = { ...prev, cells };
      }
    } else out.push(l);
  }
  return { ...doc, lines: out };
}

function corroborateArithmetic(doc, std) {
  if (!evEnabled(std, 'arithmetic')) return doc;
  const tolLine = std.tol('line_math'), tolTotal = std.tol('total'), tolVat = std.tol('vat'), rate = std.tol('vat_rate');
  let lines = [];
  for (let l of doc.lines) {
    const q = fdec(fval((l.cells || {}).qty)), p = fdec(fval((l.cells || {}).unit_price)), a = fdec(fval((l.cells || {}).amount));
    if (q !== null && p !== null && a !== null && dCmp(dAbs(dSub(dQuant(dMul(q, p), Q2D), a)), tolLine) <= 0 && dCmp(a, D(0)) !== 0) {
      const tag = 'arith:qty*unit_price=amount';
      l = withCells(l, { qty: promote((l.cells || {}).qty, tag), unit_price: promote((l.cells || {}).unit_price, tag), amount: promote((l.cells || {}).amount, tag) });
    } else if (p !== null && a !== null && dCmp(p, D(0)) > 0) {
      const target = dDiv(a, p, 3);
      const isInt = dCmp(target, dQuant(target, 0)) === 0;
      const cand = new Set([dStr(target), dToFixed(target, 2), dToFixed(target, 3)]);
      if (isInt) cand.add(dStr(dQuant(target, 0)));
      const rowRaw = Object.values(l.cells || {}).map(c => String((c && c.raw) || '')).join(' ').toUpperCase();
      const tokens = new Set((rowRaw.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g) || []).map(t => t.replace(/,/g, '')));
      if ([...cand].some(c => tokens.has(c))) {
        const fmtTarget = isInt ? dStr(dQuant(target, 0)) : dStr(target);
        const tag = 'arith:target_qty_found_in_row_tokens:' + fmtTarget;
        let qf = (l.cells || {}).qty;
        if (qf === undefined || qf === null) qf = nField('qty', l.element_id + '-qty', fmtTarget, dStr(target), 1.0, true);
        const newQ = { ...qf, value: dStr(D(fmtTarget)), ok: true, null_reason: null, evidence: (qf.evidence || []).concat([tag]) };
        const upd = { qty: newQ, unit_price: promote((l.cells || {}).unit_price, tag), amount: promote((l.cells || {}).amount, tag) };
        let newGroup = l.uom_group;
        for (const u of ['KGS', 'KG', 'กิโล', 'TON', 'ตัน', 'PCS', 'SET', 'BOX']) {
          if (hasWord(rowRaw, u)) {
            const grp = std.uomGroup(u);
            if (Object.keys(std.uom_groups).indexOf(String(grp)) >= 0) {
              newGroup = grp;
              let base = (l.cells || {}).uom;
              if (base === undefined || base === null) base = nField('uom', l.element_id + '-uom', u, grp, 1.0, true);
              upd.uom = { ...base, value: grp, ok: true, null_reason: null, evidence: (base.evidence || []).concat([tag]) };
              break;
            }
          }
        }
        l = { ...withCells(l, upd), uom_group: newGroup };
      }
    }
    lines.push(l);
  }
  const f = Object.assign({}, doc.fields);
  const sub = fdec(fval(f.sub_total)), vat = fdec(fval(f.vat)), grand = fdec(fval(f.grand_total));
  if (sub !== null && vat !== null && grand !== null && dCmp(sub, D(0)) > 0 &&
    dCmp(dAbs(dSub(dAdd(sub, vat), grand)), tolTotal) <= 0 &&
    dCmp(dAbs(dSub(dQuant(dMul(sub, rate), Q2D), vat)), tolVat) <= 0) {
    for (const k of ['sub_total', 'vat', 'grand_total']) f[k] = promote(f[k], 'arith:sub_total+vat=grand_total');
  }
  const amounts = lines.map(l => fdec(fval((l.cells || {}).amount)));
  if (lines.length && !amounts.some(a => a === null) && sub !== null && dCmp(sub, D(0)) > 0) {
    let s = D(0); for (const a of amounts) s = dAdd(s, a);
    if (dCmp(dAbs(dSub(s, sub)), tolTotal) <= 0) {
      f.sub_total = promote(f.sub_total, 'arith:sum(amount)=sub_total');
      lines = lines.map(l => withCells(l, { amount: promote((l.cells || {}).amount, 'arith:sum(amount)=sub_total') }));
    }
  }
  return rebuild(f === null ? doc : { ...doc, fields: f }, f, lines);
}

function normKeyAlnum(s) { return String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^\p{L}\p{N}]/gu, ''); }

function corroborateOracle(doc, snap, std) {
  if (!evEnabled(std, 'oracle') || snap === null || snap === undefined) return doc;
  const rows = OracleSession.active(snap);
  if (!rows.length) return doc;
  const f = Object.assign({}, doc.fields);
  const qk = snap.query_keys || {};
  const inv = fval(f.invoice_num);
  if (inv !== null) {
    const keys = new Set([normKeyAlnum(inv)].concat((qk.invoice_variants || []).map(normKeyAlnum)));
    const stored = new Set();
    for (const r of rows) for (const v of [r.shipment_num, r.packing_slip, r.waybill_num, (r.extra || {}).SHIPMENT_NUM, (r.extra || {}).PACKING_SLIP]) stored.add(normKeyAlnum(v));
    const byQuery = snap.lookup_path === 'RCV-V01' || snap.lookup_path === 'RCV-V02';
    let hit = false; for (const k of keys) if (stored.has(k) && k !== '') hit = true;
    if (byQuery || hit) f.invoice_num = promote(f.invoice_num, 'oracle:receipt_found_by_invoice_num');
  }
  const po = fval(f.po_number);
  if (po !== null) {
    const pos = new Set((snap.po_numbers || []).concat(rows.map(r => r.po_number).filter(x => x)).concat(rows.map(r => (r.extra || {}).PO_NUM).filter(x => x)));
    if (pos.has(String(po))) f.po_number = promote(f.po_number, 'oracle:po_on_receipt');
  }
  const sup = fval(f.supplier_tax_id), cur = f.supplier_tax_id;
  let promoted = false;
  if (sup !== null) {
    const sups = new Set(rows.map(r => r.supplier_tax_id).filter(x => x).map(String));
    if (qk.supplier_tax_id) sups.add(String(qk.supplier_tax_id));
    if (sups.has(String(sup))) { f.supplier_tax_id = promote(f.supplier_tax_id, 'oracle:supplier_tax_id'); promoted = true; }
  }
  const poTax = qk.supplier_tax_id_source === 'oracle_po' ? String(qk.supplier_tax_id || '') : '';
  const oracleCustStr = new Set(rows.map(r => r.customer_tax_id).filter(x => x).map(String));
  const equalCustomer = !(cur === undefined || cur === null) && cur.ok && oracleCustStr.has(String(cur.value));
  if (!promoted && /^\d{13}$/.test(poTax) && (cur === undefined || cur === null || !cur.ok || equalCustomer)) {
    const evd = (cur === undefined || cur === null ? [] : (cur.evidence || [])).concat(['oracle:supplier_tax_id_from_po']);
    f.supplier_tax_id = { name: 'supplier_tax_id', element_id: (cur && cur.element_id) || 'oracle-po', raw: poTax, value: poTax, confidence: null, ok: true, null_reason: null, evidence: evd };
  }
  const cust = fval(f.customer_tax_id);
  const ent = snap.org_id === null || snap.org_id === undefined ? null : (std.entities || {})[String(snap.org_id)];
  const oracleCust = new Set(rows.map(r => r.customer_tax_id).filter(x => x));
  if (ent && ent.tax_id) oracleCust.add(ent.tax_id);
  if (cust !== null && oracleCust.has(String(cust))) {
    f.customer_tax_id = promote(f.customer_tax_id, 'oracle:customer_tax_id');
    if (evEnabled(std, 'customer_identity_by_tax_id') && f.customer_tax_id.ok) {
      for (const k of ['customer_name', 'customer_address']) {
        const g = f[k];
        if (g !== undefined && g !== null && !g.ok) f[k] = promote(g, COVERED_TAG);
      }
    }
  }
  return { ...doc, fields: f };
}
function isCovered(field) { return !!(field && (field.evidence || []).indexOf(COVERED_TAG) >= 0); }

function corroborateLines(doc, groups, rows, std) {
  if (!evEnabled(std, 'oracle')) return doc;
  const byNo = {}; for (const l of doc.lines) byNo[l.line_no] = l;
  const tolLine = std.tol('line_math'), pExact = std.tol('price_exact');
  for (const g of groups) {
    if (g.relation === 'UNMATCHED' || !g.rcv_line_ids.length) continue;
    const rcv = g.rcv_line_ids.filter(i => i in rows).map(i => rows[i]);
    if (!rcv.length) continue;
    const rcvGroups = [...new Set(rcv.map(r => std.uomGroup(r.uom)))];
    const ids = g.rcv_line_ids.join(',');
    for (const n of g.invoice_line_nos) {
      let l = byNo[n];
      const cells = {};
      const u = (l.cells || {}).uom;
      if (rcvGroups.length === 1 && (u === undefined || u === null || !u.ok)) {
        const rg = rcvGroups[0];
        const rawGroup = (u !== undefined && u !== null && u.raw) ? std.uomGroup(u.raw) : null;
        const known = rawGroup !== null && Object.keys(std.uom_groups).indexOf(String(rawGroup)) >= 0;
        if (rawGroup === rg && PROMOTABLE.indexOf((u || {}).null_reason) >= 0) {
          cells.uom = { ...u, value: rg, ok: true, null_reason: null, evidence: (u.evidence || []).concat(['oracle:uom_equals_receipt']) };
        } else if (!known && evEnabled(std, 'uom_inherit_from_receipt')) {
          let base = u;
          if (base === undefined || base === null) base = nField('uom', l.element_id + '-uom', null, null, null, false, 'NOT_PRESENT');
          cells.uom = { ...base, value: rg, ok: true, null_reason: null, evidence: (base.evidence || []).concat(['inherited_from_receipt:' + ids]) };
        }
      }
      if (g.relation === '1:1' || g.relation === '1:N') {
        let rq = D(0), ra = D(0);
        for (const r of rcv) { rq = dAdd(rq, D(r.qty)); ra = dAdd(ra, D(r.line_amount)); }
        const prices = [...new Set(rcv.map(r => r.unit_price))];
        const p = fdec(fval((l.cells || {}).unit_price));
        if (p !== null && prices.length === 1 && dCmp(dAbs(dSub(p, D(prices[0]))), pExact) <= 0) cells.unit_price = promote((l.cells || {}).unit_price, 'oracle:po_price:' + ids);
        const q = fdec(fval((l.cells || {}).qty));
        if (q !== null && dCmp(q, rq) === 0) cells.qty = promote((l.cells || {}).qty, 'oracle:receipt_qty:' + ids);
        const a = fdec(fval((l.cells || {}).amount));
        if (a !== null && dCmp(dAbs(dSub(a, ra)), tolLine) <= 0) cells.amount = promote((l.cells || {}).amount, 'oracle:receipt_amount:' + ids);
      }
      l = withCells(l, cells);
      if (evEnabled(std, 'derive_qty_from_amount') && (g.relation === '1:1' || g.relation === '1:N') &&
        lineOk(l, 'unit_price') && lineOk(l, 'amount') && !lineOk(l, 'qty') && lineV(l, 'unit_price')) {
        let rq = D(0); for (const r of rcv) rq = dAdd(rq, D(r.qty));
        const derived = dDiv(D(lineV(l, 'amount')), D(lineV(l, 'unit_price')), 12);
        if (dCmp(dAbs(dSub(derived, rq)), D('0.001')) <= 0) {
          let qf = (l.cells || {}).qty;
          if (qf === undefined || qf === null) qf = nField('qty', l.element_id + '-qty', null, null, null, false, 'NOT_PRESENT');
          l = withCells(l, { qty: { ...qf, value: dStr(rq), ok: true, null_reason: null, evidence: (qf.evidence || []).concat(['derived:amount/unit_price=' + dStr(rq), 'oracle:receipt_qty:' + ids]) } });
        }
      }
      const uf = (l.cells || {}).uom;
      byNo[n] = { ...l, uom_group: (uf !== undefined && uf !== null && uf.ok) ? uf.value : l.uom_group };
    }
  }
  return { ...doc, lines: doc.lines.map(l => byNo[l.line_no]) };
}

function evidenceReport(doc) {
  const out = {};
  for (const [k, f] of Object.entries(doc.fields)) if ((f.evidence || []).length) out[k] = f.evidence.slice();
  for (const l of doc.lines) for (const [k, c] of Object.entries(l.cells || {})) if ((c.evidence || []).length) out['L' + l.line_no + '.' + k] = c.evidence.slice();
  return out;
}
function markUnusableKey(doc, name, reason) {
  const f = (doc.fields || {})[name];
  if (f === undefined || f === null) return doc;
  return { ...doc, fields: { ...doc.fields, [name]: { ...f, ok: false, null_reason: reason } } };
}
function adoptMatchedInvoiceKey(doc, snap, std) {
  if (!evEnabled(std, 'invoice_num_from_document_candidate') || snap === null || snap === undefined) return doc;
  if (!OracleSession.active(snap).length) return doc;
  const qk = snap.query_keys || {};
  const m = qk.invoice_key_matched;
  if (!m || qk.invoice_candidates_ambiguous) return doc;
  const f = (doc.fields || {}).invoice_num;
  const old = f === undefined || f === null ? null : f.raw;
  const pages = (m.pages || []).join(',');
  let tags = ['oracle:receipt_found_by_document_number:' + m.key, 'printed_on:' + (m.source || 'document') + ':pages ' + pages, 'replaced_read_value:' + old];
  if (m.match === 'suffix') tags = tags.concat(['ebs_stores:' + m.stored_in_ebs]);
  let base = f;
  if (base === undefined || base === null) base = nField('invoice_num', doc.document_id + '-f-invoice_num', null, null, null, false, 'NOT_PRESENT');
  return { ...doc, fields: { ...doc.fields, invoice_num: { ...base, raw: m.key, value: m.key, ok: true, null_reason: null, evidence: (base.evidence || []).concat(tags) } } };
}
function collapseDuplicateBlock(doc, snap, std) {
  if (!evEnabled(std, 'collapse_duplicate_block')) return [doc, null];
  const lines = doc.lines.slice(), n = lines.length;
  if (n < 4) return [doc, null];
  const sig = (l) => {
    const d = (l.cells || {}).description;
    const word = (d === undefined || d === null) ? '' : (String(d.raw || '').split(/\s+/).filter(Boolean)[0] || '').toUpperCase();
    return [fdec(fval((l.cells || {}).qty)), fdec(fval((l.cells || {}).unit_price)), fdec(fval((l.cells || {}).amount)), word];
  };
  const sigEq = (a, b) => a.length === b.length && a.every((x, i) => (x === null ? b[i] === null : (b[i] !== null && (typeof x === 'string' ? x === b[i] : dCmp(x, b[i]) === 0))));
  const sigs = lines.map(sig);
  const amounts = sigs.map(s => s[2]);
  if (amounts.some(a => a === null)) return [doc, null];
  let sub = fdec(fval(fieldOf(doc, 'sub_total')));
  let target = sub, basis = 'sub_total';
  if (target === null) {
    if (snap === null || snap === undefined || !OracleSession.active(snap).length) return [doc, null];
    let s = D(0); for (const r of OracleSession.active(snap)) s = dAdd(s, D(r.line_amount));
    target = s; basis = 'receipt_total';
  }
  const tol = std.tol('total');
  let total = D(0); for (const a of amounts) total = dAdd(total, a);
  if (dCmp(dAbs(dSub(total, target)), tol) <= 0) return [doc, null];
  const sumSlice = (arr) => { let s = D(0); for (const a of arr) s = dAdd(s, a); return s; };
  const blockEq = (A, B) => { if (A.length !== B.length) return false; for (let i = 0; i < A.length; i++) if (!sigEq(A[i], B[i])) return false; return true; };
  for (let m = Math.floor(n / 2); m > 1; m--) {
    const tail = sigs.slice(n - m);
    for (let i = 0; i + 2 * m <= n; i++) {
      if (blockEq(sigs.slice(i, i + m), tail) && dCmp(dAbs(dSub(sumSlice(amounts.slice(0, n - m)), target)), tol) <= 0) {
        return [{ ...doc, lines: lines.slice(0, n - m) }, {
          kept_line_nos: lines.slice(0, n - m).map(l => l.line_no), dropped_line_nos: lines.slice(n - m).map(l => l.line_no),
          same_as_line_nos: lines.slice(i, i + m).map(l => l.line_no), basis, target: dStr(target),
          rule: 'last rows repeat earlier rows (qty, price, amount, item code) and the rest closes'
        }];
      }
    }
    for (let i = 0; i + 2 * m <= n; i++) {
      const block = sigs.slice(i, i + m);
      for (let j = i + m; j + m <= n; j++) {
        if (blockEq(sigs.slice(j, j + m), block)) {
          const rem = amounts.slice(0, j).concat(amounts.slice(j + m));
          if (dCmp(dAbs(dSub(sumSlice(rem), target)), tol) <= 0) {
            return [{ ...doc, lines: lines.slice(0, j).concat(lines.slice(j + m)) }, {
              kept_line_nos: lines.slice(0, j).concat(lines.slice(j + m)).map(l => l.line_no),
              dropped_line_nos: lines.slice(j, j + m).map(l => l.line_no),
              same_as_line_nos: lines.slice(i, i + m).map(l => l.line_no), basis, target: dStr(target),
              rule: 'middle rows repeat earlier rows (qty, price, amount, item code) and the rest closes'
            }];
          }
        }
      }
    }
  }
  return [doc, null];
}
