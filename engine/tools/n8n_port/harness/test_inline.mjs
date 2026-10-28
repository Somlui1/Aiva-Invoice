// harness/test_inline.mjs — run dist/node21_inline.js exactly the way the n8n Code node does
// (async function body, `this.helpers` + $input/$() as globals), with the Oracle call stubbed to the
// inlined replay tape. Both pinned documents must reproduce the engine's payload hash.
//
//   node harness/test_inline.mjs
//   then:  $PY harness/diff_payload.py fixtures/payload_py.json  fixtures/payload_inline_exec357.json
//          $PY harness/diff_payload.py fixtures/payload_py2.json fixtures/payload_inline_DMS-15.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const src = fs.readFileSync(path.join(ROOT, 'dist', 'node21_inline.js'), 'utf8');

const helpers = {
  async httpRequest(o) { throw new Error('fixture mode must not make any HTTP call: ' + o.url); },
};
globalThis.$input = { first: () => ({ json: { steps: [], images: {} }, binary: {} }) };
globalThis.$ = (name) => { throw new Error('fixture mode must not read node "' + name + '"'); };

let bad = 0;
for (const name of ['exec357', 'DMS-15']) {
  const code = src.replace("  fixtureCase: '',", `  fixtureCase: '${name}',`);
  if (code === src) { console.log('could not flip fixtureCase'); process.exit(1); }
  const t0 = Date.now();
  const out = await new AsyncFunction(code).call({ helpers });
  const p = out[0].json.port;
  fs.writeFileSync(path.join(ROOT, 'fixtures', `payload_inline_${name}.json`), JSON.stringify(out[0].json.result, null, 1));
  const ok = p.parity_ok === true;
  if (!ok) bad++;
  console.log('%s  parity_ok=%s  rec=%s  oracle=%d  sha=%s  (%d ms locally, node size %d KB)',
    name.padEnd(8), ok, p.recommendation, p.oracle_queries, p.payload_sha256.slice(0, 31), Date.now() - t0,
    Math.round(src.length / 1024));
  console.log('          expected %s', p.parity_expected.slice(0, 31));
}
console.log(bad ? 'INLINE NODE BROKEN' : 'inline node reproduces the engine for both fixtures');
process.exitCode = bad ? 1 : 0;
