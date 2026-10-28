// build_n8n_inline.mjs — assemble the ONE-CODE-NODE version of node "21 Validate (port)".
//
//   node build_n8n_inline.mjs
//   -> dist/node21_inline.js  : the whole Oracle-verify engine, self-contained, paste into the
//                               Code node's jsCode field. No HTTP fetch, no external server.
//
// Layout of the generated file (each part is marked with a banner so it is easy to find):
//   SECTION A  CONFIG                (edit here)
//   SECTION B  STANDARD v6.6         (inlined policy)
//   SECTION C  THE PORT (12 parts)   (generated from src_*.js via build.mjs)
//   SECTION T  OFFLINE PARITY TESTS  (two fixtures + Oracle replay tapes; delete in production)
//   SECTION R  RUNNER                (reads the flow, calls Oracle, emits aiva.system_a.result/3.0)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.resolve(ROOT, '..', '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const J = (p) => JSON.parse(rd(p));
// Credentials never come from git: n8n_nodes/port_config.json holds a live Keycloak bearer token and is
// gitignored; the committed template is port_config.example.json. ORACLE_MCP_URL / ORACLE_MCP_TOKEN in the
// environment win over the file, so CI can rebuild node 21 with no token on disk.
function loadCfg() {
  const has = fs.existsSync(path.join(ROOT, 'n8n_nodes', 'port_config.json'));
  const c = J(has ? 'n8n_nodes/port_config.json' : 'n8n_nodes/port_config.example.json');
  if (process.env.ORACLE_MCP_URL) c.oracleUrl = process.env.ORACLE_MCP_URL;
  if (process.env.ORACLE_MCP_TOKEN) c.oracleToken = process.env.ORACLE_MCP_TOKEN;
  if (!has && !process.env.ORACLE_MCP_TOKEN)
    console.warn('WARNING: n8n_nodes/port_config.json is missing and ORACLE_MCP_TOKEN is unset - '
                 + 'node 21 is being built with the placeholder token from port_config.example.json');
  return c;
}
const cfg = loadCfg();

// ---------------------------------------------------------------- EXPECTED comes from the engine, never from memory
// The pinned hashes are read out of the engine's OWN reference payloads (written by harness/parity.py),
// and the build refuses to run when those references are older than any engine source or standard file.
// That is what keeps "the node still matches the project" from silently rotting (the Oct-19 build sat on
// v5.5 for a week and still reported parity_ok=true against its own stale pins).
function engineRef(fixtureFile, caseName) {
  const abs = path.join(ROOT, 'fixtures', fixtureFile);
  if (!fs.existsSync(abs)) {
    throw new Error(`fixtures/${fixtureFile} is missing — run  python harness/parity.py  before building (${caseName})`);
  }
  const refM = fs.statSync(abs).mtimeMs;
  const stale = [];
  const seen = [];
  for (const dir of [path.join(ENGINE, 'src', 'system_a'), path.join(ENGINE, 'config', 'standards', 'v6.6')]) seen.push(dir);
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { walk(f); continue; }
      if (!/\.(py|yaml)$/.test(e.name)) continue;
      if (fs.statSync(f).mtimeMs > refM) stale.push(path.relative(ENGINE, f).replace(/\\/g, '/'));
    }
  };
  seen.forEach(walk);
  if (stale.length) {
    throw new Error(`fixtures/${fixtureFile} is OLDER than ${stale.length} engine file(s) (e.g. ${stale[0]}) — ` +
      `the engine moved after the last reference run. Do:  python harness/parity.py  (then re-check the verdicts)`);
  }
  return J(`fixtures/${fixtureFile}`).integrity.payload_sha256;
}
const REF = { exec357: engineRef('payload_py_exec357.json', 'exec357'), dms15: engineRef('payload_py_2.json', 'DMS-15') };

