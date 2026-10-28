// =================================================================================================
// src_assemble.js — application/assembler.py : the aiva.system_a.result/3.0 payload (+ summary view)
// =================================================================================================

const CONTRACT = 'aiva.system_a.result/3.0';
const SCHEMA_VERSION = '3.1';   // v5.7: additive evidence fields (kind, review rows, reason enum)
const SIGNATURE_SLOTS = ['receiver', 'deliverer'];
const MISSING_REASONS = ['PAGES_INCOMPLETE', 'NOT_PRESENT', 'LOW_CONFIDENCE', 'NOT_LOCATED', 'NO_ELEMENT'];  // priority
const COORDINATE_SYSTEM = { origin: 'top-left', unit: 'normalized', range: [0, 1], bbox_format: '[x, y, w, h]', reference: 'rendered page after rotation correction (see pages[].rotation)' };
const SUMMARY_VERSION = '1.1';
const _s = (v) => v;                                // Decimals are already strings in this port

function isValidBbox(b) {
  return !!(b && b.length === 4 && b.every(v => v !== null && v !== undefined) && Number(b[2]) > 0 && Number(b[3]) > 0);
}

function buildElements(ext, doc) {
  const did = ext.invoice_document_id;
  const dtype = (ext.documents.find(d => d.document_id === did) || { document_type: 'INVOICE' }).document_type;
  const els = {};
  const src = { package_id: ext.package_id, dms_doc_id: ext.dms_doc_id, file_sha256: ext.file_sha256, extractors: ext.extractor };
  const add = (eid, etype, page, bbox, opts) => {
    const o = opts || {};
    const validB = isValidBbox(bbox) ? bbox.slice() : null;
    const validR = (o.rbox && o.rbox.length === 5) ? o.rbox.slice() : null;
    const el = {
      element_id: eid, document_id: did, document_type: dtype, page_no: page, element_type: etype,
      parent_id: o.parent === undefined ? null : o.parent, field_name: o.fieldName === undefined ? null : o.fieldName,
      raw_value: o.raw === undefined ? null : o.raw, normalized_value: o.norm === undefined ? null : o.norm,
      confidence: o.conf === undefined ? null : o.conf, bbox: validB,
      source_reference: Object.assign({}, src, o.extra || {})
    };
    if (validR !== null) el.rbox = validR;
    els[eid] = el;
  };
  for (const p of ext.pages) {
    const docOf = ext.documents.find(d => d.pages.indexOf(p.page_no) >= 0) || null;
    els['P' + p.page_no] = {
      element_id: 'P' + p.page_no, document_id: docOf ? docOf.document_id : null,
      document_type: docOf ? docOf.document_type : 'UNKNOWN', page_no: p.page_no, element_type: 'page',
      parent_id: null, field_name: null, raw_value: null, normalized_value: null, confidence: p.type_confidence,
      bbox: pyInts(0, 0, 1, 1), source_reference: src
    };
  }
  for (const [name, rf] of Object.entries(ext.fields)) {
    const nf = doc.fields[name];
    add(nf.element_id, 'field', rf.region ? rf.region.page : null, rf.region ? rf.region.bbox : null, {
      fieldName: name, raw: rf.raw, norm: nf.value, conf: rf.confidence,
      extra: { word_ids: (rf.word_ids || []).slice(), null_reason: nf.null_reason, agreement: rf.agreement, source: rf.source },
      rbox: rf.region ? rf.region.rbox : null
    });
  }
  // python iterates zip(ext.lines, doc.lines) (assembler.py:67).  It has to: collapse_ghost_rows /
  // collapse_repeated_copies fold doc.lines DOWN (orchestrator.py:65-66), so a description-only continuation
  // row leaves ext.lines with an entry that has no normalized partner.  Iterating ext.lines.length used to
  // read doc.lines[i] past the end -> "Cannot read properties of undefined (reading 'element_id')" on the
  // first document that had a ghost row.  The folded rows simply get no element, exactly like python.
  const nPairs = Math.min(ext.lines.length, doc.lines.length);
  for (let i = 0; i < nPairs; i++) {
    const rl = ext.lines[i], nl = doc.lines[i];
    add(nl.element_id, 'row', rl.region ? rl.region.page : null, rl.region ? rl.region.bbox : null, { fieldName: 'lines[' + rl.line_no + ']', rbox: rl.region ? rl.region.rbox : null });
    for (const [k, rf] of Object.entries(rl.cells)) {
      const nf = nl.cells[k];
      add(nf.element_id, 'cell', rf.region ? rf.region.page : (rl.region ? rl.region.page : null), rf.region ? rf.region.bbox : null, {
        fieldName: 'lines[' + rl.line_no + '].' + k, raw: rf.raw, norm: nf.value, conf: rf.confidence,
        parent: nl.element_id, extra: { null_reason: nf.null_reason, agreement: rf.agreement },
        rbox: rf.region ? rf.region.rbox : null
      });
    }
  }
  // v5.7 (R6): a cell (or row) the normalizer created without a reader value still gets an element, so
  // evidence can name it and say why it has no box, instead of pointing at an unknown id.
  for (const nl of doc.lines) {
    if (els[nl.element_id] === undefined) {
      add(nl.element_id, 'row', nl.region ? nl.region.page : null, nl.region ? nl.region.bbox : null,
        { fieldName: 'lines[' + nl.line_no + ']', extra: { null_reason: 'NOT_PRESENT' } });
    }
    const rowPage = els[nl.element_id].page_no;
    for (const [k, nf] of Object.entries(nl.cells)) {
      if (els[nf.element_id] === undefined) {
        add(nf.element_id, 'cell', rowPage, null, {
          fieldName: 'lines[' + nl.line_no + '].' + k, raw: nf.raw === undefined ? null : nf.raw, norm: nf.value,
          conf: nf.confidence, parent: nl.element_id,
          extra: { null_reason: nf.null_reason || 'NOT_PRESENT' }
        });
      }
    }
  }
  // v5.6: the final slot decision (after the stamp fallbacks in normalize) is what V-06 judged - emit
  // that one, so the Portal picture and the rule can never disagree.
  const sigs = Object.assign({}, ext.signatures, doc.signatures);
  for (const [slot, s] of Object.entries(sigs)) {
    add(did + '-sig-' + slot, 'signature', s.region ? s.region.page : null, s.region ? s.region.bbox : null, {
      fieldName: 'signatures.' + slot, raw: s.present === true ? 'signed' : (s.present === false ? 'empty' : null),
      norm: typeof s.present === 'boolean' ? s.present : null, conf: s.confidence,
      extra: Object.assign({ kind: s.kind === undefined ? null : s.kind }, s.region ? {} : { null_reason: 'NOT_LOCATED' }),
      rbox: s.region ? s.region.rbox : null
    });
  }
  // v5.7 (R10): every slot V-06 judges has an element, so an E08 for a slot the reader never boxed still
  // points at something the Portal can name ("no box found") instead of nothing.
  for (const slot of SIGNATURE_SLOTS) {
    if (sigs[slot] === undefined) {
      add(did + '-sig-' + slot, 'signature', null, null,
        { fieldName: 'signatures.' + slot, extra: { kind: null, null_reason: 'NOT_PRESENT' } });
    }
  }
  for (const w of ext.words || []) add(w.word_id, 'word', w.page, w.bbox, { raw: w.text, norm: w.text, conf: w.confidence });
  const kindMap = { section: 'section', table: 'table', stamp: 'stamp' };
  for (const rg of ext.regions || []) {
    const owner = ext.documents.find(d => d.pages.indexOf(rg.page) >= 0) || null;
    const validB = isValidBbox(rg.bbox) ? rg.bbox.slice() : null;
    const validR = (rg.rbox && rg.rbox.length === 5) ? rg.rbox.slice() : null;
    const el = {
      element_id: rg.region_id, document_id: owner ? owner.document_id : did, document_type: owner ? owner.document_type : dtype,
      page_no: rg.page, element_type: kindMap[rg.kind] || 'section', parent_id: rg.parent_id || ('P' + rg.page),
      field_name: rg.label, raw_value: rg.text, normalized_value: null, confidence: rg.confidence, bbox: validB,
      source_reference: Object.assign({}, src, { region_kind: rg.kind })
    };
    if (validR !== null) el.rbox = validR;
    els[rg.region_id] = el;
  }
  return els;
}

