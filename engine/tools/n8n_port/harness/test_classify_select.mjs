// Phase A2 gate, offline: node 05's page selection must agree with python's normalize_classify +
// select_invoice_pages on the same classify answers.
//
//   python harness/make_classify_cases.py     # regenerate cases + python's answers
//   node harness/test_classify_select.mjs
//
// v5.8: the "no invoice page" case is NO LONGER an accepted exception. Node 05 now returns selected=[] +
// no_invoice_page + pages_complete=false exactly like python ("no guessing page 1"), and the flow routes
// that branch (IF node "05b") straight to node 21, which builds an extraction with zero reads -> E01/REVIEW.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const code = fs.readFileSync(path.join(ROOT, 'n8n_nodes_v58', '05_parse_classify.js'), 'utf8');
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'classify_cases.json'), 'utf8'));
const isEmptyCase = (c) => c.selection.no_invoice_page === true;

const pdfBinary = { data: { id: 'x' } };
globalThis.$input = { all: () => [{ json: { n_pages: 0 } }] };

let bad = 0, skipped = 0;
for (const c of cases) {
  // node 04 (httpRequest) hands node 05 the raw OpenAI response; the pages live in choices[0].message.content
  globalThis.$input = { all: () => [{ json: { choices: [{ message: { content: JSON.stringify(c.raw) } }] } }] };
  globalThis.$ = (name) => {
    if (name.startsWith('03 ')) {
      return { first: () => ({ json: { n_pages: c.n_pages, page_dims: Array.from({ length: c.n_pages }, (_, i) => ({ page_no: i + 1, key: 'cls_page_' + (i + 1), w_px: 660, h_px: 935, bytes: 40000, mime: 'image/jpeg' })) } }) };
    }
    if (name.startsWith('00 CONFIG')) return { first: () => ({ json: { model: 'nvidia/Qwen3.8-Flash-Next-NVFP4', dpi_classify: 80 } }) };
    if (name.startsWith('Get a document')) return { first: () => ({ json: {}, binary: { data: pdfBinary.data } }) };
    throw new Error('stub me: ' + name);
  };
  let got;
  try {
    const out = await new AsyncFunction(code).call({ helpers: {} });
    got = out[0].json;
  } catch (e) {
    console.log(`FAIL ${c.name}: node threw: ${e.message}`);
    bad++; continue;
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const diffs = [];
  if (!same(got.pages_classification, c.pages_classification)) {
    for (let i = 0; i < Math.max(got.pages_classification.length, c.pages_classification.length); i++) {
      if (!same(got.pages_classification[i], c.pages_classification[i])) {
        diffs.push(`page[${i}] got ${JSON.stringify(got.pages_classification[i])} want ${JSON.stringify(c.pages_classification[i])}`);
      }
    }
  }
  if (!same(got.selection, c.selection)) {
    for (const k of [...new Set(Object.keys({ ...c.selection, ...got.selection }))]) {
      if (!same(got.selection[k], c.selection[k])) diffs.push(`selection.${k}: got ${JSON.stringify(got.selection[k])} want ${JSON.stringify(c.selection[k])}`);
    }
  }
  if (!same(got.selected_invoice_pages, c.selected)) diffs.push(`selected: got ${JSON.stringify(got.selected_invoice_pages)} want ${JSON.stringify(c.selected)}`);
  if (got.invoice_page !== c.invoice_page && !(c.selected || []).length) diffs.push(`invoice_page: got ${got.invoice_page} want ${c.invoice_page}`);
  if (diffs.length && isEmptyCase(c)) {
    bad++;
    console.log(`FAIL ${c.name} (empty-read branch must now match python)`);
    for (const d of diffs.slice(0, 4)) console.log(`      ${d}`);
    continue;
  }
  if (diffs.length) {
    bad++;
    console.log(`FAIL ${c.name}`);
    for (const d of diffs.slice(0, 4)) console.log(`      ${d}`);
  } else {
    console.log(`ok   ${c.name}  -> selected ${JSON.stringify(got.selected_invoice_pages)}`);
  }
}
console.log(bad ? `\nNODE 05 SELECTION DIFFERS FROM PYTHON in ${bad} case(s)`
  : `\nnode 05 matches python on ${cases.length}/${cases.length} classify answers (empty selection included)`);
process.exitCode = bad ? 1 : 0;