const bundle = rd('dist/bundle.cjs');
const std = rd('standard.json').trim();
const fx1 = J('fixtures/extraction.json'), tape1 = J('fixtures/oracle_rows.json');
const fx2 = J('fixtures/extraction2.json'), tape2 = J('fixtures/oracle_rows2.json');
const meta2 = J('fixtures/fixture2_meta.json');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const PARTS = [
  ['src_core.js', 'Decimal (BigInt, Python semantics), Std() policy access, splitNumber/money/date/tax-id, canonicalJson, sha256hex'],
  ['src_normalize.js', 'domain/normalize.py -> normalized_fields, per-cell null_reason, line_math'],
  ['src_extract.js', 'n8n nodes 05/08/10 -> aiva.extraction/2.0 (fields, lines, signatures, regions, occurrences)'],
  ['src_oracle_sql.js', 'read-only SQL guard, TAX-INV / suffix / RCV-BY-NUM / INV-BY-PO-VENDOR templates, CSV -> rows'],
  ['src_oracle_lookup.js', 'application/oracle_lookup.py -> lookupTaxInvoice, receipt filtering, suffix retry, query budget'],
  ['src_invoice_keys.js', 'application/invoice_keys.py -> invoice + receipt-number candidates, PO narrowing'],
  ['src_evidence.js', 'domain/evidence.py -> ghost rows, duplicate copies, arithmetic/oracle/line corroboration, evidence report'],
  ['src_matching.js', 'domain/matching.py + v08.py -> M1/M2 1:1, N:1, 1:N, price check, V-08 payload + decide'],
  ['src_rules.js', 'domain/rules.py -> V-01 completeness, V-02 usable, V-03 arithmetic, V-04 receipt, V-05 supplier, V-06 signatures'],
  ['src_rules3.js', 'V-07 line match, V-08 quantity, V-09 total vs receipt, STEP3 order'],
  ['src_assemble.js', 'application/assembler.py -> ocr.elements, normalized items, summary, payload + integrity hash'],
  ['src_orchestrate.js', 'application/orchestrator.py -> validate(): STEP1 -> Oracle -> STEP3 -> recommendation -> assemble'],
];

