// Phase A2 gate, offline: run the *real* replacement code of node 03 / node 08 in a sandbox and require the
// request they build to match the engine's recorded request - same text bytes, same knobs, same image order.
// Nothing is sent anywhere; the images are dummy bytes because the tape comparison ignores image content.
//
//   node harness/test_request_shape.mjs            # default doc 116 (5 pages)
//   node harness/test_request_shape.mjs 107
//
// The CONFIG values come from the live node 00 (live/after_sync_draft.json) exactly as stored - including
// the fact that prompt_extract is stored one character shorter than the prompt file.  If the newline guard
// in node 08 is removed, the extract text differs by one character and this test fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const NODES = path.join(ROOT, 'n8n_nodes_v58');
const DOC = process.argv[2] || '116';
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

const read = (p) => fs.readFileSync(p, 'utf8');
const tape = JSON.parse(read(path.join(ROOT, 'fixtures', 'rec', `${DOC}_ai_tape.json`)));
const engineEx = JSON.parse(read(path.join(ROOT, 'fixtures', 'rec', `${DOC}_extraction.json`)));
const draft = JSON.parse(read(path.join(ROOT, 'live', 'after_sync_draft.json')));

// ---- the live 00 CONFIG, value for value, as n8n stores it ------------------------------------------
const cfg = {};
for (const a of (draft.nodes.find((n) => n.name.startsWith('00 CONFIG')).parameters.assignments.assignments)) {
  cfg[a.name] = a.value;
}
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAg=' + 'A'.repeat(400), 'base64');
// Node 08 measures the frame it is about to send (it needs the pixel size to scale boxes back), so the dummy
// image has to carry a real SOF marker — a JPEG header with a declared width/height, not filler bytes.
const jpegSized = (w, h) => Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, (h >> 8) & 255, h & 255, (w >> 8) & 255, w & 255,
               0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]),
  Buffer.from([0xff, 0xd9])]);
const PAGE = { w: 1240, h: 1754 };                       // 150 DPI on an A4 sheet, what node 06 produces
const helpers = { async getBinaryDataBuffer() { return jpegSized(PAGE.w, PAGE.h); } };

function textsOf(body) {
  return (body.messages[0].content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}
function imagesOf(body) {
  return (body.messages[0].content || []).filter((c) => c.type === 'image_url').map((c) => c.image_url.url.slice(0, 23));
}
function runNode(file, extra) {
  const $ = (name) => {
    if (name.startsWith('00 CONFIG')) return { first: () => ({ json: cfg }) };
    if (name.startsWith('06b') && extra && extra['06b']) {          // node 08 reads the page off its pair
      return { first: () => ({ json: extra['06b'] }), item: { json: extra['06b'] } };
    }
    if (extra && extra[name.slice(0, 2)]) return { first: () => ({ json: extra[name.slice(0, 2)] }) };
    throw new Error('stub me: ' + name);
  };
  globalThis.$ = $;
  // Nodes 08/10 run Run Once for All Items and LOOP (per-item mode forbids .first(), and node 00's config is
  // only reachable through .first()), so the sandbox has to offer all() as well as first().
  globalThis.$input = {
    first: () => extra.$input,
    all: () => (extra.$items || [extra.$input || {}]).map((j) => ({ json: j.json || {}, binary: j.binary || {} })),
  };
  return new AsyncFunction(read(path.join(NODES, file))).call({ helpers });
}

let bad = 0;
const check = (label, got, want) => {
  const ok = got === want;
  if (!ok) bad++;
  console.log(`   ${ok ? 'ok  ' : 'DIFF'} ${label}: ${ok ? JSON.stringify(got).slice(0, 60) : `got ${JSON.stringify(got).slice(0, 70)} want ${JSON.stringify(want).slice(0, 70)}`}`);
};

// ---------------- node 03: one classify request, every page as its own image ----------------------
{
  const want = tape.find((e) => textsOf(e.body).includes('prompt_id: single-pass-classify'));
  const n = imagesOf(want.body).length;
  const bin = {};
  for (let i = 1; i <= n; i++) bin['cls_page_' + i] = {};
  const out = await runNode('03_classify_multimage.js', { $input: { json: {}, binary: bin } });
  const got = JSON.parse(out[0].json.llmBody);
  console.log(`node 03  (${n} pages in one request)`);
  check('text byte-identical to engine', textsOf(got), textsOf(want.body));
  check('image count', imagesOf(got).length, n);
  check('image mime', imagesOf(got)[0], imagesOf(want.body)[0]);
  check('max_tokens', got.max_tokens, want.body.max_tokens);
  check('temperature', Number(got.temperature), Number(want.body.temperature));
  check('model', got.model, want.body.model);
  check('enable_thinking', JSON.stringify(got.chat_template_kwargs), JSON.stringify(want.body.chat_template_kwargs));
  check('no response_format', got.response_format === undefined, true);
  check('page count reported', out[0].json.n_pages, n);
}

// ---------------- node 08: extract prompt byte-identical (the {page_no} + newline case) ----------
{
  const want = tape.find((e) => textsOf(e.body).includes('prompt_id: single-pass-extract'));
  const pageNo = (engineEx.pages && engineEx.pages[0] && (engineEx.pages[0].page_no || engineEx.pages[0].page)) || 1;
  const out = await runNode('08_extract_request.js', {
    $input: { json: {}, binary: { page: {} } },
    $items: [{ json: { page_no: pageNo, rotate_degrees: 0, render_dpi: 150 },
               binary: { page: jpegSized(PAGE.w, PAGE.h), pre: jpegSized(PAGE.w, PAGE.h) } }],
    '05': { invoice_page: pageNo, ext_key: 'ext_page_' + pageNo, rotate_degrees: 0 },
    '06b': { page_no: pageNo, rotate_degrees: 0, render_dpi: 150 },
  });
  const got = JSON.parse(out[0].json.llmBody);
  console.log(`node 08  (page ${pageNo} extract request)`);
  check('text byte-identical to engine', textsOf(got), textsOf(want.body));
  check('one image', imagesOf(got).length, 1);
  check('max_tokens', got.max_tokens, want.body.max_tokens);
  check('enable_thinking', JSON.stringify(got.chat_template_kwargs), JSON.stringify(want.body.chat_template_kwargs));
  console.log(`   note: engine sends ${imagesOf(want.body)[0]}, the flow sends ${imagesOf(got)[0]}`
  + ` (node 07 encodes jpeg quality ${cfg.jpeg_quality || '?'}; engine quality is 90)`);
}
console.log(bad ? `\nREQUEST SHAPE DIFFERS FROM THE ENGINE in ${bad} check(s)` : '\nrequest shape matches the engine (classify multi-image + extract prompt)');
process.exitCode = bad ? 1 : 0;
