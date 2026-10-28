// Run the BUILT node 21 (dist/node21_inline.js, the exact text that sits on the canvas) offline, in the
// v6.0 external-I/O shape: every Oracle / rule-AI call leaves the node as `io.pending` and comes back as an
// answer on the tape. The responder is controlled here, so slow answers, a failing answer, a duplicate
// answer and a never-answered request can all be tested against one input.
//
//   node harness/js_node21.mjs <doc> [--slow ms] [--fail-first] [--dup] [--no-answer] [--external 0]
//
// Baseline = the payload sha js_flow recorded for the same document through the OLD plumbing (one Code node,
// I/O inside). Same answers + same input must give the same sha; if it does not, the refactor changed
// behaviour and this exits 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.indexOf(k) > 0;
const doc = process.argv[2];
if (!doc) { console.log('usage: node harness/js_node21.mjs <doc> [--slow ms] [--fail-first] [--dup] [--no-answer]'); process.exit(1); }

// Input = a REAL draft execution record (runData of nodes 00/05/08/10/12/paperless), which is what node 21
// actually reads on the canvas. The payload that same run produced under the OLD plumbing is the baseline.
const EXEC = arg('--exec', 'live/ab_exec_472.json');
const execRec = JSON.parse(fs.readFileSync(path.join(ROOT, EXEC), 'utf8'));
const rd = ((execRec.data || execRec).resultData || {}).runData || {};
function outItems(node, optional) {
  const runs = rd[node] || rd[Object.keys(rd).find((k) => k.startsWith(node))];
  if (!runs) { if (optional) return []; throw new Error('execution has no data for node ' + node); }
  const main = (runs[runs.length - 1].data || {}).main || []; const items = [];
  for (const br of main) for (const it of (Array.isArray(br) ? br : (br.items || []))) items.push(it);
  return items;
}
const jsonOf = (n, o) => { const i = outItems(n, o); return i.length ? i[0].json : {}; };
const nodeJsonMap = {};
for (const want of ['00 CONFIG (single point)', 'Get a document', '05 Parse classify pick invoice pages',
                    '05e Parse adjudicate + reselect', '08 Build extract request', '10 Bbox math pixels + sanitize',
                    '12 Build final JSON + images']) {
  try { nodeJsonMap[want] = jsonOf(want, true); } catch (e) { /* not on this graph */ }
}
const base21 = (() => { try { return jsonOf('21 Validate (port)', true).result || null; } catch (e) { return null; } })();
const docTag = String(jsonOf('00 CONFIG (single point)', true).doc_id || 'live');
const tapeFile = arg('--tape', `fixtures/rec/${docTag}_oracle_tape.json`);
const oraTape = fs.existsSync(path.join(ROOT, tapeFile)) ? JSON.parse(fs.readFileSync(path.join(ROOT, tapeFile), 'utf8')) : [];
const aiFile = arg('--ai', `fixtures/rec/${docTag}_ai_tape.json`);
const aiTape = fs.existsSync(path.join(ROOT, aiFile)) ? JSON.parse(fs.readFileSync(path.join(ROOT, aiFile), 'utf8')) : [];
let src = fs.readFileSync(path.join(ROOT, 'dist', 'node21_inline.js'), 'utf8');
src = src.replace(/fixtureCase: '[^']*'/, "fixtureCase: ''")                        // live branch: build extraction
            .replace(/ioExternal: [^,\n]+/, 'ioExternal: ' + (arg('--external', '1') === '1' ? 'true' : 'false'))  // from cfg expression
            .replace(/aiTimeoutMs: \d+/, 'aiTimeoutMs: 300000')                    // engine's budget, not the platform's
            .replace(/timeoutMs: \d+/, 'timeoutMs: 60000');                        // engine: 60 s per ORDS attempt
if (!/ioExternal: true/.test(src)) throw new Error('the built node 21 has no ioExternal switch to flip');