const banner = `// ================================================================================================
//  n8n Code node  "21 Validate (port)"  —  Oracle validation + aiva.system_a.result/3.0
//  workflow 034iqKMRjqKt9LlB ("DMS Invoice OCR + Validate (BLACKBOX Stage 1-3)")
//  wiring:  12 Build final JSON + images  ->  [this node]  ->  22 Verification report (9 rules)
//  node mode: Code | "Run Once for All Items" (runOnceForAllItems)
// ================================================================================================
//
//  THIS FILE IS GENERATED  ->  engine/tools/n8n_port/build_n8n_inline.mjs   (do not edit by hand
//  unless the same fix is copied back into src_*.js, otherwise n8n and the repo start to drift)
//
//  BUILD      @@BUILD@@                             port @@KB@@ KB (src_*.js -> build.mjs)
//  PARITY     proven against engine/src/ (Python) on ${'5'} pinned documents — see EXPECTED below.
//             full gate: engine/tools/n8n_port/harness/parity.py   (the two hashes below are read out of
//             the engine's own reference payloads at build time, so they cannot go stale silently)
//  NOTHING is fetched at runtime: the port, Standard v6.6 and the parity fixtures are all below.
//
//  ----------------------------------------------------------------------------------------------
//  HOW TO READ THIS NODE                                          (SECTION headers mark the blocks)
//  ----------------------------------------------------------------------------------------------
//   A  CONFIG ....... lines ~40   Oracle endpoint/token, fixture switch
//   B  STANDARD ..... Standard v6.6 (the policy the rules read: tolerances, row caps, match keys,
//                     supplier whitelist, address book, prompt versions) — dump of engine DB
//   C  THE PORT ..... the JS port of engine/src/system_a, one part per Python module:
${PARTS.map(([f, d], i) => `//        ${String(i + 1).padStart(2)}. ${f.padEnd(22)} ${d}`).join('\n')}
//   T  TESTS ........ two pinned documents + Oracle replay tapes (offline, no DB call)
//   R  RUNNER ....... glue: flow items -> extraction/2.0 -> Oracle -> rules -> payload + sha256
//
//  ----------------------------------------------------------------------------------------------
//  HOW TO RE-VERIFY WITHOUT TOUCHING THE DATABASE
//  ----------------------------------------------------------------------------------------------
//   1. in SECTION A set   fixtureCase: 'exec357'   (or 'DMS-15')      2. run the workflow
//   3. node 21 must report  port.payload_sha256  ==  EXPECTED for that fixture
//        exec357  DMS-23  receipt not found  -> MANUAL_REVIEW  ${REF.exec357}
//        DMS-15   DMS-15  receipt 510517699   -> AUTO_PASS     ${REF.dms15}
//      the hash covers the payload minus request/metrics/summary (see integrity.excludes), so the
//      timestamp/ids do not move it. If the sha differs, the code diverged from the engine — diff
//      the payload against engine/tools/n8n_port/fixtures/payload_py_exec357.json.
//   4. set fixtureCase back to '' for live OCR.
//
//  ----------------------------------------------------------------------------------------------
//  WHY IT ALL LIVES IN ONE NODE (do not split into several Code nodes)
//  ----------------------------------------------------------------------------------------------
//   * money is Decimal backed by BigInt and bbox is a typed Array subclass, so intermediate state
//     cannot survive a JSON hop between nodes;
//   * the payload hash must be computed in the same scope that assembled the payload, which is why
//     sha256hex is pure JS here and no n8n Crypto node is needed (Code nodes have no require()).
// ================================================================================================
`;

const sectionA = `
// ================================================================================================
// SECTION A — CONFIG.  This is the only block a normal edit touches.
// ================================================================================================
const PORT = {
  // Oracle through the ORDS MCP endpoint (Keycloak bearer token, same one the other nodes use)
  oracleUrl: ${JSON.stringify(cfg.oracleUrl)},
  oracleToken: ${JSON.stringify(cfg.oracleToken)},
  timeoutMs: ${Number(cfg.timeoutMs || 120000)},

  // '' = live OCR of this flow. 'exec357' / 'DMS-15' = replay the pinned fixture in SECTION T
  // (offline, no Oracle call) and reproduce the engine hash bit-for-bit.
  fixtureCase: '',

  // The rule AI: V-07 M3-M5 matcher, V-05 entity judge, V-08 quantity judge.  Same LiteLLM gateway and the
  // same model the engine's container picks (MODEL_REASONING), both read from 00 CONFIG.  With this off the
  // port answers like the flow used to: lines the logic cannot pair stay UNMATCHED -> E13 -> HOLD.
  aiEnabled: true,
  // Measured on this instance: one thinking call = 16.2 s (exec 454) / 23.9 s (exec 457). exec 456 had a
  // slower call and the PLATFORM killed the Code node ("the task runner was taking too long"), which loses
  // the whole document. The engine never behaves that way: an AI outage is one rule not_evaluated plus
  // system_errors[AI_SERVICE_ERROR]. So the per-call ceiling sits under the platform limit and the port's
  // own error path handles the timeout - a slow model costs a MANUAL_REVIEW, never a lost run and never a pass.
  aiTimeoutMs: ${Number(cfg.aiTimeoutMs || 300000)},

  // ---- v6.0: the long I/O OUTSIDE the Code node (measured, not guessed) -----------------------
  // This instance kills a Code node at 60 s. Exec 478 shows it: node 21 died at executionTime=60005 ms with
  // "the task runner was taking too long", and exec 456 died the same way earlier. The engine's own budgets
  // are larger than that on purpose (Oracle 60 s x2 attempts x <=7 queries; rule AI 300 s x2), so a single
  // Code node can never be parity - the waiting has to happen in HTTP nodes and the Code node must only
  // compute. ioExternal=true runs node 21 as a REPLAY loop: each pass replays the same deterministic rule
  // evaluation over a growing tape, and whenever the rules want an answer that is not on the tape yet the
  // pass stops at that exact call and hands the request out as io.pending.  Nothing is cached across
  // documents, no answer is invented, and the timeouts stay what the engine uses (60 s / 300 s), because the
  // platform limit that forced this change is per-node, not per-workflow.
  ioExternal: false,   // 00 CONFIG's io_external turns it on below (a Code node never evaluates {{ }})
  oracleMaxQueries: 7,                                   // engine MAX_QUERIES (single_pass/oracle_lookup)
  aiMaxCalls: 8,                                         // generous ceiling for the recorded corpus; beyond it we fail loud
};
`;

const sectionB = `
// ================================================================================================
// SECTION B — Standard v6.6, inlined (dump of the engine's active standard; rules read it through
// Std()/stdFromJson, so edit the engine DB + re-dump rather than editing this literal).
// ================================================================================================
const STANDARD = ${std};
`;

const sectionC = `
// ================================================================================================
// SECTION C — THE PORT.  ${PARTS.length} parts, concatenated from src_*.js by build.mjs.
// Wrapped in one closure so nothing leaks into the n8n sandbox and so nothing needs require().
// ================================================================================================
const P = (function () {
  'use strict';
  const module = { exports: {} };
${bundle.split('\n').map((l) => (l ? '  ' + l : '')).join('\n')}
  return module.exports;
})();
`;

const sectionT = `
// ================================================================================================
// SECTION T — OFFLINE PARITY FIXTURES.  Only read when PORT.fixtureCase is set. They contain real
// OCR output + the Oracle CSV that ORDS returned for those documents, so a re-verification needs no
// database. Safe to delete in production (costs ~${Math.round((JSON.stringify(fx1.extraction).length + JSON.stringify(fx2.extraction).length + 8000) / 1024)} KB of node size).
// ================================================================================================
const FIXTURES = {
  'exec357': {                       // DMS-23: OCR misread the supplier tax id -> 0 rows -> V-04 halts
    label: 'DMS-23 (n8n exec 357, receipt not found)',
    models: {},                      // the harness ran with no AI models; versions.models is hashed
    request: null,                   // request is excluded from the hash
    expect: '${REF.exec357}',
    extraction: ${JSON.stringify(fx1.extraction)},
    tape: ${JSON.stringify(tape1.map((t) => ({ query_id: t.query_id, csv: t.csv })))},
  },
  'DMS-15': {                        // DMS-15: receipt 510517699, 2 lines matched M1 -> AUTO_PASS
    label: 'DMS-15 (receipt found, STEP 3 exercised)',
    models: ${JSON.stringify(meta2.models)},
    request: ${JSON.stringify(meta2.request)},
    expect: '${REF.dms15}',
    extraction: ${JSON.stringify(fx2.extraction)},
    tape: ${JSON.stringify(tape2.map((t) => ({ query_id: t.query_id, csv: t.csv })))},
  },
};
`;

const sectionR = `
// ================================================================================================
// SECTION R — RUNNER.  Reads this flow, builds aiva.extraction/2.0, talks to Oracle, runs
// STEP1 (V-01..V-06) -> STEP3 (matching + V-07/V-08/V-09) -> recommendation -> assemble + sha256,
// and passes the two images through as binary (they are never embedded as base64).
// ================================================================================================
const NODE = { cfg: '00 CONFIG (single point)', paperless: 'Get a document', n05: '05 Parse classify pick invoice pages',
               n05e: '05e Parse adjudicate + reselect',
               n08: '08 Build extract request', n10: '10 Bbox math pixels + sanitize' };
