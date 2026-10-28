// The strongest offline proof before touching the canvas: run the REAL node 21 code (dist/node21_inline.js,
// glue included) on a recorded production document, with the Oracle CSV and the rule-AI answers replayed
// from the tape, and require payload_sha256 to equal the engine's.
//
//   node harness/test_node21_rec.mjs                 # default docs
//   node harness/test_node21_rec.mjs 116 104 101
//
// Each doc enters the node as a `rec:<doc>` fixture: same code path as `exec357`, but with aiTape set, so
// the AI transport, the decode chain and the guardrails all run for real.  Nothing reaches the network:
// httpRequest throws if the node tries.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tapeKey } from './tape_key.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REC = path.join(ROOT, 'fixtures', 'rec');
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const src = fs.readFileSync(path.join(ROOT, 'dist', 'node21_inline.js'), 'utf8');

const DOCS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['100', '104', '101', '116', '107'];             // no AI · V-05 entity AI · V-07 AI (M4) · V-07 (M3) · installment

function fixtureFor(doc) {
  const read = (s) => JSON.parse(fs.readFileSync(path.join(REC, `${doc}${s}`), 'utf8'));
  const engine = read('_engine_payload.json');
  const aiTape = read('_ai_tape.json').map((e) => ({ key: tapeKey(e.body), text: e.text }));
  const ruleCalls = read('_ai_tape.json').filter((e) => /^(v07-match|v05-entity|v08-qty)/.test(tapeKey(e.body))).length;
  return {
    text: `'rec:${doc}': {
      label: 'DMS-${doc} (recorded production document, rule AI replayed)',
      models: ${JSON.stringify(engine.versions.models)},
      request: ${JSON.stringify(engine.request)},
      expect: '${engine.integrity.payload_sha256}',
      aiModel: ${JSON.stringify((engine.versions.models || {}).line_matcher || '')},
      extraction: ${JSON.stringify(read('_extraction.json'))},
      tape: ${JSON.stringify(read('_oracle_tape.json').map((t) => ({ query_id: t.query_id || null, csv: t.csv })))},
      aiTape: ${JSON.stringify(aiTape)},
    },`,
    ruleCalls,
    verdict: engine.recommendation.value,
    aiTrace: engine.metrics && engine.metrics.ai ? JSON.stringify(engine.metrics.ai).length : 0,
  };
}

let bad = 0;
for (const doc of DOCS) {
  const fx = fixtureFor(doc);
  let code = src.replace('const FIXTURES = {\n', 'const FIXTURES = {\n' + fx.text);
  if (code === src) { console.log('could not inject the fixture'); process.exit(1); }
  code = code.replace("  fixtureCase: '',", "  fixtureCase: 'rec:" + doc + "',");
  const helpers = { async httpRequest(o) { throw new Error('recorded mode must not touch the network: ' + o.url); } };
  globalThis.$input = { first: () => ({ json: { steps: [], images: {} }, binary: {} }) };
  globalThis.$ = (name) => { throw new Error('recorded mode must not read node "' + name + '"'); };
  let p;
  try {
    const out = await new AsyncFunction(code).call({ helpers });
    p = out[0].json.port;
  } catch (e) {
    console.log(`DMS-${doc}  NODE THREW: ${e.message}`);
    bad++; continue;
  }
  const aiOk = p.ai_calls === fx.ruleCalls;
  const ok = p.parity_ok === true && aiOk;
  if (!ok) bad++;
  console.log(`DMS-${doc}  parity_ok=${p.parity_ok}  rec=${p.recommendation} (engine ${fx.verdict})  ai=${p.ai_calls}/${fx.ruleCalls} oracle=${p.oracle_queries}  ${ok ? 'identical' : 'DIFFERENT'}`);
  if (!ok) console.log(`          expected ${p.parity_expected}`);
}
console.log(bad ? `\nNODE 21 CODE DOES NOT MATCH THE ENGINE on ${bad} doc(s)` : `\nnode 21 itself reproduces the engine on ${DOCS.length} recorded document(s)`);
process.exitCode = bad ? 1 : 0;
