// รัน jsCode ของ node "12 Build final JSON + images" (ฉบับ patch ใน blackbox.json) แบบ offline
// จุดประสงค์: จับบั๊กประเภท "null.length" แบบ exec 398 ที่ compile test จับไม่ได้
// mock ให้ครบเฉพาะสิ่งที่ node 12 ใช้: $(), $execution, this.helpers
import fs from 'node:fs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const bb = JSON.parse(fs.readFileSync('blackbox.json', 'utf8'));
const code = bb.nodes.find((n) => n.name === '12 Build final JSON + images').parameters.jsCode;

const CFG = { doc_id: 89, standard: 'v6.6', model: 'nvidia/Qwen3.8-Flash-Next-NVFP4', dpi_classify: 80, dpi_extract: 150 };
const SEL = { invoice_page: 1, doc_no_hint: 'TST-1', doc_type: 'tax_invoice', is_original: true, multi_invoice_detected: false,
  selected_invoice_pages: [1], pages_complete: true, selection: { mode: 'test' }, pages_classification: [{ page: 1, kind: 'invoice' }],
  classify_calls: 1, total_pages: 1, fallback_used: false, ext_key: 'page' };
const S10 = { img_w: 1240, img_h: 1754, overlay: [{ x0: 10, y0: 20, x1: 30, y1: 40, color: '#ff0000', label: 'A' }],
  elements: [], fields: {}, occurrences: [], line_items: [], regions: {}, handwritten_refs: [], dropped_boxes: [],
  answer_parse_error: null, bboxes_drawn: 20, boxes_candidates: 20, truncated: false };
const USAGE = { prompt_tokens: 100, completion_tokens: 50 };

const JSONS = {
  '00 CONFIG (single point)': CFG,
  '05 Parse classify pick invoice pages': SEL,
  '10 Bbox math pixels + sanitize': S10,
  '04 VLM step 1 classify pages': { usage: USAGE },
  '09 VLM step 2 extract bbox': { usage: USAGE },
};

let fail = 0;
const bad = (m) => { console.log('  ✗ ' + m); fail++; };

async function run({ hasAnnotated }) {
  const PAGE = Buffer.alloc(1024, 7);
  const helpers = {
    getBinaryDataBuffer: async (_i, key) => {
      if (key === 'page') return PAGE;
      if (key === 'annotated') { if (hasAnnotated) return Buffer.alloc(512, 9); throw new Error("binary property 'annotated' not found"); }
      throw new Error('unexpected binary key: ' + key);
    },
    prepareBinaryData: async (buf, fileName, mimeType) => ({ fileName, mimeType, bytes: buf.length, id: 'mock-' + fileName }),
  };
  const $ = (name) => {
    if (!(name in JSONS)) throw new Error('node 12 อ่าน node ที่ไม่มีใน stub: ' + name);
    return { first: () => ({ json: JSONS[name] }) };
  };
  const $input = { first: () => ({ json: {}, binary: { page: {} } }) };
  const $execution = { id: 'offline-test' };
  const fn = new AsyncFunction('$', '$input', '$json', '$execution', 'helpers', code);
  return fn.call({ helpers }, $, $input, {}, $execution, helpers);
}

console.log('--- A) blackbox จริง: ไม่มี annotated ---');
const a = (await run({ hasAnnotated: false }))[0];
const keysA = Object.keys(a.binary || {}).sort();
console.log('  binary keys : %s', keysA.join(','));
console.log('  images      : overlay=%s img=%sx%s annotated_bytes=%s original_bytes=%s',
  a.json.images.overlay?.length, a.json.images.img_w, a.json.images.img_h, a.json.images.annotated_bytes, a.json.images.original_bytes);
console.log('  result      : contract=%s/%s rule_results=%s', a.json.result.contract.name, a.json.result.contract.version, a.json.result.rule_results.status);
if (keysA.join(',') !== 'page_original') bad('binary ต้องมีแค่ page_original, ได้ ' + keysA.join(','));
if (a.json.images.annotated_bytes !== null) bad('annotated_bytes ต้องเป็น null, ได้ ' + a.json.images.annotated_bytes);
if (!a.json.images.overlay || a.json.images.overlay.length !== 1) bad('overlay ไม่ถูกแนบใน images');
if (a.json.images.img_w !== 1240 || a.json.images.img_h !== 1754) bad('img_w/img_h ไม่ตรง');
if (a.json.result.contract.version !== '3.0') bad('contract ผิด');

console.log('--- B) สายเก่า (ยังมี annotated) ต้องยังทำงานได้ ---');
const b = (await run({ hasAnnotated: true }))[0];
const keysB = Object.keys(b.binary || {}).sort();
console.log('  binary keys : %s', keysB.join(','));
console.log('  images      : annotated_bytes=%s', b.json.images.annotated_bytes);
if (keysB.join(',') !== 'annotated,page_original') bad('สายเก่าควรมี 2 คีย์, ได้ ' + keysB.join(','));
if (b.json.images.annotated_bytes !== 512) bad('annotated_bytes ควรเป็น 512');

console.log(fail ? '\nFAIL %d ข้อ' : '\nALL PASS', fail);
