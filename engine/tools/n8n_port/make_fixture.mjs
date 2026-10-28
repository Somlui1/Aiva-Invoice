// make_fixture.mjs — exec 357 (real n8n output) -> fixtures/extraction.json (aiva.extraction/2.0)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));
const std = P.Std(JSON.parse(fs.readFileSync(path.join(ROOT, 'standard.json'), 'utf8')));
const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'exec357_nodes.json'), 'utf8'));
const cfg = { dpi_extract: 150, model: 'nvidia/Qwen3.8-Flash-Next-NVFP4' };
const extraction = P.buildExtraction({
  n05: ex['05 Parse classify pick invoice pages'],
  n08: ex['08 Build extract request'],
  n10: ex['10 Bbox math pixels + sanitize'],
  cfg, docId: 23, packageId: 'PKG-23', fileSha256: 'sha256:' + '0'.repeat(64),
  requiredFields: std.policy.required_fields
});
fs.writeFileSync(path.join(ROOT, 'fixtures', 'extraction.json'), JSON.stringify({ extraction, portal_refs: { document_revision: 1, validation_round: 1 } }, null, 1));
console.log('fixtures/extraction.json: pages=' + extraction.pages.length + ' docs=' + extraction.documents.length +
  ' fields=' + Object.keys(extraction.fields).length + ' lines=' + extraction.lines.length +
  ' regions=' + extraction.regions.length + ' sigs=' + Object.keys(extraction.signatures).join(','));
console.log('invoice_num=' + extraction.fields.invoice_num.raw + ' po=' + extraction.fields.po_number.raw +
  ' supplier_tax=' + JSON.stringify(extraction.fields.supplier_tax_id && extraction.fields.supplier_tax_id.raw) +
  ' sub_total=' + extraction.fields.sub_total.raw + ' vat=' + extraction.fields.vat.raw + ' total=' + extraction.fields.grand_total.raw);