function normalizedItems(doc, els, ctx, outcomes, snap) {
  const groups = {};
  for (const g of (ctx.groups || [])) for (const n of g.invoice_line_nos) groups[n] = g;
  const v08 = {};
  for (const o of outcomes) if (o.rule_id === 'V-08') for (const lr of ((o.data || {}).line_results || [])) if (lr && lr.invoice_line_no !== null && lr.invoice_line_no !== undefined) v08[lr.invoice_line_no] = lr;
  const rcv = {};
  for (const r of (snap === null || snap === undefined ? [] : snap.rows)) rcv[r.rcv_line_id] = r;
  const out = [];
  for (const ln of doc.lines) {
    const cell = k => (ln.cells || {})[k];
    const val = k => { const c = cell(k); return (c !== undefined && c !== null && c.ok) ? c.value : null; };
    const q = val('qty'), p = val('unit_price'), a = val('amount');
    let math = null;
    if (q !== null && p !== null && a !== null) {
      const qp = dQuant(dMul(D(q), D(p)), 2);
      const diff = dQuant(dSub(dMul(D(q), D(p)), D(a)), 2);
      math = { qty_x_unit_price: dStr(qp), amount: a, diff: dStr(diff), ok: dCmp(dAbs(D(dStr(diff))), D('0.50')) <= 0 };
    }
    const g = groups[ln.line_no];
    const row = els[ln.element_id] || {};
    const cellsOk = {}, cellsNull = {};
    for (const [k, c] of Object.entries(ln.cells || {})) { cellsOk[k] = c.ok; if (!c.ok) cellsNull[k] = c.null_reason; }
    out.push({
      line_no: ln.line_no, element_id: ln.element_id, page_no: row.page_no === undefined ? null : row.page_no,
      bbox: row.bbox === undefined ? null : row.bbox,
      item_code: val('item_code'), description: val('description'), qty: val('qty'), uom: val('uom'),
      uom_group: ln.uom_group, unit_price: val('unit_price'), amount: val('amount'),
      cells_ok: cellsOk, cells_null_reason: cellsNull, line_math: math,
      match: !g ? null : {
        group_id: g.group_id, relation: g.relation, level: g.level, confidence: g.confidence,
        rcv_line_ids: g.rcv_line_ids.slice(),
        receipt: g.rcv_line_ids.filter(id => id in rcv).map(rid => ({ rcv_line_id: rid, item: rcv[rid].item, qty: rcv[rid].qty, uom: rcv[rid].uom, unit_price: rcv[rid].unit_price, po_number: rcv[rid].po_number }))
      },
      qty_check: !(ln.line_no in v08) ? null : Object.fromEntries(['result', 'code', 'qty_inv', 'qty_rcv_compared', 'qty_diff'].map(k => [k, v08[ln.line_no][k] === undefined ? null : v08[ln.line_no][k]]))
    });
  }
  return out;
}