const nodeJson = (name, required) => {
  let v = null;
  try { v = \$(name).first().json; } catch (e) { v = null; }
  if (required && (v === null || v === undefined)) throw new Error('node 21: could not read node "' + name + '"');
  return v;
};

const input = $input.first();
const n12 = input.json;                                   // 12 Build final JSON + images
const fx = PORT.fixtureCase ? FIXTURES[PORT.fixtureCase] : null;
if (PORT.fixtureCase && !fx) throw new Error('node 21: fixtureCase "' + PORT.fixtureCase + '" not in SECTION T (keys: ' + Object.keys(FIXTURES).join(', ') + ')');

// ---- R1. aiva.extraction/2.0 -----------------------------------------------------------------
// dms_doc_id = the Paperless document id (paperless id 89 == DMS-89). node 00's cfg.doc_id is only
// a manual-test fallback; its expression resolves to null on a manual trigger.
let extraction, docId, models, request, sqlRun, aiCall = null, aiModel = null, aiCalls = 0, aiMs = 0;
const helpers = this.helpers;

// v6.0 external I/O: the previous pass of this same node (see 21x/21y) hands back the answers collected so
// far. Replaying from scratch is safe BECAUSE the port is pure: same extraction + same tape -> same path, so
// gate order, adaptive narrowing and error semantics are the ones the engine code itself takes.
const IO_KEY = 'io';
const carried = (input.json && input.json[IO_KEY] && input.json[IO_KEY].oracleTape) ? input.json[IO_KEY] : null;
let ioExternal = PORT.ioExternal === true;
const ioState = carried || { round: 0, oracleTape: [], aiTape: [], passes: 0 };
const normSql = (t) => {
    const raw = String(t); let s = '';
    for (let i = 0; i < raw.length; i++) {                     // whitespace squeeze + upper + trailing ';'
      const cc = raw.charCodeAt(i);
      s += (cc === 32 || (cc >= 9 && cc <= 13)) ? ' ' : raw[i];
    }
    s = s.split(' ').filter((w) => w !== '').join(' ');
    while (s.endsWith(';')) s = s.slice(0, -1);
    return s.trim().toUpperCase();
  };
