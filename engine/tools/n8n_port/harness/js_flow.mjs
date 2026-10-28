// harness/js_flow.mjs — run the REAL flow node code offline on a scenario, then run the port on it.
//
//   node harness/js_flow.mjs 26            # scenario built by harness/make_scenario.py
//   -> fixtures/scn/<doc>_port.json  { extraction, payload, node_outputs, tape }
//
// What is real and what is emulated (the honesty part of this harness):
//   REAL   node 05 (decode + selection), 05c/05e (adjudicate), 06b (per-page split), 08 (extract request),
//          10 (answer decode + bbox), 12 (aggregate + tax-id triage) — the same .js files pushed to the
//          canvas, loaded from n8n_nodes_v58/ — and the port (dist/bundle.cjs) on the resulting extraction,
//          replaying the recorded Oracle + rule-AI tapes.
//   FAKE   the four node types a Code node cannot be: pdfConvert (02/06/06r render), editImage (07 rotate)
//          and httpRequest (04/05d/09). The page images come from the ENGINE's own recorded requests, so
//          every page the flow "renders" is the exact JPEG the engine sent, at its DPI, quality and
//          rotation. That removes the platform's image pipeline from the comparison — which is exactly why
//          this harness proves decision + extraction parity and CANNOT prove render parity.
//   FAKE   node 03: its request shape is covered by harness/test_request_shape.mjs against the same tape.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tapeKey } from './tape_key.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const NODES = path.join(ROOT, 'n8n_nodes_v58');
const SCN = path.join(ROOT, 'fixtures', 'scn');
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const doc = process.argv[2];
if (!doc) { console.log('usage: node harness/js_flow.mjs <doc>'); process.exit(2); }
const scen = JSON.parse(fs.readFileSync(path.join(SCN, `${doc}_scenario.json`), 'utf8'));
const readBuf = (f) => fs.readFileSync(path.join(SCN, f));

// ------------------------------------------------------------------ a miniature n8n Code-node runtime
const store = {};                                             // nodeName -> {items, bins, paired}
function wrap(items, bins, paired) {
  const list = (items || []).map((j, i) => ({ json: j || {}, binary: (bins && bins[i]) || {} }));
  const w = { all: () => list, first: () => list[0] || { json: {}, binary: {} },
              last: () => list[list.length - 1] || { json: {}, binary: {} }, itemIndex: 0 };
  w.item = (paired && paired[0]) || w.first();
  return w;
}
let current = null;                                           // node whose helpers.* calls are in flight
const helpers = {
  getBinaryDataBuffer: async (idx, prop) => {
    const bin = (store[current].bins || [])[idx] || {};
    if (!bin[prop]) throw new Error(`js_flow: item ${idx} of "${current}" has no binary "${prop}" (have: `
      + Object.keys(bin).join(',') + ')');
    const v = bin[prop];                                     // n8n keeps binaries as {data: base64,...}
    return Buffer.isBuffer(v) ? v : Buffer.from(String(v.data || v), 'base64');
  },
  // async, like the real helper (exec 461: a missing await made the binary serialise to {} and node 07 died).
  prepareBinaryData: async (buf, fileName, mimeType) => ({
    data: Buffer.isBuffer(buf) ? buf.toString('base64') : String(buf), fileName, mimeType }),
  // node 10's ink-snap call runs over this in the offline runner. Same contract as n8n's
  // { returnFullResponse: true }: statusCode + parsed body, and a non-2xx throws (n8n's default
  // throwForRequestErrors) — which is what the node's own "refuse to continue" path expects to catch.
  httpRequest: async (opt) => {
    const res = await fetch(opt.url, { method: opt.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opt.headers || {}),
      body: opt.body === undefined ? undefined : JSON.stringify(opt.body),
      signal: opt.timeout ? AbortSignal.timeout(opt.timeout) : undefined });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) { /* not JSON: keep the text */ }
    if (res.status >= 400 && opt.throwForRequestErrors !== false) {
      throw new Error('request errored (status code ' + res.status + ') ' + String(text).slice(0, 220));
    }
    return opt.returnFullResponse ? { statusCode: res.status, body, headers: Object.fromEntries(res.headers) } : body;
  },
};
const $ = (name) => {
  const rec = store[name];
  if (!rec) throw new Error('js_flow: node "' + name + '" has not run in this scenario');
  const w = wrap(rec.items, rec.bins, rec.paired);
  return w;
};
async function runNode(name, file, inItems, inBins, pairedFrom, pairIndex) {
  current = name;
  const pairedAll = pairedFrom && store[pairedFrom]
    ? wrap(store[pairedFrom].items, store[pairedFrom].bins).all() : null;
  const paired = pairedAll && pairIndex !== undefined ? [pairedAll[pairIndex]] : pairedAll;
  const $input = wrap(inItems, inBins, paired);
  if (paired) $input.item = paired[0];
  store[name] = { items: inItems || [], bins: inBins || [], paired };   // helpers read the CURRENT node's input
  const src = fs.readFileSync(path.join(NODES, file), 'utf8');
  // A Code node sees `helpers` as a global, so it is passed as a parameter AND kept on `this` (older node
  // files were written against `this.helpers`). node 10's ink-snap call is the first user of the parameter.
  const out = await new AsyncFunction('$input', '$', '$execution', 'helpers', '"use strict";\n' + src)
    .call({ helpers }, $input, (n) => { const w = $(n); if (paired) w.item = paired[0]; return w; },
          { id: 'js-flow-' + doc }, helpers);
  store[name] = { items: (out || []).map((o) => o.json || {}), bins: (out || []).map((o) => o.binary || {}), paired };
  return out || [];
}

