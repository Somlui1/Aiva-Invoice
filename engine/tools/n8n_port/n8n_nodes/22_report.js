// Verification report (9 ขอ) - อ านจาก inputอย  าวเดียว จึ งย  ายไปต อท  ายอะไรก ได  และส ง binaryต อด วย
// ร  บได  ท ้ ง envelope ของ node 21 {ok,doc_id,port,result} และ payloadล  วน {rule_results,...}
// meta ถอดจาก standard.json (Standard v6.6) + ช ่ อฟ ັ งก ั สั นใน domain/rules.py ; ไม ่ ค านวณ verdictใหม  
const MISS = 'no engine payload on input (node 21 ยังไม่ต่อ / อยู่คนละ workflow)';
const META = {
  'V-01': ['v01_required', 1, 'logic', false],
  'V-02': ['v02_line_math', 1, 'logic', true],
  'V-03': ['v03_doc_totals', 1, 'logic', false],
  'V-06': ['v06_signatures', 1, 'logic+vision', false],
  'V-04': ['v04_receipt', 2, 'logic', false],
  'V-05': ['v05_customer', 2, 'logic+ai', false],
  'V-07': ['v07_line_match', 3, 'logic(M1)+ai(M3/M4/M5)', false],
  'V-08': ['v08_quantity', 3, 'logic', false],
  'V-09': ['v09_total_vs_receipt', 3, 'logic', false] };
const ORDER = ['V-01', 'V-02', 'V-03', 'V-06', 'V-04', 'V-05', 'V-07', 'V-08', 'V-09'];   // ล าดั บท ี engineประเมิ นจร ิ ง
const item = $input.first();
const IN = item.json || {};
const payload = (IN.result && IN.result.rule_results) ? IN.result : (IN.rule_results ? IN : (IN.payload || {}));
const port = IN.port || IN.verification || {};
const res = Array.isArray(payload.rule_results) ? payload.rule_results : [];
const exc = Array.isArray(payload.exceptions) ? payload.exceptions : [];
const rec = (payload.recommendation && payload.recommendation.value) ? payload.recommendation : {};
const engineOk = res.length > 0;
const table = ORDER.map((rid) => {
  const m = META[rid];
  const r = res.find((x) => x.rule_id === rid);
  const row = { rule_id: rid, rule_name: m[0], step: m[1], engine: m[2], gate: m[3],
    rule_version: null, result: 'not_evaluated', halted_by: null,
    detail: engineOk ? 'engine did not return this rule' : MISS, exceptions: [], evidence_ids: [], data: null };
  if (r) Object.assign(row, { rule_version: r.rule_version, result: r.result, halted_by: r.halted_by,
    detail: r.detail, evidence_ids: r.evidence_ids || [], data: r.data || null });
  row.exceptions = exc.filter((e) => e.rule_id === rid).map((e) => ({ code: e.code, name: e.name, severity: e.severity }));
  return row;
});
const show = (r) => r.detail && r.detail !== MISS && r.detail !== 'engine did not return this rule';
const report_text = table.map((r) => '[' + r.rule_id + '] ' + r.rule_name + '  ' + r.result +
  (r.halted_by ? '  halted_by=' + r.halted_by : '') + '  ' +
  r.exceptions.map((e) => e.code + ':' + e.severity).join(' ') + (show(r) ? '  - ' + r.detail : '')).join('\n');
return [{ json: {
  ok: true, engine_ok: engineOk,
  engine_source: engineOk ? (IN.port ? 'node 21 envelope (on input)' : 'payload on input') : 'MISSING',
  mode: port.mode || null,
  doc_id: IN.doc_id || (payload.package ? payload.package.dms_doc_id : null) || null,
  parity_ok: port.parity_ok === undefined ? null : port.parity_ok,
  parity_expected: port.parity_expected || null,
  payload_sha256: port.payload_sha256 || (payload.integrity ? payload.integrity.payload_sha256 : null) || null,
  oracle_queries: port.oracle_queries === undefined ? null : port.oracle_queries,
  elapsed_ms: port.elapsed_ms === undefined ? null : port.elapsed_ms,
  verdict: rec.value || null, halted_by: rec.halted_by || null, max_severity: rec.max_severity || null,
  exception_codes: rec.exception_codes || [], cards: table.length,
  missing: table.filter((r) => r.detail === MISS).length,
  engine: engineOk ? payload : null, table, report_text
}, binary: item.binary || {} }];