class Pending extends Error { constructor(what) { super('pending'); this.what = what; } }

if (fx) {
  extraction = fx.extraction;
  docId = String(extraction.dms_doc_id);
  models = fx.models || {};
  request = fx.request || null;
  let qi = 0;                                             // Oracle replay: no DB call at all
  sqlRun = async () => {
    const e = fx.tape[qi++];
    if (!e) throw new Error('node 21: Oracle tape exhausted after ' + fx.tape.length + ' queries');
    return e.csv || 'No rows selected';
  };
  if ((fx.aiTape || []).length) {                         // rule-AI replay of a recorded document
    const used = fx.aiTape.map(() => false);
    aiCall = async (body) => {
      for (let i = 0; i < fx.aiTape.length; i++) {
        if (used[i]) continue;
        const want = fx.aiTape[i].key;
        if (want !== null && want !== undefined && want !== P.aiRequestKey(body)) continue;
        used[i] = true; aiCalls++;
        return { choices: [{ message: { content: fx.aiTape[i].text } }] };
      }
      throw new Error('node 21: rule-AI request is not on the recorded tape (' + fx.aiTape.length + ' recorded)');
    };
    aiModel = fx.aiModel || null;
  }
} else {
  const pl = ((nodeJson(NODE.paperless, false) || {}).results || [{}])[0] || {};
  const cfg = nodeJson(NODE.cfg, false) || {};
  // v6.0: read the flag BEFORE the facades are built — the Oracle facade is chosen a few lines later, and a
  // value assigned after that choice would silently leave the canvas on the old in-node path.
  ioExternal = PORT.ioExternal === true || cfg.io_external === true;
  docId = String(pl.id || cfg.doc_id || 0);
  const fileSha256 = ((pl.versions || [{}])[0] || {}).checksum ? 'sha256:' + pl.versions[0].checksum : 'sha256:unknown';
  // v5.8+: the selection may have come from the R6-6 second look. Read it from 05e when that branch ran, else
  // from 05. Not a preference - the two are mutually exclusive per run, and reading the wrong one (or the
  // stale one) is how a rescue gets thrown away after it already reopened the page.
  const n05 = nodeJson(NODE.n05e, false) || nodeJson(NODE.n05, true);
  extraction = P.buildExtraction({
    // reads[] is the multi-page answer: node 12 collected one read per SELECTED page (engine: one extract call
    // per page in selection order). n08/n10 stay as the legacy single-read fallback for a canvas that still
    // has the v5.7 chain, so this build runs on both graphs.
    n05: n05, reads: (n12 && n12.reads) || undefined,
    n08: nodeJson(NODE.n08, false) || null, n10: nodeJson(NODE.n10, false) || null,
    cfg: cfg, docId: docId, fileSha256: fileSha256, packageId: 'PKG-' + docId,
    adjudication: (n05 && n05.adjudication) || [], pageErrors: (n05 && n05.page_errors) || {},
    taxidRetry: (n12 && n12.taxid_retry) || [], calls: (n12 && n12.calls) || [],
    classifyCalls: (n12 && n12.classify_call) ? [n12.classify_call] : [],
    adjudicateCalls: (n12 && n12.adjudicate_calls) || [],
    requiredFields: (cfg.required_fields || []),
  });
  models = { line_matcher: null, qty_judge: null, entity_judge: null, vision: null };   // container.py names exactly these four
  if (!PORT.oracleToken) throw new Error('node 21: PORT.oracleToken is empty (SECTION A)');
  if (ioExternal) {                                  // ---- v6.0: answer from the tape, or hand the call out
    sqlRun = async (sql) => {
      const want = normSql(sql);
      for (const e of ioState.oracleTape) if (normSql(e.sql) === want) {
        if (e.error) throw new Error(e.error);        // the answer came back bad: same error, every pass
        return e.csv;
      }
      if (ioState.oracleTape.length >= PORT.oracleMaxQueries)
        throw new Error('node 21: the engine allows ' + PORT.oracleMaxQueries + ' Oracle queries and none of the '
          + 'answers on the tape matched this one — refusing to invent a row or to run a 8th query');
      throw new Pending({ kind: 'oracle', round: ioState.oracleTape.length + 1, sql: sql });
    };
    aiCall = null;                                        // set below, in the same external shape
    ioState.passes++;
    if (ioState.passes > PORT.oracleMaxQueries + PORT.aiMaxCalls + 2)
      throw new Error('node 21: external-I/O loop made ' + ioState.passes + ' passes without finishing — a '
        + 'pending call was answered but never used, which means the replay is not deterministic');
  }
  sqlRun = ioExternal ? sqlRun : async (sql) => {     // one ORDS MCP sql_run per query (<= 7)
    const r = await helpers.httpRequest({
      method: 'POST', url: PORT.oracleUrl, timeout: PORT.timeoutMs, returnFullResponse: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
                 Authorization: 'Bearer ' + PORT.oracleToken },
      body: { jsonrpc: '2.0', id: 1, method: 'tools/call',
              params: { name: 'sql_run', arguments: { database: 'default', sql: sql } } },
    });
    if (r.statusCode >= 400) throw new Error('ORDS HTTP ' + r.statusCode + ': ' + String(r.body).slice(0, 300));
    return P.mcpTextOf(typeof r.body === 'string' ? r.body : JSON.stringify(r.body));   // -> CSV text
  };

  // ---- R1b. the rule AI, over the same gateway the OCR nodes already use -------------------
  aiModel = String(cfg.model || '');
  // versions.models goes INSIDE the hashed payload, and the engine reports exactly these four names
  // (container.py Services.models) - no 'ocr' key, or the sha can never match the engine.
  models = { line_matcher: aiModel, qty_judge: aiModel, entity_judge: aiModel, vision: aiModel };
  if (PORT.aiEnabled) {
    const base = String(cfg.llm_url || ''), key = String(cfg.llm_key || '');
    if (!base || !key || !aiModel) throw new Error('node 21: 00 CONFIG needs llm_url + llm_key + model when aiEnabled is true');
    aiCall = ioExternal ? async (body) => {          // ---- v6.0: rule AI outside the Code node too
      const want = P.aiRequestKey(body);
      for (const e of ioState.aiTape) if (e.key === want) {
        if (e.error) throw new P.AiServiceError(e.error);
        aiCalls++; return { choices: [{ message: { content: e.text } }] };
      }
      if (ioState.aiTape.length >= PORT.aiMaxCalls)
        throw new Error('node 21: more than ' + PORT.aiMaxCalls + ' rule-AI calls wanted — failing loud instead of looping');
      throw new Pending({ kind: 'ai', round: ioState.aiTape.length + 1, key: want, body: body,
                          url: (() => { let u = String(cfg.llm_url); while (u.endsWith('/')) u = u.slice(0, -1); return u + '/chat/completions'; })(),
                          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + String(cfg.llm_key) } });
    } : async (body) => {
      const t0 = Date.now();
      let aiUrl = base;
      while (aiUrl.endsWith('/')) aiUrl = aiUrl.slice(0, -1);        // no regex here: this text lives in a template literal
      aiUrl += '/chat/completions';
      const r = await helpers.httpRequest({
        method: 'POST', url: aiUrl, timeout: PORT.aiTimeoutMs,
        returnFullResponse: true, ignoreHttpStatusCodes: true,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body,
      });
      const txt = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
      if (r.statusCode >= 400 && r.statusCode < 500) {
        // python raises AIBadRequestError here and never retries: a 4xx is a bug in the request, not a blip
        throw new P.AiServiceError('AIBadRequestError: HTTP ' + r.statusCode + ' ' + txt.slice(0, 300));
      }
      if (r.statusCode >= 500) throw new Error('AI gateway HTTP ' + r.statusCode + ' ' + txt.slice(0, 200));
      const parsed = JSON.parse(txt);
      aiCalls++; aiMs += Date.now() - t0;
      return parsed;
    };
  }
}

