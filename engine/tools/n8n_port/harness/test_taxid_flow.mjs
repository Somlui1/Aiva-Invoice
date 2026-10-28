// test_taxid_flow.mjs — the R6-13 second look, offline, across the cases a live run cannot schedule.
//
// Runs the REAL node files (09t decide, 09b request, 09d accept/reject, 09z join) through a miniature n8n
// Code-node runtime — the same shape harness/js_flow.mjs uses — over synthetic batches. A live document fires
// the retry only if the model mis-reads a tax id today, so the accept / reject / one-per-document / switched-
// off cases can only be pinned here; the canvas plumbing for the same branch was proven live on draft
// execution 470 (300 DPI render -> rotate -> second call -> accept -> join -> bbox maths on 2479x3508).
//
// What each case protects:
//   no-fire      a correct tax id must not cost a second call (the engine pays for the retry, not the flow)
//   one-per-doc  the engine sets taxid_spent=True on the FIRST failing page; a flow that re-reads every
//                failing page spends calls and changes extra.taxid_retry, which is hashed contract
//   accept       the whole hi-res answer replaces the first one AND the frame it is measured on
//   reject       a re-read that is still wrong must leave the first read (and its pixels) in force, while the
//                attempt is still logged — "we looked again, it did not help" is payload-visible
//   off          PERCEPTION_TAXID_RETRY_DPI=0 disables the retry entirely (taxid_retry_dpi_from_env)
//
// Usage: node harness/test_taxid_flow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const NODES = path.join(ROOT, 'n8n_nodes_v58');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

let fails = 0;
const check = (cond, msg) => { console.log((cond ? '  OK   ' : '  FAIL ') + msg); if (!cond) fails++; };

// ---------------------------------------------------------------- the miniature Code-node runtime
let store = {}, current = null;
const helpers = {
  getBinaryDataBuffer: async (idx, prop) => {
    const bin = (store[current].bins || [])[idx] || {};
    const v = bin[prop];
    if (!v) throw new Error(`no binary "${prop}" on item ${idx} of ${current} (have: ${Object.keys(bin)})`);
    return Buffer.isBuffer(v) ? v : Buffer.from(String(v.data || v), 'base64');
  },
  prepareBinaryData: async (buf, fileName, mimeType) => ({
    data: Buffer.isBuffer(buf).toString('base64'), fileName, mimeType }),
};
const wrap = (items, bins, paired) => ({
  all: () => (items || []).map((j, i) => ({ json: j, binary: (bins || [])[i] || {} })),
  first: () => ({ json: (items || [])[0], binary: (bins || [])[0] || {} }),
});
const $ = (name) => {
  const rec = store[name];
  if (!rec) throw new Error(`node "${name}" has not run in this scenario`);
  return wrap(rec.items, rec.bins);
};
async function run(name, file, items, bins, storeAs) {
  current = storeAs || name;
  store[current] = { items: items || [], bins: bins || [] };
  const src = fs.readFileSync(path.join(NODES, file), 'utf8');
  const out = await new AsyncFunction('$input', '$', '$execution', '"use strict";\n' + src)
    .call({ helpers }, wrap(items, bins), (n) => $(n), { id: 'test-taxid' });
  if (!storeAs) store[name] = { items: (out || []).map((o) => o.json), bins: (out || []).map((o) => o.binary || {}) };
  return out || [];
}

// ---------------------------------------------------------------- fixtures
const jpeg = (w, h) => {                       // a real, minimal JPEG: node 08/09b read the SOF for dimensions
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, (h >> 8) & 255, h & 255, (w >> 8) & 255, w & 255,
                           0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
};
const GOOD = '0115512345671';                                    // passes normalize.tax_id
const BAD = '9999999999999';                                     // 13 digits, wrong check digit
const cell = (v) => ({ raw: v, bbox_2d: [10, 10, 200, 30] });
const answer = (sup, cus) => JSON.stringify({
  fields: { invoice_num: cell('IV-1'), supplier_tax_id: sup === null ? null : cell(sup),
            customer_tax_id: cus === null ? null : cell(cus) },
  line_items: [], occurrences: {}, regions: [], handwritten_refs: [],
});
const CFG = { model: 'test/model', temperature: 0, max_tokens: 8000, coord: 'norm1000',
              dpi_extract: 150, taxid_retry_dpi: 300, ext_key: 'tax_page_', thinking_models: [],
              prompt_extract: 'Read page {page_no} of the document.\n', colors: {}, label_max_chars: 40,
              max_boxes: 40 };

const reqFor = (page, w, h) => ({ page_no: page, img_w: w, img_h: h, orig_w: w, orig_h: h, rotate_degrees: 0,
                                  render_dpi: 150, model: CFG.model, max_tokens_used: CFG.max_tokens });
const httpAnswer = (text) => ({ choices: [{ message: { content: text } }], usage: {} });

