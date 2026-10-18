import test from 'node:test';
import assert from 'node:assert/strict';

// Helper function to normalize coordinates to CSS percentages
function normalizeBBox(bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length < 4) return null;
  let [ymin, xmin, ymax, xmax] = bbox;
  
  // If coordinates are 0..1000, convert to 0..1
  if (ymin > 1 || xmin > 1 || ymax > 1 || xmax > 1) {
    ymin /= 1000;
    xmin /= 1000;
    ymax /= 1000;
    xmax /= 1000;
  }
  
  const top = (ymin * 100).toFixed(2) + '%';
  const left = (xmin * 100).toFixed(2) + '%';
  const width = Math.max(0, (xmax - xmin) * 100).toFixed(2) + '%';
  const height = Math.max(0, (ymax - ymin) * 100).toFixed(2) + '%';
  
  return { top, left, width, height };
}

test('normalizeBBox converts 0..1000 scale to valid CSS percentages', () => {
  const rawBox = [150, 200, 250, 600]; // ymin, xmin, ymax, xmax
  const css = normalizeBBox(rawBox);
  
  assert.equal(css.top, '15.00%');
  assert.equal(css.left, '20.00%');
  assert.equal(css.height, '10.00%');
  assert.equal(css.width, '40.00%');
});

test('normalizeBBox converts 0..1 normalized scale to valid CSS percentages', () => {
  const normBox = [0.125, 0.450, 0.200, 0.850];
  const css = normalizeBBox(normBox);
  
  assert.equal(css.top, '12.50%');
  assert.equal(css.left, '45.00%');
  assert.equal(css.height, '7.50%');
  assert.equal(css.width, '40.00%');
});

test('normalizeBBox handles invalid or empty coordinates gracefully', () => {
  assert.equal(normalizeBBox(null), null);
  assert.equal(normalizeBBox([]), null);
  assert.equal(normalizeBBox([1, 2]), null);
});