// ---- R2. validate + assemble (the hash is computed inside the port, see header) --------------
const stamp = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const REQ = request || { validation_id: 'VAL-' + stamp, correlation_id: 'corr-' + stamp,
                         idempotency_key: null, document_revision: 1, validation_round: 1 };
if (ioExternal) {
  try {
    var out0 = await P.runInFlow(extraction, { standard: STANDARD, sqlRun: sqlRun, ai: aiCall ? { call: aiCall, model: aiModel } : null,
      request: REQ, models: models });
  } catch (pend) {
    if (!(pend instanceof Pending) || !pend.what) throw pend;
    if (pend.what.kind === 'oracle' && !PORT.oracleToken) throw new Error('node 21: ORDS token missing');
    return [{ json: { ok: true, awaiting_io: pend.what.kind, doc_id: docId,
                     [IO_KEY]: { round: ioState.oracleTape.length + ioState.aiTape.length,
                                oracleTape: ioState.oracleTape, aiTape: ioState.aiTape, pending: pend.what } },
             binary: input.binary }];
  }
  var payload0 = out0.payload;
  return [{ json: { ok: true, doc_id: docId, [IO_KEY]: { phase: 'done', oracleTape: ioState.oracleTape,
                 aiTape: ioState.aiTape, passes: ioState.passes },
                   port: { mode: 'live+external-io', elapsed_ms: out0.elapsed_ms,
                           oracle_queries: ((payload0.metrics || {}).sql_audit || []).length,
                           ai_calls: aiCalls, ai_ms: aiMs, ai_enabled: !!aiCall,
                           recommendation: payload0.recommendation.value, halted_by: payload0.recommendation.halted_by,
                           payload_sha256: payload0.integrity.payload_sha256 },
                   steps: (n12 && n12.steps) || null, result: payload0, images: (n12 && n12.images) || null },
            binary: input.binary }];
}