async function scenario({ pages, hi }) {
  store = {};
  store['00 CONFIG (single point)'] = { items: [CFG], bins: [] };
  const reqs = pages.map((p) => reqFor(p.page_no, 1240, 1754));
  store['08 Build extract request'] = { items: reqs, bins: pages.map(() => ({})) };
  store['07 Rotate invoice page upright'] = {
    items: pages.map((p) => ({ page_no: p.page_no, rotate_degrees: 0, render_dpi: 150 })),
    bins: pages.map(() => ({ page: jpeg(1240, 1754), pre: jpeg(1240, 1754) })) };
  store['Get a document'] = { items: [{ id: 'test' }], bins: [{ data: Buffer.from('%PDF-1.4 test') }] };
  const answers = pages.map((p) => httpAnswer(p.answer));
  const tri = await run('09t Tax-id triage', '09t_taxid_triage.js', answers, pages.map(() => ({})));
  const flagged = tri.filter((t) => t.json.taxid_retry_page);
  if (flagged.length) {
    const hiKey = 'tax_page_' + flagged[0].json.taxid_retry_page;
    store['09r Render 300 DPI (tax-id)'] = { items: [{ page_no: flagged[0].json.taxid_retry_page }],
                                             bins: [{ [hiKey]: jpeg(2479, 3508) }] };
    const prep = await run('09o Prep re-read frame', '09o_taxid_prep.js', [{}], [store['09r Render 300 DPI (tax-id)'].bins[0]]);
    const rotBin = [{ page: jpeg(2479, 3508), hi_raw: jpeg(2479, 3508), pre: prep[0].binary.pre }];
    store['09rot Rotate re-read upright'] = { items: prep.map((p) => p.json), bins: rotBin };
    const rq = await run('09b Build re-read request', '09b_taxid_request.js', prep.map((p) => p.json), rotBin);
    const hiPage = flagged[0].json.taxid_retry_page;
    const hiText = typeof hi === 'function' ? hi(hiPage) : hi;
    const merged = await run('09d Merge tax-id re-read', '09d_taxid_merge.js',
      hiText === null ? [{ error: { message: 'socket hang up' } }] : [httpAnswer(hiText)], [{}]);
    store['09d Merge tax-id re-read'] = { items: merged.map((m) => m.json), bins: merged.map((m) => m.binary) };
  }
  const joined = await run('09z Assemble extract reads', '09z_taxid_join.js',
    tri.map((t) => t.json), tri.map((t) => t.binary));
  return { tri, flagged, joined };
}

// ---------------------------------------------------------------- the five cases
let r = await scenario({ pages: [{ page_no: 1, answer: answer(GOOD, GOOD) }] });
check(r.flagged.length === 0, 'no-fire: a valid tax id spends no second call');
check(r.joined.length === 1 && r.joined[0].json.render_dpi === 150, 'no-fire: the 150 DPI frame stays in force');

r = await scenario({ pages: [{ page_no: 1, answer: answer(BAD, GOOD) }, { page_no: 3, answer: answer(BAD, BAD) }],
                     hi: () => answer(BAD, BAD) });
check(r.flagged.length === 1 && r.flagged[0].json.taxid_retry_page === 1,
      'one-per-document: only the first failing page fires, later failing pages are left alone');
check(r.flagged[0].json.taxid_reason === 'TAX_ID_CHECKSUM', 'the reason is the engine code, not prose');
check(r.joined.length === 2, 'a rejected re-read still yields one item per selected page');
const rej = r.joined.find((j) => j.json.page_no === 1).json;
check(rej.taxid_replaced !== true && rej.render_dpi === 150 && rej.answer_text.includes(BAD),
      'reject: the re-read that is still wrong loses — first answer AND first frame stay');
check(JSON.stringify(rej.taxid_retry) === JSON.stringify([{ page: 1, reason: 'TAX_ID_CHECKSUM', dpi: 300, accepted: false }]),
      'reject: the attempt is still logged (page/reason/dpi/accepted=false)');

r = await scenario({ pages: [{ page_no: 1, answer: answer(BAD, null) }, { page_no: 3, answer: answer(GOOD, null) }],
                     hi: (p) => answer(GOOD, null) });
const acc = r.joined.find((j) => j.json.page_no === 1).json;
check(acc.taxid_replaced === true && acc.render_dpi === 300 && acc.orig_w === 2479 && acc.img_h === 3508,
      'accept: the hi-res answer arrives with the hi-res frame (engine swaps infos[p], not just the answer)');
check(acc.answer_text.includes(GOOD), 'accept: the whole high-resolution answer replaces the first one');
check(r.joined.find((j) => j.json.page_no === 3).json.render_dpi === 150,
      'accept: the other page is untouched — the retry is per page, not per document render');
check(JSON.stringify(acc.taxid_retry) === JSON.stringify([{ page: 1, reason: 'TAX_ID_CHECKSUM', dpi: 300, accepted: true }]),
      'accept: logged with accepted=true');

r = await scenario({ pages: [{ page_no: 1, answer: answer(BAD, null) }], hi: null });
const net = r.joined[0].json;
check(net.taxid_replaced !== true && net.answer_text.includes(BAD) && net.render_dpi === 150,
      'a failed re-read request (node 09c onError=continueOnFail) keeps the first read, like the engine try/except');
check(net.taxid_retry.length === 1 && net.taxid_retry[0].accepted === false,
      'a failed re-read is still logged');

CFG.taxid_retry_dpi = 0;
r = await scenario({ pages: [{ page_no: 1, answer: answer(BAD, null) }], hi: () => answer(GOOD, null) });
check(r.flagged.length === 0, 'off: PERCEPTION_TAXID_RETRY_DPI=0 never re-reads, even on a broken tax id');
CFG.taxid_retry_dpi = 300;

console.log();
console.log(fails ? `R6-13 FLOW TEST: FAIL (${fails})` : 'R6-13 FLOW TEST: PASS');
process.exit(fails ? 1 : 0);