function itemsSummary(items, doc) {
  const usable = items.filter(i => ['qty', 'uom', 'unit_price', 'amount'].filter(k => k in i.cells_ok).every(k => i.cells_ok[k]));
  const amounts = items.filter(i => i.amount !== null).map(i => D(i.amount));
  let total = D(0); for (const a of amounts) total = dAdd(total, a);
  const sub = docV(doc, 'sub_total');
  return {
    line_count: items.length, lines_usable: usable.length,
    lines_math_ok: items.filter(i => (i.line_math || {}).ok).length,
    lines_matched: items.filter(i => i.match && i.match.relation !== 'UNMATCHED').length,
    sum_amount: amounts.length ? dStr(dQuant(total, 2)) : null,
    sub_total: sub,
    sum_vs_sub_total_diff: (amounts.length && sub !== null && sub !== undefined) ? dStr(dQuant(dSub(total, D(sub)), 2)) : null
  };
}

function multiPoKeys(snap) {
  const out = {};
  if ((snap.po_numbers || []).length) out.po_numbers = snap.po_numbers.map(String);
  if (snap.matched_on_column) out.matched_on_column = snap.matched_on_column;
  return out;
}

// ---------------------------------------------------------------- v5.7 evidence location (assembler.py)
function elementReason(e) {                          // R4: why one related element has no box
  if (e === undefined || e === null) return 'NO_ELEMENT';
  const nr = String(((e.source_reference || {}).null_reason) || '');
  if (nr === 'NOT_PRESENT' || (e.raw_value === null && e.normalized_value === null && e.element_type !== 'row')) return 'NOT_PRESENT';
  if (nr === 'LOW_CONFIDENCE') return 'LOW_CONFIDENCE';
  return 'NOT_LOCATED';
}