const slowMs = Number(arg('--slow', '0'));
const failFirst = flag('--fail-first'), dup = flag('--dup'), noAnswer = flag('--no-answer');
let answered = 0, inNodeHttp = 0, failedOnce = false;
const helpers = {
  // In external mode node 21 must NOT do network I/O at all. Any call here is the bug we are testing for.
  httpRequest: async (o) => { inNodeHttp++; throw new Error('node 21 performed its own HTTP call (' + o.url
    + ') — external I/O is supposed to hand the request out, not send it'); },
  getBinaryDataBuffer: () => Buffer.alloc(0),
  getWorkflowStaticData: () => ({}),
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normSql = (t) => String(t).replace(/\s+/g, ' ').trim().replace(/;\s*$/, '').toUpperCase();

// n8n's $(name) / $input, backed by the recorded canvas outputs of nodes 00/05/08/10/12 + paperless.
const rec = (name) => nodeJsonMap[name] || nodeJsonMap[Object.keys(nodeJsonMap).find((k) => k.startsWith(name)) || ''] || {};
const $ = (name) => { const j = rec(name); const it = { json: j, binary: {} };
  return { first: () => it, all: () => [it], item: () => it, json: j }; };
let nextItem = { json: {}, binary: {} };
const $input = { first: () => nextItem, all: () => [nextItem] };
const $execution = { id: 'js-node21-' + doc };

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const run = new AsyncFunction('$input', '$', '$execution', '"use strict";' + String.fromCharCode(10) + src);

const io = { oracleTape: [], aiTape: [] };
const N12 = nodeJsonMap['12 Build final JSON + images'] || {};
let item = { json: { ...N12 }, binary: {} }, passes = 0, pendings = { oracle: 0, ai: 0 };
for (let pass = 0; pass < 40; pass++) {
  nextItem = item;
  const t0 = Date.now();
  const out = await run.call({ helpers }, $input, $, $execution);
  const got = (out && out[0] && out[0].json) || {};
  passes++;
  const wall = Date.now() - t0;
  if (!got.awaiting_io) {
    item = { json: got };
    console.log(`DONE after ${passes} passes (${pendings.oracle} Oracle + ${pendings.ai} AI answered) `
      + `verdict=${(got.result || {}).recommendation ? got.result.recommendation.value : '?'} `
      + `sha=${got.port ? got.port.payload_sha256 : '?'} last-pass=${wall}ms in-node-HTTP=${inNodeHttp}`);
    break;
  }
  const p = got.io.pending;
  pendings[p.kind]++;
  if (noAnswer) { item = { json: { ...N12, io: { ...io, pending: null } } }; continue; }     // never answered -> the loop cap must bite
  if (slowMs) await sleep(slowMs);                                                   // slow, but inside the engine's window
  if (failFirst && !failedOnce) {
    failedOnce = true;
    io.oracleTape.push({ sql: p.sql, error: 'OracleUnavailable: ORA-12541 no listener', csv: '' });
    item = { json: { ...N12, io: { ...io, pending: null } } };
    console.log(`  pass ${passes}: handed out ${p.kind} #${p.round} -> answered with a FAILURE`);
    continue;
  }
  let answer;
  if (p.kind === 'oracle') {
    const hit = oraTape.find((t) => normSql(t.sql || '') === normSql(p.sql))
             || oraTape.find((t) => normSql(t.sql || '') !== '');
    if (!hit) throw new Error('no recorded Oracle answer for: ' + String(p.sql).slice(0, 120));
    answer = { sql: p.sql, csv: hit.csv };
  } else {
    const hit = aiTape.find((t) => t.key === p.key) || aiTape.find((t) => tapeKey(t.body) === p.key);
    if (!hit) throw new Error('no recorded rule-AI answer for ' + p.key);
    answer = { key: p.key, text: hit.text };
  }
  (p.kind === 'oracle' ? io.oracleTape : io.aiTape).push(answer);
  answered++;
  if (dup) (p.kind === 'oracle' ? io.oracleTape : io.aiTape).push({ ...answer });   // same answer twice
  item = { json: { ...N12, io: { ...io, pending: null } } };
  console.log(`  pass ${passes}: ${p.kind} #${p.round} handed out, answered (pass wall ${wall}ms)`);
}
const payload = (item.json || {}).result;
if (!payload) {
  console.log('NO PAYLOAD after ' + passes + ' passes — ' + (noAnswer ? 'the loop never received an answer' : 'aborted'));
  process.exit(2);
}
const strip = (x) => { const c = JSON.parse(JSON.stringify(x)); delete c.integrity; delete c.request;
  // wall-clock bookkeeping cannot match across two runs and is not behaviour
  if (c.metrics) { delete c.metrics.elapsed_ms; delete c.metrics.timings_ms; delete c.metrics.oracle_ms; }
  if (c.extra) { delete c.extra.elapsed_ms; }
  return JSON.stringify(c); };
const paths = (o, pre) => { const out = [];
  if (o && typeof o === 'object') for (const k of Object.keys(o)) out.push(...paths(o[k], pre + '.' + k));
  else out.push(pre); return out; };
function firstDiff(a, b) { const A = JSON.parse(a), B = JSON.parse(b); const pa = paths(A, '$'); const diffs = [];
  const get = (o, p) => p.slice(2).split('.').reduce((x, k) => (x == null ? x : x[k]), o);
  for (const p of new Set([...pa, ...paths(B, '$')])) { const va = JSON.stringify(get(A, p)), vb = JSON.stringify(get(B, p));
    if (va !== vb) diffs.push(p + '  old=' + String(va).slice(0, 70) + '  new=' + String(vb).slice(0, 70)); }
  return diffs; }
const baseline = base21 ? strip(base21) : null;
const sha = payload.integrity.payload_sha256;
console.log(`execution state: passes=${passes} answered=${answered} in-node HTTP=${inNodeHttp} `
  + `recommendation=${payload.recommendation.value} rules=${(payload.rule_results || []).length}`);
console.log(`payload_sha256=${sha}`);
console.log('baseline from the same run under the old plumbing: ' + (baseline ? (baseline === strip(payload) ? 'IDENTICAL payload (minus per-run ids)' : 'DIFFERENT payload') : 'not recorded'));
if (!failFirst && !noAnswer && !dup && baseline && baseline !== strip(payload)) {
  for (const d of firstDiff(baseline, strip(payload)).slice(0, 12)) console.log('  DIFF ' + d);
  console.log('!!! MISMATCH vs the old plumbing: the external-I/O refactor changed behaviour');
  process.exit(1);
}
console.log(dup ? 'duplicate answer: payload produced once, one query per distinct SQL'
  : failFirst ? 'error path: a failed Oracle answer reaches the rules as an error (no silent row)'
  : noAnswer ? 'never answered: bounded loop, no payload' : 'answers replayed identically through the external loop');
