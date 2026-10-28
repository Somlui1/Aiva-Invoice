// The JS side of the tape key IS the port (src_ai.js::aiRequestKey) - n8n, this harness and python agree
// by construction, and tape_key.py is the python twin.
//   node harness/tape_key.mjs            # prints the key of every recorded request
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const REC = path.join(ROOT, 'fixtures', 'rec');
const P = require0();
function require0() { const r = createRequire(import.meta.url); return r(path.join(ROOT, 'dist', 'bundle.cjs')); }

export const tapeKey = P.aiRequestKey;

if (process.argv[1] && process.argv[1].endsWith('tape_key.mjs')) {
  const docs = process.argv.length > 2 ? process.argv.slice(2)
    : [...new Set(fs.readdirSync(REC).filter((f) => f.endsWith('_ai_tape.json')).map((f) => f.split('_')[0]))].sort();
  for (const d of docs) {
    for (const e of JSON.parse(fs.readFileSync(path.join(REC, `${d}_ai_tape.json`), 'utf8'))) {
      console.log(`${d.padEnd(6)} ${tapeKey(e.body)}`);
    }
  }
}
