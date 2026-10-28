// ทดสอบ node 23 ฉบับใหม่ (bbox_debug เข้า verification) โดยไม่ต้องเผา VLM ซ้ำ
// input จำลอง = output ของ node 14 (json ของ blackbox + bbox_debug จาก 11b)
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const code = fs.readFileSync('n8n_nodes/23_api_response.js', 'utf8');
const payload = JSON.parse(fs.readFileSync('fixtures/live_exec399_doc89.json', 'utf8'));
const prev = JSON.parse(fs.readFileSync('fixtures/api_response_exec400.json', 'utf8'));   // เอารูปแบบ table ของ 22 ของจริง
const item = {
  json: {
    ok: true, engine_ok: true, engine_source: 'node 21 envelope (on input)', mode: 'live', doc_id: '89',
    parity_ok: null, parity_expected: null, payload_sha256: payload.integrity.payload_sha256,
    oracle_queries: 1, elapsed_ms: 2592, verdict: 'HOLD', halted_by: null, max_severity: 'High',
    exception_codes: ['E01', 'E13'], cards: 9, missing: 0, report_text: prev.verification.report_text,
    table: prev.verification.rules,
    bbox_debug: { ok: true, step: '11b', source_key: 'bmp', width: 1240, height: 1754, thickness_px: 3, boxes_drawn: 20, slots_skipped: 20, bmp_bytes_out: 6524934 },
    engine: payload,
  },
  binary: { page_original: { id: 'p' }, annotated: { id: 'a' } },
};
const out = new Function('$input', code)({ first: () => item })[0];
const v = out.json.verification;
let fail = 0; const bad = (m) => { console.log('  x ' + m); fail++; };
console.log('top-level keys      :', Object.keys(out.json).length, '| contract =', out.json.contract);
console.log('verification keys   :', Object.keys(v).length);
console.log('bbox_debug          :', JSON.stringify(v.bbox_debug));
console.log('binary              :', Object.keys(out.binary).sort().join(','));
console.log('sha ตรง 2 จุด        :', out.json.integrity.payload_sha256 === v.payload_sha256);
if (!v.bbox_debug || v.bbox_debug.boxes_drawn !== 20 || v.bbox_debug.thickness_px !== 3) bad('bbox_debug ไม่หลุดเข้า verification');
if (v.rules.length !== 9 || v.cards !== 9 || v.missing !== 0) bad('rules/cards/missing ผิด');
if (Object.keys(out.json).includes('bbox_debug')) bad('bbox_debug ไม่ควรมีที่ root (รก schema)');
if (Object.keys(out.binary).sort().join(',') !== 'annotated,page_original') bad('binary ผิด');
if (out.json.integrity.payload_sha256 !== v.payload_sha256) bad('sha ไม่ตรง');
fs.writeFileSync('fixtures/api_response_node23_new.json', JSON.stringify(out.json, null, 1));
console.log(fail ? `\nFAIL ${fail}` : '\nALL PASS');
process.exit(fail ? 1 : 0);
