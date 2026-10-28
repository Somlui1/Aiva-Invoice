// JS side of the differential tests: normalize + SQL rendering of the SAME fixture.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));
const FIX = path.join(ROOT, 'fixtures');
const std = P.Std(JSON.parse(fs.readFileSync(path.join(ROOT, 'standard.json'), 'utf8')));
const ext = JSON.parse(fs.readFileSync(path.join(FIX, 'extraction.json'), 'utf8')).extraction;

const [doc, meta] = P.normalizeDocument(ext, std);
const nf = (f) => ({ name: f.name, element_id: f.element_id, raw: f.raw, value: f.value, confidence: f.confidence, ok: f.ok, null_reason: f.null_reason, evidence: f.evidence });
const out = {
  fields: Object.fromEntries(Object.entries(doc.fields).sort().map(([k, v]) => [k, nf(v)])),
  lines: doc.lines.map(l => ({ line_no: l.line_no, element_id: l.element_id, uom_group: l.uom_group, po_refs: l.po_refs, region: l.region, cells: Object.fromEntries(Object.entries(l.cells).sort().map(([k, v]) => [k, nf(v)])) })),
  signatures: Object.fromEntries(Object.entries(doc.signatures || {}).sort().map(([k, v]) => [k, { present: v.present, confidence: v.confidence, kind: v.kind, region: v.region }])),
  pages_complete: doc.pages_complete, document_id: doc.document_id, meta
};
fs.writeFileSync(path.join(FIX, 'js_norm.json'), JSON.stringify(out, null, 1));

const policy = std.policy.oracle;
const repo = new P.McpOracleRepository(async (sql) => '', { rowCap: policy.row_cap, matchColumns: policy.lookup.invoice_match_columns, rowCaps: policy.row_caps || {} });
const calls = [
  ['rcvV01', ['42052615', 'TLP-IV-69-09-0025']],
  ['supplierTaxByPo', ['42052615']],
  ['rcvV02', ['0105549023741', 'TLP-IV-69-09-0025']],
  ['receiptsByTaxInvoice', ['0105549023741', ['TLP-IV-69-09-0025', 'TLP-IV-69-09-0025'.replaceAll('/', ''), 'TLP-IV-69-09-0025'.replaceAll('.', '')]]],
  ['receiptsByTaxInvoiceSuffix', ['0105549023741', ['TLP-IV-69-09-0025']]],
  ['receiptsByPoVendorInvoice', ['42052615', ['TLP-IV-69-09-0025']]],
  ['receiptsByReceiptNum', ['0105549023741', '50220043380']],
  ['receiptsByPoList', [['42052615']]]
];
for (const [m, args] of calls) { try { await repo[m](...args); } catch (e) { console.log('call ' + m + ' threw: ' + e.message); } }
fs.writeFileSync(path.join(FIX, 'js_sql.json'), JSON.stringify(repo.audit.map(e => ({ query_id: e.query_id, binds: e.binds, sql: e.sql })), null, 1));
console.log('js_norm.json + js_sql.json written (sql entries: ' + repo.audit.length + ')');
