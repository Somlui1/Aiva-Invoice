// node 22 (v5.7) + node 23 offline test — runs the real jsCode the same way the Code node does.
//   node harness/test_tail_v57.mjs
// Proves the v5.7 evidence rows survive the tail of the flow:
//   * review rows (kind="review") show up per rule and never as exceptions
//   * V-06 now reports rule_version 2.0
//   * node 23 still spreads the payload (schema keys) + verification, and the sha is untouched
import fs from 'node:fs';

const b22 = fs.readFileSync('n8n_nodes/22_v57.js', 'utf8');
const b23 = fs.readFileSync('n8n_nodes/23_api_response.js', 'utf8');
const run = (body, item) => new Function('$input', body)({ first: () => item, item: () => ({}) });
const envelope = (payload, doc, mode) => ({
  ok: true, doc_id: doc,
  port: { mode, elapsed_ms: 40, oracle_queries: 1, recommendation: payload.recommendation.value,
          halted_by: payload.recommendation.halted_by, payload_sha256: payload.integrity.payload_sha256,
          parity_expected: payload.integrity.payload_sha256, parity_ok: true },
  steps: [], result: payload, images: { overlay: [{ element_id: 'x' }], img_w: 1240, img_h: 1754 },
});

let bad = 0;
const check = (label, ok, extra) => {
  console.log('%s %s%s', (ok ? 'PASS' : 'FAIL').padEnd(4), label, extra ? '  ' + extra : '');
  if (!ok) bad++;
};

// ---- A) exec357: V-04 manual_review with ONE review row (no exception code) -----------------------
const p1 = JSON.parse(fs.readFileSync('fixtures/payload_inline_exec357.json', 'utf8'));
const a = run(b22, { json: envelope(p1, '23', 'fixture:exec357'), binary: { page_original: {} } })[0];
const r1 = a.json.table.find(r => r.rule_id === 'V-04');
check('22 reads the envelope', a.json.engine_ok === true && a.json.cards === 9);
check('22 counts v5.7 review rows', a.json.review_points === 1, 'review_points=' + a.json.review_points);
check('review row sits on V-04', r1.review_points.length === 1 && r1.result === 'manual_review',
  JSON.stringify(r1.review_points[0] && r1.review_points[0].message));
check('review row is NOT an exception', r1.exceptions.every(e => e.code) &&
  p1.exceptions.every(e => e.rule_id !== 'V-04' || e.code));
check('report_text marks the review row', /review:1/.test(a.json.report_text));
const b = run(b23, a)[0];
check('23 keeps schema keys + verification', !!b.json.contract && !!b.json.verification && b.json.verification.rules.length === 9);
check('23 carries v5.7 evidence + summary.review_points to the API',
  Array.isArray(b.json.evidence) && b.json.evidence.some(e => e.kind === 'review') &&
  Array.isArray(b.json.summary.review_points));
check('23 sha untouched by the tail', b.json.integrity.payload_sha256 === a.json.payload_sha256);

// ---- B) V-06 stamp fixture: E08 for the receiver only, rule_version 2.0 ----------------------------
const p2 = JSON.parse(fs.readFileSync('fixtures/payload_js_v06_stamp.json', 'utf8'));
const c = run(b22, { json: envelope(p2, 'TEST-SIG-STAMP', 'fixture:v06_stamp'), binary: {} })[0];
const v6 = c.json.table.find(r => r.rule_id === 'V-06');
check('22 shows V-06 rule_version 2.0', v6.rule_version === '2.0', 'got ' + v6.rule_version);
check('V-06 row = E08 High only', v6.result === 'fail' && v6.exceptions.length === 1 &&
  v6.exceptions[0].code === 'E08' && v6.exceptions[0].severity === 'High');
check('V-06 data carries missing_slots', JSON.stringify(v6.data.missing_slots) === '["receiver"]');
check('no review rows here', c.json.review_points === 0);
check('overlay still forwarded to the parent', Array.isArray(c.json.overlay) && c.json.img_w === 1240);

console.log(bad ? '\nTAIL NODES BROKEN (%d)' : '\ntail nodes handle the v5.7 payload', bad || '');
process.exitCode = bad ? 1 : 0;
