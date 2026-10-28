// Reproduce node 21 offline from a saved n8n execution: take the real outputs of nodes 05 / 08 / 10 and
// node 00 CONFIG exactly as n8n produced them, rebuild the extraction the same way the node does, and run
// the port.  Oracle is stubbed ('No rows selected', or --tape) and the rule AI is off unless --ai-probe /
// --ai-tape is given, so the run is deterministic and python can be pointed at the same bytes afterwards.
//
//   node harness/js_exec.mjs live/ab_exec_450.json --out fixtures/payload_exec450.json
//   node harness/js_exec.mjs live/ab_exec_452.json --ai-probe        # how many AI calls do the rules want?
//   node harness/js_exec.mjs live/ab_exec_450.json --dump-extraction fixtures/exec450_py.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const P = createRequire(import.meta.url)(path.join(HERE, 'dist', 'bundle.cjs'));
const NL = String.fromCharCode(10);

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.indexOf(k) > 0;
const file = process.argv[2];
if (!file) { console.log('usage: node harness/js_exec.mjs <execution.json> [--tape f] [--out f] [--ai-probe] [--dump-extraction f]'); process.exit(1); }
const exec = JSON.parse(fs.readFileSync(path.join(HERE, file), 'utf8'));
const rd = ((exec.data || exec).resultData || {}).runData || {};

function outItems(node, optional) {                // n8n stores either [{items:[..]}] or [[{json,binary}]]
  const runs = rd[node];
  if (!runs) {
    // node 21 reads nodes 08/10 as OPTIONAL now (the "no invoice page" branch skips them) - so does this.
    if (optional) return [];
    throw new Error('execution has no data for node ' + node);
  }
  const main = (runs[runs.length - 1].data || {}).main || [];
  const items = [];
  for (const br of main) for (const it of (Array.isArray(br) ? br : (br.items || []))) items.push(it);
  return items;
}
const jsonOf = (node, optional) => { const i = outItems(node, optional); return i.length ? i[0].json : {}; };

const n05 = jsonOf('05 Parse classify pick invoice pages');
const n08 = jsonOf('08 Build extract request', true);
const n10 = jsonOf('10 Bbox math pixels + sanitize', true);
const cfg = jsonOf('00 CONFIG (single point)');
let paperless = {};
try { paperless = ((jsonOf('Get a document').results || [{}])[0]) || {}; } catch (e) { /* manual trigger run: no paperless id */ }

const docId = String(paperless.id || cfg.doc_id || 0);
// --fixture <file>: take the extraction from the file instead of rebuilding it. Used by
// harness/test_live_exec.py, where the SAME file is handed to the python side: without this, JS works from the
// extraction it built in memory (key order = insertion order) while python reads the dumped file (canonicalJson
// sorts keys), and the two disagree on the order of ocr.elements — a harness artefact, not a behaviour.
// With the flag, both sides consume one input, and field ORDER is left to harness/test_payload_parity.py, which
// compares against the engine's own real extraction (ordered) instead of a canonicalised copy.
const FIX = arg('--fixture', '');
let extraction, request;
if (FIX) {
  const fx = JSON.parse(fs.readFileSync(path.join(HERE, FIX), 'utf8'));
  extraction = fx.extraction;
  request = fx.request;
} else {
  extraction = P.buildExtraction({
    n05, n08: Object.keys(n08).length ? n08 : null, n10: Object.keys(n10).length ? n10 : null, cfg, docId,
    fileSha256: paperless.versions && paperless.versions[0] ? 'sha256:' + paperless.versions[0].checksum : 'sha256:unknown',
    packageId: 'PKG-' + docId,
  });
  request = { validation_id: 'VAL-exec-offline', correlation_id: 'corr-exec-offline', idempotency_key: null,
              document_revision: 1, validation_round: 1 };
}
if (flag('--dump-extraction')) {
  // Dumped with canonicalJson, not JSON.stringify: JS has one number type, so stringify writes the
  // orientation confidence as 1 where the ENGINE writes 1.0. The python side then parses an int, hashes
  // "1" and the shas stop matching for a reason that has nothing to do with behaviour. canonicalJson emits
  // the same text Python's json.dumps does (still valid JSON), so the fixture is engine-shaped on disk.
  fs.writeFileSync(path.join(HERE, arg('--dump-extraction')), P.canonicalJson({
    extraction, request, models: { line_matcher: null, qty_judge: null, entity_judge: null, vision: null },
  }));
  console.log('dumped extraction for python -> ' + arg('--dump-extraction'));
}
const stdJson = JSON.parse(fs.readFileSync(path.join(HERE, 'standard.json'), 'utf8'));   // the bytes node 21 embeds
const std = P.Std(stdJson);
console.log(`extraction: documents=${(extraction.documents || []).length} lines=${(extraction.lines || []).length} `
  + `pages=${(extraction.pages || []).length} line_nos=${JSON.stringify((extraction.lines || []).map((l) => l.line_no))}`);
const ndoc = P.normalizeDocument(extraction, std)[0];
console.log(`normalized: lines=${(ndoc.lines || []).length} fields=${Object.keys(ndoc.fields || {}).length}`);

const tape = flag('--tape') ? JSON.parse(fs.readFileSync(path.join(HERE, arg('--tape')), 'utf8')) : null;
let qi = 0;
const sqlRun = tape ? (async () => { const e = tape[qi++]; return (e && e.csv) || 'No rows selected'; })
  : (async () => 'No rows selected');            // nothing found: every Oracle rule answers NOT_EVALUATED
const models = { line_matcher: null, qty_judge: null, entity_judge: null, vision: null };   // container.py's four names

// --ai-probe counts the AI calls the rules WANT. The answer is an empty object, so the verdict is
// meaningless - it only proves that a live run reporting ai_calls=0 was the rules not asking, not a dead
// transport in the node.
let ai = null;
const seen = [];
if (flag('--ai-probe')) {
  ai = {
    model: 'probe',
    call: async (body) => {
      const t = (body.messages || []).map((x) => (typeof x.content === 'string'
        ? x.content : (x.content || []).map((c) => c.text || '').join(''))).join(' ');
      seen.push(((t.split('prompt_id:')[1] || '?').split('-->')[0].trim().split(NL)[0]));
      return { choices: [{ message: { content: '{}' } }] };
    },
  };
}

const out = await P.runInFlow(extraction, { standard: stdJson, sqlRun, models, ai, request });
const payload = out.payload;
console.log(`verdict=${payload.recommendation.value} sha=${payload.integrity.payload_sha256}`);
console.log('rules: ' + (payload.rule_results || []).map((r) => (r.rule_code || r.rule_id) + '=' + (r.result || r.status)).join(' '));
console.log(`exceptions=${(payload.exceptions || []).length} evidence=${Object.keys(payload.evidence || {}).length} `
  + `review_rows=${(((payload.summary || {}).review_rows) || []).length}`);
if (flag('--ai-probe')) console.log(`AI calls the rules wanted: ${seen.length}  ${JSON.stringify(seen)}`);
if (flag('--out')) {
  fs.writeFileSync(path.join(HERE, arg('--out')), JSON.stringify(payload, null, 1));
  console.log('wrote ' + arg('--out'));
}