// ------------------------------------------------------------------ the inputs the flow would have fetched
// (the SNAP_URL block below may replace scen.config before any node reads it)
store['00 CONFIG (single point)'] = { items: [scen.config], bins: [{}], paired: null };
// The snap helper must mask the SAME pixels the engine masked, so when it is switched on the runner hands
// over the real corpus PDF (.cache/downloads/DMS-<doc>.pdf, the engine's own download cache). Without
// SNAP_URL the placeholder stays: no node looks at the bytes, and every other test keeps running offline.
let pdfBuf = Buffer.from('%PDF-1.4 js_flow placeholder');
if (process.env.SNAP_URL) {
  const dir = process.env.SNAP_PDF_DIR || path.join(ROOT, '..', '..', '.cache', 'downloads');
  const cand = path.join(dir, `DMS-${doc}.pdf`);
  if (!fs.existsSync(cand)) throw new Error('js_flow: SNAP_URL is set but ' + cand + ' is missing — a snap '
                                            + 'against a placeholder PDF would prove nothing');
  pdfBuf = fs.readFileSync(cand);
  // mutate in place: node 00's store entry was registered above and points at this same object
  Object.assign(scen.config, { snap_url: process.env.SNAP_URL,
                                                 snap_mode: process.env.SNAP_MODE || 'move',
                                                 snap_timeout_ms: Number(process.env.SNAP_TIMEOUT_MS || 20000),
                                                 snap_image_from_binary: process.env.SNAP_IMAGE_FROM_BINARY === '1' });
}
store['Get a document'] = { items: [scen.paperless], bins: [{ data: pdfBuf }], paired: null };
store['Webhook Invoice OCR'] = { items: [{}], bins: [{}], paired: null };
const classifyOut = [{ choices: [{ message: { content: scen.classify.answer } }], usage: scen.classify.usage || {} }];
store['04 VLM step 1 classify pages'] = { items: classifyOut, bins: [{}], paired: null };
store['03 Build classify request'] = { items: [scen.classify.request_meta], bins: [{}], paired: null };

