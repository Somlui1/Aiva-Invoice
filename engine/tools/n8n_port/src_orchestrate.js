// =================================================================================================
// src_orchestrate.js — application/orchestrator.py : the whole pipeline (STEP 1-3), plus the n8n entry point.
// =================================================================================================

function lookupKey(doc, name) {
  const f = (doc.fields || {})[name];
  if (f === undefined || f === null) return null;
  return (f.ok || PROMOTABLE.indexOf(f.null_reason) >= 0) ? f.value : null;
}

async function validate(ext, svc) {
  const std = svc.std, errors = [], timings = {};
  // One transport in, three services out - the same shape container.build_services() gives python.
  const built = svc.ai ? buildAiServices(std, svc.ai) : null;
  const lineAi = built ? built.lineAi : (svc.lineAi === undefined ? null : svc.lineAi);
  const entityAi = built ? built.entityAi : (svc.entityAi === undefined ? null : svc.entityAi);
  const qtyAi = built ? built.qtyAi : (svc.qtyAi === undefined ? null : svc.qtyAi);
  let doc, meta;
  [doc, meta] = normalizeDocument(ext, std);
  doc = collapseGhostRows(doc);
  let copies;
  [doc, copies] = collapseRepeatedCopies(doc, std);
  doc = corroborateArithmetic(doc, std);

  const mode = lookupMode(std.policy);
  const keyNames = mode === TAX_MODE ? ['invoice_num'] : ['invoice_num', 'po_number'];
  const readOk = {}; for (const k of keyNames) readOk[k] = docOk(doc, k);
  const ctx = makeCtx(doc, std, { entityAi, qtyAi });
  const outcomes = {};
  const runRule = async (fn) => {
    // orchestrator._run: an AI outage is a rule that was not evaluated, never a crash and never a pass.
    try { const o = await fn(ctx); outcomes[o.rule_id] = o; return o; }
    catch (e) {
      if (!(e && e.aiError)) throw e;
      const rid = 'V-' + String(fn.name || '').slice(1, 3);
      errors.push({ code: 'AI_SERVICE_ERROR', rule_id: rid, detail: String(e.message) });
      const o = { rule_id: rid, result: 'not_evaluated', findings: [], halted_by: 'AI_SERVICE_ERROR', detail: 'AI service error', data: {} };
      outcomes[rid] = o;
      return o;
    }
  };

  const t0 = Date.now();
  for (const fn of STEP1) await runRule(fn);
  timings.step1_ms = Date.now() - t0;

  let halted = null;
  const ora = std.policy.oracle;
  const useUnconfirmed = evEnabled(std, 'oracle');
  const key = useUnconfirmed ? (n => lookupKey(doc, n)) : (n => docOk(doc, n) ? docV(doc, n) : null);
  const invKey = key('invoice_num'), poKey = key('po_number'), supKey = key('supplier_tax_id');
  const lk = ora.lookup || {};
  let invCands = [], rcvCands = [];
  if (mode === TAX_MODE) {
    if (lk.invoice_candidates_from_document) {
      invCands = documentCandidates(ext.extra, invKey, {
        pageTypes: lk.invoice_candidate_page_types || [], labels: lk.invoice_candidate_labels || [],
        exclude: (meta.po_numbers || []).slice().concat(poKey ? [poKey] : []),
        receiptPatterns: lk.receipt_num_patterns || []
      });
    }
    if (lk.receipt_num_lookup) rcvCands = receiptNumCandidates(ext.extra, lk.receipt_num_patterns || [], parseInt(lk.receipt_num_max_candidates || 2, 10));
  }
  if ((outcomes['V-02'] || {}).result === 'fail') halted = 'V-02';
  else if (mode === TAX_MODE) { if (!((invKey || invCands.length || rcvCands.length) && (supKey || poKey))) halted = 'V-01'; }
  else if (!(poKey && invKey)) halted = 'V-01';

  const repo = new McpOracleRepository(svc.sqlRun, { rowCap: ora.row_cap, matchColumns: lk.invoice_match_columns, rowCaps: ora.row_caps || {} });
  const session = new OracleSession(repo, ora.row_cap, { maxQueries: ora.max_queries_per_round, lookupCfg: lk, rowCaps: ora.row_caps || {} });
  if (!halted) {
    const t1 = Date.now();
    try {
      if (mode === TAX_MODE) {
        const sub = doc.fields.sub_total ? D(fval(doc.fields.sub_total)) : null;
        ctx.snapshot = await session.lookupTaxInvoice(invKey, {
          ocrSupplierTaxId: supKey, poNumber: poKey, invoiceCandidates: invCands, receiptCandidates: rcvCands,
          customerTaxId: key('customer_tax_id'), subTotal: sub === null ? null : dStr(sub), totalTol: dStr(std.tol('total'))
        });
      } else {
        ctx.snapshot = await session.lookup(poKey, invKey);
      }
    } catch (e) {
      if (e instanceof OracleInputRejected) { errors.push({ code: 'ORACLE_INPUT_REJECTED', detail: String(e.message), queries: session.rejected }); halted = 'ORACLE_ERROR'; }
      else if (e instanceof OracleTechnicalError) { errors.push({ code: 'ORACLE_TECHNICAL_ERROR', detail: String(e.message) }); halted = 'ORACLE_ERROR'; }
      else throw e;
    }
    timings.oracle_ms = Date.now() - t1;
  }
  if (!halted && mode === TAX_MODE && (ctx.snapshot.query_keys || {}).invoice_num_rejected && !(ctx.snapshot.query_keys || {}).invoice_key_matched) {
    doc = markUnusableKey(doc, 'invoice_num', 'INVALID_FORMAT:EQUALS_PO_NUMBER');
    ctx.doc = doc;
  }
  if (!halted && mode === TAX_MODE && !OracleSession.active(ctx.snapshot).length && (ctx.snapshot.query_keys || {}).invoice_rejected) {
    doc = markUnusableKey(doc, 'invoice_num', 'INVALID_FORMAT:NOT_A_LOOKUP_KEY');
    ctx.doc = doc;
    outcomes['V-04'] = { rule_id: 'V-04', result: 'not_evaluated', findings: [], halted_by: 'V-01', detail: 'เลข Invoice ที่อ่านได้ใช้ค้นใบรับไม่ได้ (รูปแบบไม่ปลอดภัยสำหรับ SQL)', data: { invoice_num: ctx.snapshot.query_keys.invoice_num } };
    outcomes['V-05'] = { rule_id: 'V-05', result: 'not_evaluated', findings: [], halted_by: 'V-04', detail: 'ไม่มีใบรับ จึงไม่มี ORG_ID', data: {} };
    halted = 'V-01';
  }
  if (!halted) {
    ctx.snapshot = narrowPoList(ctx.snapshot, doc, std);
    doc = adoptMatchedInvoiceKey(doc, ctx.snapshot, std);
    let dup;
    [doc, dup] = collapseDuplicateBlock(doc, ctx.snapshot, std);
    copies = copies || dup;
    doc = corroborateOracle(doc, ctx.snapshot, std);
    ctx.doc = doc;
    if (!OracleSession.active(ctx.snapshot).length && !Object.values(readOk).every(v => v)) {
      outcomes['V-04'] = { rule_id: 'V-04', result: 'not_evaluated', findings: [], halted_by: 'V-01', detail: 'ค้นใบรับด้วยเลขที่อ่านไม่ยืนยันแล้วไม่พบ จึงไม่สรุปเป็น E05', data: { unconfirmed_keys: Object.entries(readOk).filter(([, v]) => !v).map(([k]) => k) } };
      outcomes['V-05'] = { rule_id: 'V-05', result: 'not_evaluated', findings: [], halted_by: 'V-04', detail: 'ไม่มีใบรับ จึงไม่มี ORG_ID', data: {} };
      halted = 'V-01';
    }
  }
  if (!halted) {
    const v04 = await runRule(v04Receipt);
    if (OracleSession.active(ctx.snapshot).length) await runRule(v05Customer);
    else outcomes['V-05'] = { rule_id: 'V-05', result: 'not_evaluated', findings: [], halted_by: 'V-04', detail: 'ไม่มีใบรับ จึงไม่มี ORG_ID', data: {} };
    if (v04.result !== 'pass' && !(v04.result === 'manual_review' && (v04.data || {}).continue_checks)) halted = 'V-04';
  }
  if (!halted) {
    const t2 = Date.now();
    try {
      const resolved = await resolve(ctx.doc, OracleSession.active(ctx.snapshot), std, lineAi);
      ctx.groups = resolved[0]; ctx.match_trace = resolved[1];
      const rows = {}; for (const r of OracleSession.active(ctx.snapshot)) rows[r.rcv_line_id] = r;
      ctx.doc = corroborateLines(ctx.doc, ctx.groups, rows, std);
      for (const fn of STEP3) await runRule(fn);
    } catch (e) {
      if (!(e && e.aiError)) throw e;                 // orchestrator.py:186-188
      errors.push({ code: 'AI_SERVICE_ERROR', rule_id: 'V-07', detail: String(e.message) });
      halted = 'AI_SERVICE_ERROR';
    }
    timings.step3_ms = Date.now() - t2;
  }
  if (outcomes['V-02'].result !== 'fail') for (const fn of STEP1) await runRule(fn);

  const report = evidenceReport(ctx.doc);
  if (Object.keys(report).length || copies) {
    const o = outcomes['V-01'];
    const extra = Object.keys(report).length ? { corroborated: report } : {};
    if (copies) extra.collapsed_copies = copies;
    outcomes['V-01'] = { ...o, data: Object.assign({}, o.data, extra) };
  }
  for (const rid of ALL_RULE_IDS) {
    if (!outcomes[rid]) outcomes[rid] = { rule_id: rid, result: 'not_evaluated', findings: [], detail: 'ข้ามตาม gate', halted_by: halted, data: {} };
  }
  const ordered = ALL_RULE_IDS.map(r => outcomes[r]);
  const rec = recommend(ordered, errors);
  timings.total_ms = Date.now() - t0;
  const metrics = {
    duration_ms: timings, oracle_calls: session.calls, oracle_rejected: session.rejected,
    oracle_queries: session.trace.slice(), oracle_lookup_mode: mode, ai: ctx.ai_trace,
    ai_line_matcher_called: (ctx.match_trace || {}).ai_called || false, sql_audit: repo.sqlAudit(),
    engine: 'n8n-in-flow-port/1.0'
  };
  return assemble({
    ext, doc: ctx.doc, meta, std, ctx, outcomes: ordered, recommendation: rec, halted, errors,
    request: svc.request || {}, models: svc.models || {}, metrics
  });
}

// ---------------------------------------------------------------- n8n entry point (node 17)
async function runInFlow(extraction, opts) {
  const o = opts || {};
  const std = Std(o.standard);
  const sqlRun = o.sqlRun;
  const started = Date.now();
  const out = await validate(extraction, { std, sqlRun, request: o.request || {}, models: o.models || {},
    ai: o.ai, lineAi: o.lineAi, entityAi: o.entityAi, qtyAi: o.qtyAi });
  out.metrics = out.payload.metrics;
  out.elapsed_ms = Date.now() - started;
  return out;
}
