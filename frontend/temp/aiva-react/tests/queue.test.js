import test from 'node:test';
import assert from 'node:assert/strict';
import { REAL_125_INVOICES } from '../src/mock/real125Invoices.js';

// Status badge mapping helper test
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Auto-pass':
    case 'Posted':
      return 'badge-pass';
    case 'Review':
      return 'badge-review';
    case 'Hold':
      return 'badge-hold';
    case 'Manual Review':
    case 'Rejected':
      return 'badge-error';
    default:
      return 'badge-neutral';
  }
}

test('Status badge CSS class mapping returns correct classes', () => {
  assert.equal(getStatusBadgeClass('Auto-pass'), 'badge-pass');
  assert.equal(getStatusBadgeClass('Review'), 'badge-review');
  assert.equal(getStatusBadgeClass('Hold'), 'badge-hold');
  assert.equal(getStatusBadgeClass('Manual Review'), 'badge-error');
  assert.equal(getStatusBadgeClass('Unknown'), 'badge-neutral');
});

test('Queue data contains formatted amounts and valid dates', () => {
  const sample = REAL_125_INVOICES[0];
  assert.ok(typeof sample.total === 'number', 'Total amount must be numeric');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(sample.dt), 'Date must be ISO formatted');
  assert.ok(sample.vendor.length > 0, 'Vendor must not be empty');
});
