// Port payload for one recorded document, replaying the SAME Oracle + AI tapes the engine used.
//   node harness/js_rec.mjs 117            -> fixtures/rec/<doc>_js_payload.json
// The AI transport injected here is the tape: the port's own decode chain (repair / no-thinking retry /
// salvage) still runs, only the network is replaced.  A request that is not on the tape is an error, not
// a fallback — that is the whole point of the harness.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tapeKey } from './tape_key.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const REC = path.join(ROOT, 'fixtures', 'rec');
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));

const doc = process.argv[2];
if (!doc) { console.log('usage: node harness/js_rec.mjs <doc>'); process.exitCode = 2; } else {

const std = P.Std(JSON.parse(fs.readFileSync(path.join(ROOT, 'standard.json'), 'utf8')));
const ext = JSON.parse(fs.readFileSync(path.join(REC, `${doc}_extraction.json`), 'utf8'));
const engine = JSON.parse(fs.readFileSync(path.join(REC, `${doc}_engine_payload.json`), 'utf8'));
const aiTape = JSON.parse(fs.readFileSync(path.join(REC, `${doc}_ai_tape.json`), 'utf8'));
const oraTape = JSON.parse(fs.readFileSync(path.join(REC, `${doc}_oracle_tape.json`), 'utf8'));
const usedAi = aiTape.map(() => false), usedOra = oraTape.map(() => false);
let aiCalls = 0, oraCalls = 0;

const summarise = (b) => JSON.stringify({ model: b.model, temperature: b.temperature, max_tokens: b.max_tokens,
  response_format: b.response_format || null, chat_template_kwargs: b.chat_template_kwargs || null,
  roles: (b.messages || []).map((m) => m.role),
  text_len: (b.messages || []).reduce((n, m) => n + (typeof m.content === 'string' ? m.content.length
    : (m.content || []).reduce((k, p) => k + (p.type === 'image_url' ? 0 : (p.text || '').length), 0)), 0) });

// The AI transport, replayed: same body in, recorded answer out.  Anything else is a port bug.
const aiCall = async (body) => {
  const key = tapeKey(body);
  for (let i = 0; i < aiTape.length; i++) {
    if (!usedAi[i] && tapeKey(aiTape[i].body) === key) {
      usedAi[i] = true; aiCalls++;
      return { choices: [{ message: { content: aiTape[i].text } }], usage: aiTape[i].usage || {} };
    }
  }
  const next = aiTape.map((e, i) => (usedAi[i] ? null : e)).filter(Boolean)[0];
  throw new Error(['AI request not on the tape.',
    '  wanted  ' + key + '  ' + summarise(body),
    '  tape    ' + (next ? tapeKey(next.body) + '  ' + summarise(next.body) : '(nothing left)')].join('\n'));
};

const sqlRun = async (sql) => {
  for (let i = 0; i < oraTape.length; i++) {
    if (!usedOra[i] && oraTape[i].sql.trim() === String(sql).trim()) {
      usedOra[i] = true; oraCalls++; return oraTape[i].csv;
    }
  }
  throw new Error('Oracle query not on the tape:\n' + String(sql).slice(0, 400));
};

try {
  const out = await P.validate(ext, {
    std, request: engine.request, models: (engine.versions || {}).models || {}, sqlRun,
    ai: { call: aiCall, model: ((engine.versions || {}).models || {}).line_matcher || 'unknown' },
  });
  fs.writeFileSync(path.join(REC, `${doc}_js_payload.json`), JSON.stringify(out.payload, null, 1));
  console.log(`DMS-${doc}  ${out.payload.recommendation.value}  sha=${out.payload.integrity.payload_sha256.slice(0, 24)}  ai=${aiCalls}/${aiTape.length} oracle=${oraCalls}/${oraTape.length}`);
} catch (e) {
  console.log(`THREW ${e.name || 'Error'}: ${e.message}`);
  if (process.env.JS_STACK) console.log(String(e.stack).split('\n').slice(0, 9).join('\n'));
  process.exitCode = 1;
}
}
