// รัน jsCode ของ node 22/23 (ที่ดึงมาจาก n8n จริง) แบบ offline - workflow นี้รันใน n8n ไม่ได้เพราะไม่มี trigger
import fs from 'node:fs';
const b22 = fs.readFileSync('n8n_nodes/22_report.js', 'utf8');
const b23 = fs.readFileSync('n8n_nodes/23_api_response.js', 'utf8');
const run = (body, item) => new Function('$input', body)({ first: () => item });

const payload = JSON.parse(fs.readFileSync('fixtures/payload_inline_exec357.json', 'utf8'));
const sha = payload.integrity.payload_sha256;
const envelope = {   // รูปแบบ output จริงของ node 21 (ยืนยันจาก exec dump: json.result + json.port)
  ok: true, doc_id: '23',
  port: { mode: 'fixture:exec357 — DMS-23', elapsed_ms: 36, oracle_queries: 3,
          recommendation: 'MANUAL_REVIEW', halted_by: 'V-04', payload_sha256: sha,
          parity_expected: sha, parity_ok: true },
  steps: [], result: payload, images: {},
};
const bin = { page_original: { id: 'x' }, annotated: { id: 'y' } };

const out22 = run(b22, { json: envelope, binary: bin })[0];
const out23 = run(b23, out22)[0];
console.log('--- A) input = envelope ของ node 21 ---');
console.log('22: engine_ok=%s source=%s cards=%s missing=%s verdict=%s halted=%s codes=%s',
  out22.json.engine_ok, out22.json.engine_source, out22.json.cards, out22.json.missing,
  out22.json.verdict, out22.json.halted_by, JSON.stringify(out22.json.exception_codes));
console.log('22: sha=%s parity_ok=%s rows=%s', String(out22.json.payload_sha256).slice(0, 24), out22.json.parity_ok, out22.json.table.length);
console.log('23: keys=%d  มี verification=%s  rules=%d  binary=%s',
  Object.keys(out23.json).length, !!out23.json.verification, out23.json.verification.rules.length,
  Object.keys(out23.binary || {}).sort().join(','));
console.log('23: sha inside == verification == parity_expected :',
  out23.json.integrity.payload_sha256 === out23.json.verification.payload_sha256 &&
  out23.json.verification.payload_sha256 === out23.json.verification.parity_expected, String(sha).slice(0, 24));
fs.writeFileSync('fixtures/api_response_exec357.json', JSON.stringify(out23.json, null, 1));

// B) input = stub ของ node 12 (ยังไม่มีผล engine) -> ต้องฟ้องดัง ไม่เงียบ
const stub = { ok: true, doc_id: '89', result: { rule_results: { status: 'not_evaluated' } } };
const s22 = run(b22, { json: stub, binary: {} })[0];
const s23 = run(b23, s22)[0];
console.log('--- B) input = stub node 12 (ไม่มีผล engine) ---');
console.log('22: engine_ok=%s source=%s missing=%s verdict=%s', s22.json.engine_ok, s22.json.engine_source, s22.json.missing, s22.json.verdict);
console.log('23: rules=%d engine_ok=%s verification.mode=%s', s23.json.verification.rules.length,
  s23.json.verification.engine_ok, s23.json.verification.mode);
