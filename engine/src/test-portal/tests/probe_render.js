/* Runs the real webapp/static/app.js over view models the server really produced.

     python tests/probe_compare.py --json .probe        # writes .probe/view_<shape>.json
     node tests/probe_render.js .probe                   # renders each one and checks what app.js drew

There is no headless browser in this project, so this loads app.js in a sandbox with the smallest DOM it
touches and calls the panel functions with a genuine screen model — the same JSON
/api/documents/{id}/result returns. For every shape it prints one line

     EVIDENCE {"shape":...,"rows":...,"oracle_ids":[...],"invoice_descs":[...],"labels":[...],...}

which tests/test_render_node.py asserts on, plus a short readable strip of the table for a human. It exits 1
when a row of either list is missing from the table or a row that needs review would be hidden by the filter.
*/
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
try { process.stdout.setDefaultEncoding('utf8') } catch (e) { }   // Thai labels survive a pipe on Windows

const HERE = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(HERE, 'webapp', 'static', 'app.js'), 'utf8');
const OUT = path.resolve(process.argv[2] || '.probe');

/* ---------- the least DOM app.js needs in order to boot ---------- */
function stubEl() {
  return { innerHTML: '', textContent: '', value: '', checked: true, disabled: false, dataset: {}, style: {},
    classList: { add() { }, remove() { }, contains() { return false } },
    addEventListener() { }, appendChild() { }, setAttribute() { }, focus() { },
    querySelector() { return null }, querySelectorAll() { return [] }, closest() { return null },
    contains() { return false }, scrollIntoView() { }, onclick: null, onchange: null };
}
const els = {};
const ctx = {
  console, setTimeout: () => 0, clearTimeout() { }, setInterval: () => 0, clearInterval() { },
  document: { getElementById: id => (els[id] = els[id] || stubEl()), addEventListener() { },
    querySelector: () => null, querySelectorAll: () => [], createElement: stubEl, body: stubEl() },
  localStorage: { getItem: () => null, setItem() { }, removeItem() { } },   // filter chip = "all"
  addEventListener() { }, removeEventListener() { }, innerWidth: 1400, innerHeight: 900,
  performance: require('perf_hooks').performance,
  fetch: async (url) => ({
    ok: true, status: 200, json: async () => String(url).includes('/api/documents') ? []
      : { engine: 'inprocess', mode: 'sandbox', persist: false, element_types: ['field', 'row'],
        default_types: ['field'], colors: {}, source: { base_url: 'sandbox', tag: 'invoice' } },
  }),
};
vm.createContext(ctx);
vm.runInContext(SRC + '\n;globalThis.__probe = { cmpHtml, resultHtml, stOf, O_ST };', ctx, { filename: 'app.js' });
const P = ctx.__probe;

const fails = [];
const fail = (shape, why) => fails.push(`${shape}: ${why}`);
const has = (shape, html, needle, label) => { if (!html.includes(needle)) fail(shape, `${label} missing ${JSON.stringify(needle)}`) };
const strip = h => h.replace(/<[^>]+>/g, '|').replace(/\|+/g, ' | ').replace(/\s+/g, ' ').trim();
const trs = html => html.match(/<tr class="cmp-r[\s\S]*?<\/tr>/g) || [];

for (const file of fs.readdirSync(OUT).filter(f => f.startsWith('view_') && f.endsWith('.json')).sort()) {
  const shape = file.replace(/^view_/, '').replace(/\.json$/, '');
  const v = JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
  P.stOf(1).view = v; P.stOf(1).state = 'done';

  const cmp = P.cmpHtml(v), panel = P.resultHtml(1);
  const rows = (v.oracle_lines || {}).items || [], lines = (v.lines || {}).items || [];
  const tr = trs(cmp), need = tr.filter(t => t.includes('cmp-need'));
  const pairs = lines.reduce((a, l) => a + (l.oracle || []).length, 0);
  const named = new Set(lines.flatMap(l => (l.oracle || []).map(o => o.id)));      // rows an invoice line shows
  const lone = rows.filter(o => o.status !== 'matched');
  const unclaimed = rows.filter(o => !(o.line_nos || []).length && !named.has(o.id));
  const alone = lines.filter(l => !(l.oracle || []).length);
  const labels = Object.values(P.O_ST).map(x => x[1]).filter(x => cmp.includes(x));

  /* one row per invoice line, plus one per Oracle row no invoice line shows; nothing else */
  const expect = lines.length + unclaimed.length;
  if (tr.length !== expect) fail(shape, `${tr.length} rows drawn, expected ${expect}`);
  rows.forEach(o => has(shape, cmp, String(o.id), 'Oracle row'));
  lines.forEach(l => has(shape, cmp, String(l.desc), 'invoice line'));
  ['undefined', 'NaN', '[object Object]'].forEach(x => {
    if (cmp.includes(x) || panel.includes(x)) fail(shape, `the screen prints ${x}`);
  });
  ['เทียบรายการ Oracle ↔ invoice', 'Verify Result', 'Final Result'].forEach(x => has(shape, panel, x, 'panel'));

  ['normalized_fields.items', 'oracle_snapshot.receipt_lines', 'line_matching.groups', 'ไม่ได้คำนวณ']
    .forEach(x => has(shape, cmp, x, 'table header'));
  /* a row worth looking at must survive the "เฉพาะที่ต้องตรวจ" filter, which is what the class drives */
  lone.forEach(o => {
    if (!need.some(t => t.includes(String(o.id)))) fail(shape, `${o.id} is ${o.status} but the filter hides it`);
    has(shape, cmp, P.O_ST[o.status] ? P.O_ST[o.status][1] : o.status, `status label of ${o.id}`);
  });
  alone.forEach(l => {
    const tag = `บรรทัด ${l.no}`;
    if (!need.some(t => t.includes(tag))) fail(shape, `invoice line ${l.no} has no pair but the filter hides it`);
    has(shape, cmp, '— ฝั่ง Oracle ไม่มีบรรทัดนี้', `empty Oracle cell of line ${l.no}`);
  });

  console.log('EVIDENCE ' + JSON.stringify({
    shape, rows: tr.length, pairs, lone: lone.map(o => o.id), alone: alone.map(l => l.no),
    unclaimed: unclaimed.map(o => o.id),
    flagged: need.length, oracle_ids: rows.map(o => o.id), invoice_descs: lines.map(l => String(l.desc)),
    oracle_status: rows.map(o => o.status), labels,
    chips: ['ทั้งหมด', 'เฉพาะที่ต้องตรวจ'].filter(x => cmp.includes(x)),
  }));
  console.log('       ' + strip(cmp).slice(0, 260) + ' …');
}

if (fails.length) { console.error('\nFAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log(`\nOK: app.js drew ${fs.readdirSync(OUT).length} view models from the payload, nothing invented`);
