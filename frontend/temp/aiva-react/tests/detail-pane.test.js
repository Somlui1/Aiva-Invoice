import test from 'node:test';
import assert from 'node:assert/strict';
import { REAL_125_INVOICES } from '../src/mock/real125Invoices.js';
import { ORACLE_RECEIPTS_BY_DOC } from '../src/mock/oracleReceipts.js';

// Variance calculation helper
function calculateVariance(invTotal, receiptLines) {
  if (!receiptLines || receiptLines.length === 0) {
    return { receiptTotal: 0, variance: invTotal, isMatch: false };
  }
  const receiptTotal = receiptLines.reduce((sum, r) => sum + (r.amount || (r.qty * r.unitPrice) || 0), 0);
  const variance = Math.abs(invTotal - receiptTotal);
  const isMatch = variance < 0.01;
  return { receiptTotal, variance, isMatch };
}

test('calculateVariance computes variance and match status accurately', () => {
  const receipts = [
    { poNumber: '40117545', qty: 10, unitPrice: 44.2, amount: 442.00 }
  ];
  const { receiptTotal, variance, isMatch } = calculateVariance(442.00, receipts);
  
  assert.equal(receiptTotal, 442.00);
  assert.equal(variance, 0.00);
  assert.equal(isMatch, true, 'Variance < 0.01 should be match');
});

test('calculateVariance flags discrepancies when amounts differ', () => {
  const receipts = [
    { poNumber: '40117545', qty: 10, unitPrice: 40.0, amount: 400.00 }
  ];
  const { receiptTotal, variance, isMatch } = calculateVariance(442.00, receipts);
  
  assert.equal(receiptTotal, 400.00);
  assert.equal(variance, 42.00);
  assert.equal(isMatch, false, 'Variance > 0.01 should not be match');
});

test('Documents have rules V-01..V-08 array with valid structure', () => {
  const doc = REAL_125_INVOICES[0];
  assert.ok(Array.isArray(doc.rules), 'Doc should have rules array');
  assert.ok(doc.rules.length > 0, 'Doc should have evaluated rules');
  
  const v01 = doc.rules.find(r => r.id === 'V-01');
  assert.ok(v01, 'Should evaluate V-01');
  assert.ok(v01.status, 'Rule should have status');
});
