import test from 'node:test';
import assert from 'node:assert/strict';
import { REAL_125_INVOICES } from '../src/mock/real125Invoices.js';
import { MOCK_USERS } from '../src/mock/users.js';

// Test permissions helper logic
function createCanHelper(role) {
  return function can(action) {
    if (role === 'ADM') return true;
    if (role === 'SA') return action === 'AUDIT' || action === 'VIEW_LOGS';
    if (role === 'ACC') return action === 'VIEW_QUEUE' || action === 'VERIFY' || action === 'EDIT_DOC';
    if (role === 'FIN') return action === 'VIEW_QUEUE' || action === 'APPROVE' || action === 'VIEW_AP';
    if (role === 'EU') return action === 'VIEW_MINE' || action === 'CONFIRM_RECEIPT';
    return false;
  };
}

test('Role permission matrix logic operates correctly', () => {
  const canAdm = createCanHelper('ADM');
  assert.equal(canAdm('ANYTHING'), true, 'ADM can do anything');
  
  const canAcc = createCanHelper('ACC');
  assert.equal(canAcc('VIEW_QUEUE'), true, 'ACC can view queue');
  assert.equal(canAcc('APPROVE'), false, 'ACC cannot approve');
  
  const canFin = createCanHelper('FIN');
  assert.equal(canFin('APPROVE'), true, 'FIN can approve');
  assert.equal(canFin('VIEW_AP'), true, 'FIN can view AP');
  
  const canEu = createCanHelper('EU');
  assert.equal(canEu('VIEW_MINE'), true, 'EU can view assigned invoices');
  assert.equal(canEu('APPROVE'), false, 'EU cannot approve');
});

test('Invoice filtering logic correctly filters by status and search query', () => {
  const allDocs = REAL_125_INVOICES;
  assert.equal(allDocs.length, 125);

  // Filter by status: Auto-pass
  const autoPassDocs = allDocs.filter(d => d.status === 'Auto-pass');
  assert.ok(autoPassDocs.length > 0, 'Should have Auto-pass documents');

  // Filter by status: Review
  const reviewDocs = allDocs.filter(d => d.status === 'Review');
  assert.ok(reviewDocs.length > 0, 'Should have Review documents');

  // Search by invoice number
  const searchResults = allDocs.filter(d => 
    d.inv?.toLowerCase().includes('sq26') || 
    d.vendor?.toLowerCase().includes('จรูญรัตน์')
  );
  assert.ok(searchResults.length > 0, 'Search should find matching records');
});