const N05 = '05 Parse classify pick invoice pages';
const outputs = {};
const n05 = await runNode(N05, '05_parse_classify.js', classifyOut, [{}]);
store[N05].bins = [{ pdf: pdfBuf }];
outputs.n05 = n05[0].json;
let selectionItem = outputs.n05;
let selected = (outputs.n05.selected_invoice_pages || []).map(Number);

// fake pdfConvert + editImage: the engine's own sent bytes, under both names the flow uses. The tape bytes
// are ALREADY rotated (single_pass rotates before it encodes), so 'pre' and 'page' are the same image and
// node 08 measures orig == rot — the correct frame pair for a 0-degree document. For rotate_degrees != 0 the
// scenario must supply the unrotated render too (file_pre); until then those documents are out of scope here.
const renderBinaries = (images, unrotated) => {
  const bin = {};
  for (const im of images || []) {
    const b = readBuf(im.file);
    bin['ext_page_' + im.page_no] = b;
    bin['page_' + im.page_no] = (unrotated && unrotated[im.page_no]) ? readBuf(unrotated[im.page_no]) : b;
    bin['page'] = b;
  }
  return bin;
};
let rendered = renderBinaries(scen.extract);

if (!selected.length && (scen.adjudicate || []).length) {
  const adjBin = renderBinaries(scen.adjudicate);
  store['06r Render 150 DPI for adjudicate'] = { items: [{}], bins: [adjBin], paired: null };
  const reqs = await runNode('05c Adjudicate request', '05c_adjudicate_request.js', [{}], [adjBin]);
  const answers = reqs.map((r) => {
    const a = (scen.adjudicate || []).find((x) => Number(x.page_no) === Number(r.json.page_no));
    if (a && a.error) return { error: a.error };
    return { choices: [{ message: { content: (a || {}).answer || '{}' } }] };
  });
  const n05e = await runNode('05e Parse adjudicate + reselect', '05e_parse_adjudicate.js', answers,
    answers.map(() => ({})));
  store['05e Parse adjudicate + reselect'].bins = [{ pdf: pdfBuf }];
  selectionItem = n05e[0].json;
  selected = (selectionItem.selected_invoice_pages || []).map(Number);
  outputs.n05e = selectionItem;
  if (selected.length) rendered = renderBinaries(scen.extract);
}
outputs.selection = { selected, via_adjudicate: !!outputs.n05e };