// R3: a row is either located (bboxes) or explained (bbox_missing_reason); a finding that names no
// element is explained by its own missing_reason (or NOT_LOCATED).  R6: ids without an element are
// reported only inside the reason, never in related_element_ids.
function locate(f, els) {
  const related = [], boxes = [], why = {};
  for (const eid of (f.element_ids || [])) {
    const e = els[eid];
    if (e !== undefined && e !== null) related.push(eid);
    if (e !== undefined && e !== null && e.bbox) boxes.push({ element_id: eid, page_no: e.page_no, bbox: e.bbox });
    else why[eid] = elementReason(e);
  }
  const own = f.missing_reason === undefined ? null : f.missing_reason;
  if (boxes.length && !Object.keys(why).length) return { related, boxes, missing: null };
  const reasons = Object.values(why).concat(own ? [own] : []);
  const reason = MISSING_REASONS.filter(r => reasons.indexOf(r) >= 0)[0] || 'NOT_LOCATED';
  const out = { element_ids: Object.keys(why), reason };
  if (new Set(Object.values(why)).size > 1) out.details = why;
  return { related, boxes, missing: out };
}

// field_name / line_no of the first related element - display help for the Portal (schema 3.1)
function hints(related, els) {
  for (const eid of related) {
    const e = els[eid] || {};
    const fn = e.field_name;
    if (!fn) continue;
    if (fn.indexOf('lines[') === 0) {
      const inner = fn.slice(6, fn.indexOf(']'));
      const no = parseInt(inner, 10);
      return { field_name: fn, line_no: isNaN(no) ? null : no };
    }
    return { field_name: fn, line_no: null };
  }
  return { field_name: null, line_no: null };
}

