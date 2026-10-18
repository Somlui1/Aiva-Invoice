import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';
import { MENU_CONFIG } from '../src/components/layout/menuConfig.js';
import { REAL_125_INVOICES } from '../src/mock/real125Invoices.js';
import { ORACLE_RECEIPTS_BY_DOC } from '../src/mock/oracleReceipts.js';
import { COMPANIES_26 } from '../src/mock/companies26.js';

test('End-to-End smoke: 125 documents, Oracle receipts, and menu integration', async () => {
  // 1. Invoices
  const docs = await api.getDocuments();
  assert.equal(docs.length, 125, 'Total 125 documents must be available');
  
  // 2. Oracle Receipts
  const receipts = await api.getOracleReceipts(docs[0].doc);
  assert.ok(Array.isArray(receipts), 'Oracle receipts must return array');
  
  // 3. Companies
  const companies = await api.getCompanies();
  assert.equal(Object.keys(companies).length, 26, '26 AAPICO companies must be present');
  
  // 4. Menu configuration
  const totalMenus = MENU_CONFIG.reduce((acc, sec) => acc + sec.items.length, 0);
  assert.equal(totalMenus, 8, '8 system menus must be configured');
  
  // 5. BBox verification
  const docWithBox = docs.find(d => d.bbox_inv || d.dt);
  assert.ok(docWithBox, 'Documents must have OCR and BBox metadata');
});