let aggregated = null;
if (selected.length) {
  const split = await runNode('06b Split selected pages', '06b_split_selected_pages.js', [{}], [rendered], N05);
  // nodes 08 and 10 run Run Once for All Items on the canvas and loop over every selected page, so the runner
  // feeds them the whole batch too — one call each, N items in, N items out (exec 465 proved per-item mode is
  // not an option: it forbids .first(), and node 00's config is only reachable through .first()).
  const inBin8 = split.map((s) => {
    const ans = (scen.extract || []).find((e) => Number(e.page_no) === Number(s.json.page_no)) || {};
    const bin = Object.assign({}, s.binary);          // pre  = unrotated render (node 06)
    bin.page = readBuf(ans.file);                     // page = the rotated JPEG node 07's destinationKey writes
    return bin;
  });
  const r08 = await runNode('08 Build extract request', '08_extract_request.js',
    split.map((s) => s.json), inBin8, '06b Split selected pages');
  const ansItems = r08.map((r) => {
    const ans = (scen.extract || []).find((e) => Number(e.page_no) === Number(r.json.page_no)) || {};
    return { choices: [{ message: { content: ans.answer || '{}' } }], usage: ans.usage || {} };
  });
  // The canvas nodes look these up by name, so the runner has to register them too: node 07 owns the frames
  // (node 09's HTTP response carries none — the HTTP node drops binaries), and node 09t needs the PDF for a
  // 300 DPI re-render that offline replay cannot produce (there is no PDF in a recorded scenario), so the
  // stand-in bytes only ever satisfy the lookup.
  store['07 Rotate invoice page upright'] = { items: split.map((sp) => sp.json), bins: inBin8, paired: null };
  store['Get a document'] = { items: [{ id: scen.doc_id }],
                              bins: [{ data: inBin8[0].page }], paired: null };
  store['09 VLM step 2 extract bbox'] = { items: ansItems, bins: ansItems.map(() => ({})), paired: null };
  // ---- R6-13: the tax-id second look, on the same node code the canvas runs -------------------------
  const tri = await runNode('09t Tax-id triage', '09t_taxid_triage.js', ansItems, inBin8,
    '09 VLM step 2 extract bbox');
  const flagged = tri.filter((t) => t.json.taxid_retry_page);
  let taxidItems = [];
  if (flagged.length) {
    // The canvas renders the page again at 300 DPI (node 09r) and rotates it (node 09rot). Offline there is
    // no PDF to re-render, so the re-read frame is the RECORDED 150 DPI image: the decision, prompt, accept
    // policy and payload bookkeeping are the real code; only the pixel density of the second call is simulated.
    // node 09r (Convert to PDF to JPEG, all pages) names its binaries tax_page_N; node 09o picks the page.
    const hiBin = flagged.map((t) => {
      const src = inBin8[t.json.answer_index];
      return { ['tax_page_' + t.json.page_no]: src.page, pre: src.pre };
    });
    const prep = await runNode('09o Prep re-read frame', '09o_taxid_prep.js', [{}], hiBin, '09t Tax-id triage');
    // node 09rot (editImage) turns hi_raw into `page`; offline the recorded image is already upright, so the
    // rotate is the identity and both keys hold the same bytes.
    const rotBin = prep.map((p, i) => ({ page: hiBin[i]['tax_page_' + p.json.page_no], hi_raw: hiBin[i]['tax_page_' + p.json.page_no], pre: p.binary.pre }));
    const rq = await runNode('09b Build re-read request', '09b_taxid_request.js',
      prep.map((p) => p.json), rotBin, '09o Prep re-read frame');
    // the second answer: a recorded re-read tape entry when one exists, otherwise the SAME answer the engine
    // would have rejected — which is the engine's "looked again, still wrong, keep the first read" case.
    const hiAns = flagged.map((t) => {
      const rec = (scen.extract_retry || []).find((e) => Number(e.page_no) === Number(t.json.page_no));
      return { choices: [{ message: { content: rec ? rec.answer : t.json.answer_text } }], usage: (rec || {}).usage || {} };
    });
    taxidItems = await runNode('09d Merge tax-id re-read', '09d_taxid_merge.js', hiAns,
      flagged.map((t) => inBin8[t.json.answer_index]), '09b Build re-read request');
    store['09d Merge tax-id re-read'] = { items: taxidItems.map((t) => t.json),
                                          bins: taxidItems.map((t) => t.binary || {}), paired: null };
    store['09b Build re-read request'] = { items: rq.map((r) => r.json), bins: rq.map((r) => r.binary || {}), paired: null };
    store['09rot Rotate re-read upright'] = { items: prep.map((p) => p.json),
                                              bins: rotBin.map((b) => ({ page: b.page, hi_raw: b.hi_raw })), paired: null };
  }
  const joined = await runNode('09z Assemble extract reads', '09z_taxid_join.js', tri.map((t) => t.json),
    tri.map((t) => t.binary), '09t Tax-id triage');
  store['09z Assemble extract reads'] = { items: joined.map((j) => j.json),
                                          bins: joined.map((j) => j.binary || {}), paired: null };
  const r10 = await runNode('10 Bbox math pixels + sanitize', '10_parse_extract.js',
    joined.map((j) => j.json), joined.map((j) => j.binary), '09z Assemble extract reads');
  const perPage = r10;
  r10.forEach((r, i) => { outputs['read_' + split[i].json.page_no] = r.json; });
  const agg = await runNode('12 Build final JSON + images', '12_aggregate_reads.js',
    perPage.map((r) => r.json), perPage.map((r) => r.binary), '10 Bbox math pixels + sanitize');
  outputs.taxid = { flagged: flagged.map((f) => f.json.taxid_retry_page),
                    reason: flagged.map((f) => f.json.taxid_reason),
                    retry: ((agg[0].json || {}).taxid_retry) || [],
                    replaced: joined.filter((j) => j.json.taxid_replaced).map((j) => j.json.page_no) };
  aggregated = agg[0].json;
  outputs.n12 = { reads: aggregated.reads.map((r) => r.page_no), taxid_need: aggregated.taxid_need,
                  calls: (aggregated.calls || []).length, binaries: Object.keys(agg[0].binary || {}) };
}

