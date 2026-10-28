// JS payload: the port's validate() with the same tape.
//   node harness/js_full.mjs                                   # scenario 1
//   node harness/js_full.mjs extraction2.json oracle_rows2.json payload_js2.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));
const FIX = path.join(ROOT, 'fixtures');
const fixture = process.argv[2] || 'extraction.json';
const tapeName = process.argv[3] || 'oracle_rows.json';
const outName = process.argv[4] || 'payload_js.json';
const std = P.Std(JSON.parse(fs.readFileSync(path.join(ROOT, 'standard.json'), 'utf8')));
const ext = JSON.parse(fs.readFileSync(path.join(FIX, fixture), 'utf8')).extraction;
const tape = JSON.parse(fs.readFileSync(path.join(FIX, tapeName), 'utf8'));
const metaPath = path.join(FIX, fixture.replace(/\.json$/, '') + '_meta.json');
const metaFile = fs.existsSync(metaPath) ? metaPath
  : (fixture === 'extraction2.json' ? path.join(FIX, 'fixture2_meta.json') : null);
const meta = metaFile ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const request = meta.request || { validation_id: 'VAL-PORTCHECK', correlation_id: 'corr-portcheck', document_revision: 1, validation_round: 1 };
let i = 0;
try {
  const out = await P.validate(ext, { std, request, models: meta.models || {}, sqlRun: async () => tape[i++].csv });
  fs.writeFileSync(path.join(FIX, outName), JSON.stringify(out.payload, null, 1));
  console.log('%s  sha=%s  rec=%s  queries=%d', outName, out.payload.integrity.payload_sha256.slice(0, 24), out.payload.recommendation.value, i);
} catch (e) {
  console.log('THREW ' + (e.name || 'Error') + ': ' + e.message + '\n' + String(e.stack).split('\n').slice(1, 5).join('\n'));
  process.exitCode = 1;
}