function assemble(o) {
  const { ext, doc, meta, std, ctx, outcomes, recommendation, halted, errors, request, models, metrics } = o;
  const now = new Date().toISOString();
  const els = buildElements(ext, doc);
  const evidence = [], exceptions = [], ruleResults = [];
  let n = 0;
  for (const out of outcomes) {
    const evIds = [];
    // findings (with an exception code) first, then review points (manual_review, no code)
    let reviews = (out.reviews || []).slice();
    if (out.result === 'manual_review' && !out.findings.length && !reviews.length) {
      // R7 safety net: a manual_review produced outside a rule (orchestrator gate) still gets a row
      const fb = out.detail === undefined || out.detail === null || out.detail === '';
      reviews = [{ message_th: fb ? out.rule_id + ': ต้องตรวจโดยคน' : out.detail,
        element_ids: [], oracle_refs: [], actual: null, expected: null,
        missing_reason: 'NOT_LOCATED', is_review: true }];
    }
    const rows = out.findings.map(f => [f, false]).concat(reviews.map(r => [r, true]));
    for (const [f, isReview] of rows) {
      n += 1;
      const xid = 'X' + n;
      const loc = locate(f, els);
      const h = hints(loc.related, els);
      evidence.push({
        evidence_id: xid, rule_id: out.rule_id, rule_version: std.ruleVersion(out.rule_id),
        result: isReview ? 'manual_review' : out.result,
        exception_code: isReview ? null : f.code, severity: isReview ? null : f.severity,
        actual_value: f.actual === undefined ? null : f.actual, expected_value: f.expected === undefined ? null : f.expected,
        source_document: { document_id: doc.document_id, source: isReview ? null : (f.source === undefined ? null : f.source) },
        page_no: sortedNum([...new Set(loc.boxes.map(b => b.page_no))]),
        related_element_ids: loc.related, related_oracle_refs: (f.oracle_refs || []).slice(),
        bboxes: loc.boxes, bbox_missing_reason: loc.missing,
        halted_by: out.halted_by, evaluated_at: now, message_th: f.message_th,
        kind: isReview ? 'review' : 'exception', field_name: h.field_name, line_no: h.line_no
      });
      if (!isReview) {
        exceptions.push({ exception_id: xid, code: f.code, name: std.codeName(f.code), severity: f.severity, rule_id: out.rule_id, evidence_ids: [xid] });
      }
      evIds.push(xid);
    }
    ruleResults.push({
      rule_id: out.rule_id, rule_version: std.ruleVersion(out.rule_id), result: out.result, detail: out.detail === undefined ? null : out.detail,
      halted_by: out.halted_by === undefined ? null : out.halted_by, evidence_ids: evIds, data: out.data || {}
    });
  }
  const snap = ctx.snapshot;
  const items = normalizedItems(doc, els, ctx, outcomes, snap);
  const active = snap === null ? [] : OracleSession.active(snap);
  const payload = {
    contract: CONTRACT,
    request: Object.assign({}, request, { completed_at: now }),
    versions: {
      schema: SCHEMA_VERSION, standard: std.version, ruleset: std.ruleset, models,
      prompts: { 'V-08': (std.rules['V-08'] || {}).prompt || null, 'V-07': 'v07-match@1.0.0', 'V-05': 'v05-entity@1.0.0' }
    },
    package: {
      package_id: ext.package_id, dms_doc_id: ext.dms_doc_id, file_sha256: ext.file_sha256,
      page_count: ext.pages.length, pages_complete: ext.pages_complete, coordinate_system: COORDINATE_SYSTEM
    },
    pages: ext.pages.map(p => ({
      page_no: p.page_no, width_pt: p.width_pt, height_pt: p.height_pt, rotation: p.rotation,
      render_dpi: p.render_dpi, page_type: p.page_type, type_confidence: p.type_confidence === undefined ? null : p.type_confidence,
      ocr_quality: p.ocr_quality === undefined ? null : p.ocr_quality
    })),
    documents: ext.documents.map(d => ({ document_id: d.document_id, document_type: d.document_type, pages: d.pages.slice(), confidence: d.confidence === undefined ? null : d.confidence })),
    ocr: { elements: Object.values(els) },
    extraction: {
      invoice_document_id: ext.invoice_document_id,
      fields: Object.fromEntries(Object.entries(doc.fields).map(([k, f]) => [k, { raw_value: f.raw === undefined ? null : f.raw, normalized_value: f.value, confidence: f.confidence, ok: f.ok, null_reason: f.null_reason, element_id: f.element_id }])),
      lines: doc.lines.map(l => ({
        line_no: l.line_no, element_id: l.element_id, uom_group: l.uom_group,
        cells: Object.fromEntries(Object.entries(l.cells).map(([k, c]) => [k, { raw_value: c.raw === undefined ? null : c.raw, normalized_value: c.value, ok: c.ok, null_reason: c.null_reason }]))
      })),
      signatures: Object.fromEntries(Object.entries(ext.signatures).map(([k, v]) => [k, { present: v.present, confidence: v.confidence === undefined ? null : v.confidence, kind: v.kind === undefined ? null : v.kind, region: v.region === undefined ? null : v.region }])),
      extra: ext.extra
    },
    normalized_fields: Object.assign(Object.fromEntries(Object.entries(doc.fields).map(([k, f]) => [k, f.value])),
      { release_num: meta.release_num === undefined ? null : meta.release_num, items, items_summary: itemsSummary(items, doc) }),
    oracle_snapshot: snap === null ? null : Object.assign({
      queried: true, queried_at: snap.queried_at, lookup_path: snap.lookup_path, query_keys: snap.query_keys,
      row_cap_hit: snap.row_cap_hit, fingerprint: OracleSession.fingerprint(snap),
      org_id: active.length ? active[0].org_id : null,
      receiver: active.length ? active[0].receiver : null,
      receipt_nums: OracleSession.receiptNums(snap),
      receipt_lines: snap.rows.map(r => Object.assign({}, rowPayload(r), { rcv_line_id: r.rcv_line_id, uom_group: std.uomGroup(r.uom) }))
    }, multiPoKeys(snap)),
    line_matching: {
      groups: (ctx.groups || []).map(g => Object.assign({}, g)),
      ai_rejected: (ctx.match_trace || {}).ai_rejected || [],
      unmatched_rcv_line_ids: (ctx.match_trace || {}).unmatched_rcv_line_ids || []
    },
    rule_results: ruleResults, evidence, exceptions,
    recommendation: Object.assign({}, recommendation, { halted_by: halted }),
    system_errors: errors, metrics
  };
  let summary;
  try { summary = buildSummary(payload, doc, meta); }
  catch (e) { summary = { summary_version: SUMMARY_VERSION, error: (e.name || 'Error') + ': ' + String(e.message).slice(0, 160) }; }
  const final = Object.assign({ summary }, payload);
  // engine assembler.py:278 — payload["metrics"] = {**metrics, "evidence_violations": enforce_evidence(payload)}
  // Same place (after assembly), same key, same rules (src_evidence_check.js). metrics is outside the payload
  // hash (`stable` below and integrity.excludes), so this can never move payload_sha256.
  final.metrics = Object.assign({}, final.metrics, { evidence_violations: checkEvidence(final) });
  const stable = {};
  for (const k of Object.keys(final)) if (['request', 'metrics', 'summary'].indexOf(k) < 0) stable[k] = final[k];
  return {
    payload: Object.assign({}, final, {
      integrity: {
        payload_sha256: 'sha256:' + sha256hex(canonicalJson(stripTimes(stable))),
        excludes: ['request', 'metrics', 'summary', '*evaluated_at', '*queried_at']
      }
    }),
    hashBody: canonicalJson(stripTimes(stable))
  };
}

