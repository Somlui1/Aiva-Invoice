import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';

test('api.getDocuments() returns 125 documents with essential fields', async () => {
  const docs = await api.getDocuments();
  assert.equal(docs.length, 125, 'Should return exactly 125 documents');
  
  const first = docs[0];
  assert.ok(first.doc, 'Document should have doc id');
  assert.ok(first.company, 'Document should have company');
  assert.ok(first.vendor, 'Document should have vendor');
  assert.ok(first.status, 'Document should have status');
});

test('api.getDocument(id) retrieves single document', async () => {
  const doc = await api.getDocument('DMS-15');
  assert.ok(doc, 'Should find DMS-15');
  assert.equal(doc.doc, 'DMS-15');
  assert.equal(doc.company, 'AH');
});

test('api.getOracleReceipts(id) returns receipt lines for matched docs', async () => {
  const receipts = await api.getOracleReceipts('DMS-15');
  assert.ok(Array.isArray(receipts), 'Should return array');
  assert.ok(receipts.length > 0, 'DMS-15 should have receipt lines');
  assert.equal(receipts[0].poNumber, '40117545');
});

test('api.getCompanies() returns 26 AAPICO companies', async () => {
  const companies = await api.getCompanies();
  assert.ok(companies.AH, 'Should have AH company');
  assert.ok(companies.AHP, 'Should have AHP company');
  assert.equal(Object.keys(companies).length, 26, 'Should have exactly 26 companies');
});
