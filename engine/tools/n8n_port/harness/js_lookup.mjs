// js_lookup.mjs — replay the recorded Oracle tape through the JS port and dump the same snapshot.
//   node harness/js_lookup.mjs   -> fixtures/lookup_js.json   (diff against fixtures/lookup_py.json)
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
const tape = JSON.parse(fs.readFileSync(path.join(FIX, (process.argv[2] || 'oracle_rows.json')), 'utf8'));
const [doc, meta] = P.normalizeDocument(ext, std);
const lk = std.policy.oracle.lookup;

const invKey = (doc.fields.invoice_num || {}).value, poKey = (doc.fields.po_number || {}).value;
const supKey = (doc.fields.supplier_tax_id || {}).value;
const invCands = P.documentCandidates(ext.extra, invKey, {
  pageTypes: lk.invoice_candidate_page_types || [], labels: lk.invoice_candidate_labels || [],
  exclude: (meta.po_numbers || []).concat(poKey ? [poKey] : []), receiptPatterns: lk.receipt_num_patterns || []
});
const rcvCands = P.receiptNumCandidates(ext.extra, lk.receipt_num_patterns || [], parseInt(lk.receipt_num_max_candidates || 2, 10));

let i = 0;
const sqlRun = async (sql) => { const e = tape[i++]; if (!e) throw new Error('tape exhausted at ' + sql.slice(0, 60)); return e.csv; };
const repo = new P.McpOracleRepository(sqlRun, { rowCap: std.policy.oracle.row_cap, matchColumns: lk.invoice_match_columns, rowCaps: lk.row_caps || {} });
const session = new P.OracleSession(repo, std.policy.oracle.row_cap, {
  maxQueries: std.policy.oracle.max_queries_per_round, lookupCfg: lk, rowCaps: lk.row_caps || {}
});
const snap = await session.lookupTaxInvoice(invKey, {
  ocrSupplierTaxId: supKey, poNumber: poKey, invoiceCandidates: invCands, receiptCandidates: rcvCands,
  customerTaxId: (doc.fields.customer_tax_id || {}).value, subTotal: (doc.fields.sub_total || {}).value,
  totalTol: P.dStr(std.tol('total'))
});
const snapshot = {
  queried_at: 'T', lookup_path: snap.lookup_path, query_keys: snap.query_keys, rows: snap.rows.map(P.rowPayload),
  row_cap_hit: snap.row_cap_hit, calls: snap.calls, po_numbers: snap.po_numbers, matched_on_column: snap.matched_on_column
};
fs.writeFileSync(path.join(FIX, 'lookup_js.json'), JSON.stringify({
  snapshot: JSON.parse(JSON.stringify(snapshot)),
  trace: session.trace.slice(), calls: session.calls, invoice_candidates: invCands, receipt_candidates: rcvCands,
  keys: { invoice_num: invKey, po_number: poKey, supplier_tax_id: supKey, customer_tax_id: (doc.fields.customer_tax_id || {}).value, sub_total: (doc.fields.sub_total || {}).value },
  rejected: session.rejected.slice()
}, null, 1));
console.log('lookup path=%s rows=%d calls=%d trace=%s', snapshot.lookup_path, snapshot.rows.length, snapshot.calls, session.trace.join(','));