// ---------------------------------------------------------------- one-page summary (assembler.py)
const HEADER_FIELDS = ['invoice_num', 'invoice_date', 'supplier_name', 'supplier_tax_id', 'customer_name', 'customer_tax_id', 'currency', 'sub_total', 'vat', 'grand_total'];
const MONEY_KEYS = { sub_total: 1, vat: 1, grand_total: 1 };
function num(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && typeof v.v === 'bigint') return v;   // already a Decimal (python _num(Decimal) passthrough)
  if (String(v).trim() === '') return null;
  const d = D(String(v).replace(/,/g, ''));
  return (d === null || d.nan) ? null : d;
}
function m(v) {
  const d = num(v);
  if (d === null) return null;
  const q = dQuant(d, 2);
  return dCmp(d, q) === 0 ? dStr(q) : dNorm(d);
}

function buildSummary(payload, doc, meta) {
  const ext = payload.extraction, rec = payload.recommendation;
  const snap = payload.oracle_snapshot || {};
  const rows = {};
  for (const r of (snap.receipt_lines || [])) rows[r.rcv_line_id] = r;
  const activeRows = Object.fromEntries(Object.entries(rows).filter(([, r]) => { const q = num(r.qty); return q !== null && dCmp(q, D(0)) > 0; }));
  const groups = {};
  for (const g of ((payload.line_matching || {}).groups || [])) for (const n of (g.invoice_line_nos || [])) groups[n] = g;
  const byLine = {};
  for (const e of payload.evidence) {
    for (const eid of (e.related_element_ids || [])) {
      const parts = String(eid).split('-L');
      if (parts.length === 2 && /^[0-9]+$/.test(parts[1].split('-')[0]) && e.exception_code) {
        const k = parseInt(parts[1].split('-')[0], 10);
        byLine[k] = byLine[k] || new Set(); byLine[k].add(e.exception_code);
      }
    }
  }
  const fields = ext.fields;
  const rr = Object.fromEntries(payload.rule_results.map(r => [r.rule_id, r]));
  const corroborated = (((rr['V-01'] || {}).data || {}).corroborated) || {};
  const waived = {};
  for (const w of (((rr['V-07'] || {}).data || {}).e11_waived) || []) waived[w.invoice_line_no] = w;

  const inv = {};
  for (const k of HEADER_FIELDS) {
    const f = fields[k] || {};
    let v = f.normalized_value !== null && f.normalized_value !== undefined ? f.normalized_value : (f.raw_value === undefined ? null : f.raw_value);
    if (k === 'currency' && (v === null || v === undefined)) v = 'THB';
    inv[k] = MONEY_KEYS[k] ? m(v) : v;
  }
  const poOf = (r) => r.po_number || ((r.extra || {}).PO_NUM);
  const rcvPos = sortedStr([...new Set(Object.values(activeRows).map(poOf).filter(x => x !== null && x !== undefined))]);
  const printed = (meta.po_numbers || []).slice();
  inv.po_numbers = rcvPos.length ? sortedStr([...new Set(printed.concat(rcvPos))]) : printed;
  inv.po_numbers_printed = printed;

  const rc = {};
  for (const r of Object.values(activeRows)) {
    const key = String(poOf(r)) + '\u0000' + r.receipt_num;
    if (!rc[key]) rc[key] = { po_number: poOf(r), receipt_num: r.receipt_num, lines: 0, receipt_total: D(0) };
    rc[key].lines += 1;
    rc[key].receipt_total = dAdd(rc[key].receipt_total, num(r.line_amount) || D(0));
  }
  const receipts = Object.values(rc).map(v => ({ po_number: v.po_number, receipt_num: v.receipt_num, lines: v.lines, receipt_total: m(v.receipt_total) }));
  receipts.sort((a, b) => (String(a.po_number) < String(b.po_number) ? -1 : String(a.po_number) > String(b.po_number) ? 1 : (a.receipt_num < b.receipt_num ? -1 : a.receipt_num > b.receipt_num ? 1 : 0)));
  let rcvTotal = D(0);
  for (const r of Object.values(activeRows)) rcvTotal = dAdd(rcvTotal, num(r.line_amount) || D(0));

  const poLines = {};
  for (const ln of doc.lines) poLines[ln.line_no] = ln.po_refs;
  const lines = [], perPo = {};
  for (const it of payload.normalized_fields.items) {
    const n = it.line_no;
    const g = groups[n] || {};
    const rl = (g.rcv_line_ids || []).filter(i => i in rows).map(i => rows[i]);
    const pos = sortedStr([...new Set(rl.map(poOf).filter(x => x !== null && x !== undefined))]);
    const po = pos.length === 1 ? pos[0] : (pos.length ? pos : null);
    const prList = poLines[n] || [];
    const pr = prList.filter(p => rcvPos.indexOf(p) >= 0)[0] || (prList.length ? prList[0] : null);
    const codes = sortedStr([...(byLine[n] || [])]);
    const qc = (it.qty_check || {}).result;
    const matched = !!(g && Object.keys(g).length) && g.relation !== 'UNMATCHED';
    const result = matched && !codes.length && (qc === undefined || qc === null || qc === 'pass') ? 'pass' : (!matched ? 'unmatched' : 'check');
    const amt = num(it.amount);
    if (typeof po === 'string' && amt !== null && g.relation !== 'N:1') perPo[po] = dAdd(perPo[po] === undefined ? null : perPo[po], amt);
    const rcvNums = sortedStr([...new Set(rl.map(r => r.receipt_num))]);
    const line = {
      line_no: n, po_number: po, po_printed: pr,
      receipt_num: rcvNums.length === 1 ? rcvNums[0] : (rcvNums.length ? rcvNums : null),
      rcv_line_ids: rl.map(r => r.rcv_line_id),
      item_code: (rl.filter(r => r.item_code).length ? rl.filter(r => r.item_code)[0].item_code : it.item_code),
      description: it.description,
      invoice_qty: m(it.qty), uom: it.uom_group || it.uom,
      invoice_price: m(it.unit_price), invoice_amount: m(it.amount),
      receipt_qty: rl.length ? m(rl.map(r => num(r.qty) || D(0)).reduce((x, y) => dAdd(x, y), D(0))) : null,
      receipt_uom: rl.length ? (rl[0].uom_group === undefined ? null : rl[0].uom_group) : null,
      receipt_price: (rl.length && new Set(rl.map(r => String(r.unit_price))).size === 1) ? m(rl[0].unit_price) : null,
      receipt_amount: rl.length ? m(rl.map(r => num(r.line_amount) || D(0)).reduce((x, y) => dAdd(x, y), D(0))) : null,
      match_level: g.level === undefined ? null : g.level, relation: g.relation === undefined ? null : g.relation,
      result, codes,
      unreadable: sortedStr(Object.entries(it.cells_ok || {}).filter(([, ok]) => !ok).map(([k]) => k))
    };
    if (n in waived) line.note = 'E11 waived: price/qty/amount/uom equal receipt';
    lines.push(line);
  }

  const rcPo = {};
  for (const r of Object.values(activeRows)) {
    const p = poOf(r);
    rcPo[p] = dAdd(rcPo[p] === undefined ? null : rcPo[p], num(r.line_amount) || D(0));
  }
  const breakdown = sortedStr([...new Set(Object.keys(rcPo).concat(Object.keys(perPo)))], x => String(x === null ? 'null' : x)).map(p => {
    const ia = perPo[p], ra = rcPo[p];
    return {
      po_number: p === 'null' ? null : p, invoice_lines: lines.filter(l => String(l.po_number) === p).length,
      invoice_amount: ia === undefined ? null : m(ia), receipt_amount: ra === undefined ? null : m(ra),
      diff: (ia !== undefined && ra !== undefined) ? m(dAdd(ia, dNeg(ra))) : null
    };
  });

  const sub = num((fields.sub_total || {}).normalized_value);
  const receipt = {
    found: Object.keys(activeRows).length > 0, lookup_path: snap.lookup_path === undefined ? null : snap.lookup_path,
    org_id: snap.org_id === undefined ? null : snap.org_id,
    ou_name: (Object.values(activeRows).filter(r => r.ou_name).length ? Object.values(activeRows).filter(r => r.ou_name)[0].ou_name : null),
    receiver: snap.receiver === undefined ? null : snap.receiver,
    receipts,
    receipt_total: Object.keys(activeRows).length ? m(rcvTotal) : null,
    invoice_vs_receipt_diff: (Object.keys(activeRows).length && sub !== null) ? m(dAdd(sub, dNeg(rcvTotal))) : null,
    lines_matched: lines.filter(l => l.relation !== null && l.relation !== 'UNMATCHED').length + '/' + lines.length
  };
  const nar = (snap.query_keys || {}).po_list_narrowing;
  if (nar) receipt.narrowing = nar;
  return {
    summary_version: SUMMARY_VERSION,
    dms_doc_id: payload.package.dms_doc_id,
    decision: {
      status: rec.value, max_severity: rec.max_severity, exception_codes: rec.exception_codes,
      halted_by: rec.halted_by === undefined ? null : rec.halted_by,
      needs_manual_review: (rec.reasons || []).filter(r => String(r).indexOf('manual_review') >= 0),
      multi_po: rcvPos.length > 1
    },
    invoice: inv, receipt, po_breakdown: breakdown, lines,
    rules: Object.entries(rr).map(([k, v]) => ({ rule_id: k, result: v.result, codes: sortedStr([...new Set(payload.evidence.filter(e => e.rule_id === k && e.exception_code).map(e => e.exception_code))]), detail: v.detail === undefined ? null : v.detail })),
    exceptions: payload.evidence.filter(e => e.exception_code).map(e => ({ code: e.exception_code, severity: e.severity, rule_id: e.rule_id, message: e.message_th })),
    review_points: payload.evidence.filter(e => e.kind === 'review').map(e => ({ rule_id: e.rule_id, message: e.message_th })),
    unreadable_fields: sortedStr(Object.entries(fields).filter(([, f]) => !f.ok).map(([k]) => k)),
    corroborated
  };
}

function recommend(outcomes, systemErrors) {
  const RANK = { Low: 1, Medium: 2, High: 3 };
  const findings = outcomes.flatMap(o => o.findings || []);
  let sev = 0;
  for (const f of findings) sev = Math.max(sev, RANK[f.severity] || 0);
  let reasons = sortedStr([...new Set(findings.map(f => f.code + ':' + f.severity))]);
  let value;
  if (systemErrors.length) { value = 'SYSTEM_ERROR'; reasons = systemErrors.map(e => e.code).concat(reasons); }
  else if (outcomes.some(o => o.result === 'manual_review')) {
    value = 'MANUAL_REVIEW';
    reasons = outcomes.filter(o => o.result === 'manual_review').map(o => o.rule_id + ':manual_review').concat(reasons);
  } else if (sev === 3) value = 'HOLD';
  else if (sev === 2) value = 'REVIEW';
  else if (outcomes.some(o => o.result === 'not_evaluated' && !o.halted_by)) { value = 'MANUAL_REVIEW'; reasons = reasons.concat(['not_evaluated_without_cause']); }
  else value = 'AUTO_PASS';
  return { value, max_severity: { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High' }[sev], exception_codes: sortedStr([...new Set(findings.map(f => f.code))]), reasons };
}