// ------------------------------------------------------------------ the port, on the flow's own extraction
const cfg = scen.config;
const n05source = selectionItem === outputs.n05 ? N05 : '05e Parse adjudicate + reselect';
const extraction = P.buildExtraction({
  n05: selectionItem, reads: (aggregated && aggregated.reads) || [], cfg,
  docId: String(scen.paperless.id), fileSha256: scen.file_sha256 || 'unknown', packageId: 'PKG-' + scen.paperless.id,
  adjudication: selectionItem.adjudication || [], pageErrors: selectionItem.page_errors || {},
  taxidRetry: scen.taxid_retry || [], flowMeta: { build: 'js_flow' },
  calls: aggregated ? [aggregated.classify_call].concat(aggregated.calls || []) : [],
  adjudicateCalls: aggregated ? (aggregated.adjudicate_calls || []) : [],
  requiredFields: [],
});
const aiTape = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'rec', `${doc}_ai_tape.json`), 'utf8'));
const oraTape = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'rec', `${doc}_oracle_tape.json`), 'utf8'));
const usedAi = aiTape.map(() => false), usedOra = oraTape.map(() => false);
let aiCalls = 0, oraCalls = 0;
const aiCall = async (body) => {
  const key = tapeKey(body);
  for (let i = 0; i < aiTape.length; i++) {
    if (!usedAi[i] && tapeKey(aiTape[i].body) === key) {
      usedAi[i] = true; aiCalls++;
      return { choices: [{ message: { content: aiTape[i].text } }], usage: aiTape[i].usage || {} };
    }
  }
  throw new Error('rule-AI request not on the tape (js_flow): ' + key);
};
const sqlRun = async (sql) => {
  for (let i = 0; i < oraTape.length; i++) {
    if (!usedOra[i] && oraTape[i].sql.trim() === String(sql).trim()) { usedOra[i] = true; oraCalls++; return oraTape[i].csv; }
  }
  throw new Error('Oracle query not on the tape (js_flow):\n' + String(sql).slice(0, 300));
};
const enginePayload = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'rec', `${doc}_engine_payload.json`), 'utf8'));
const out = await P.validate(extraction, {
  std: P.Std(JSON.parse(fs.readFileSync(path.join(ROOT, 'standard.json'), 'utf8'))),
  request: enginePayload.request,
  models: enginePayload.versions.models,
  sqlRun, ai: { call: aiCall, model: (enginePayload.versions.models || {}).line_matcher || 'unknown' },
});
fs.writeFileSync(path.join(SCN, `${doc}_port.json`), JSON.stringify({
  extraction, payload: out.payload, node_outputs: outputs, n05source,
  tape: { ai_used: usedAi.filter(Boolean).length, ai_total: aiTape.length,
          ora_used: usedOra.filter(Boolean).length, ora_total: oraTape.length },
}, null, 1));
console.log(`DMS-${doc}  ${out.payload.recommendation.value}  reads=${(aggregated && aggregated.reads.length) || 0}`
  + ` lines=${extraction.lines.length} fields=${Object.keys(extraction.fields).length}`
  + ` regions=${extraction.regions.length} ai=${aiCalls}/${aiTape.length} oracle=${oraCalls}/${oraTape.length}`
  + ` sha=${out.payload.integrity.payload_sha256.slice(0, 26)}…  engine_sha=${enginePayload.integrity.payload_sha256.slice(0, 26)}…`);