const out = await P.runInFlow(extraction, {
  standard: STANDARD, sqlRun: sqlRun,
  ai: aiCall ? { call: aiCall, model: aiModel } : null,
  // api/app.py:89-90 builds the request block as {validation_id, correlation_id, idempotency_key, ...refs}
  // and sends idempotency_key as null when the caller sent no Idempotency-Key header. The KEY has to be in the
  // payload either way — Portal reads it to recognise a replay — so it is emitted as null here rather than
  // omitted (harness/test_live_vs_engine.py caught the omission on DMS-100).
  request: REQ,
  models: models,
});
const payload = out.payload;
const expected = fx ? fx.expect : null;
const matches = expected ? (payload.integrity.payload_sha256 === expected) : null;

return [{
  json: {
    ok: true,
    doc_id: docId,
    port: {
      mode: fx ? 'fixture:' + PORT.fixtureCase + ' — ' + fx.label : 'live',
      elapsed_ms: out.elapsed_ms,
      oracle_queries: ((payload.metrics || {}).sql_audit || []).length,
      ai_calls: aiCalls, ai_ms: aiMs, ai_enabled: !!aiCall,
      recommendation: payload.recommendation.value,
      halted_by: payload.recommendation.halted_by,
      payload_sha256: payload.integrity.payload_sha256,
      parity_expected: expected,
      parity_ok: matches,                                // fixture mode only: must be true
    },
    steps: (n12 && n12.steps) || null,
    result: payload,                                     // aiva.system_a.result/3.0
    images: (n12 && n12.images) || null,
  },
  binary: input.binary,
}];
`;

const body = banner.replace('@@BUILD@@', sha(bundle).slice(0, 12) + ' @ ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
  .replace('@@KB@@', Math.round((bundle.length + std.length) / 1024))
  + sectionA + sectionB + sectionC + sectionT + sectionR;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'node21_inline.js'), body);
console.log('dist/node21_inline.js = %d KB  (port %d KB + standard %d KB + fixtures/glue %d KB)',
  Math.round(body.length / 1024), Math.round(bundle.length / 1024), Math.round(std.length / 1024),
  Math.round((body.length - bundle.length - std.length) / 1024));
