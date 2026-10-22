import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSnappedDuration } from './resizeLogic';

test('calculateSnappedDuration snaps correctly to days based on dayWidth', () => {
  const dayWidth = 145;

  // No movement
  assert.equal(calculateSnappedDuration(2, 0, dayWidth), 2);

  // Dragged +100px (less than half dayWidth) -> +1 day because 100/145 = 0.69 -> 1
  assert.equal(calculateSnappedDuration(2, 100, dayWidth), 3);

  // Dragged +50px (50/145 = 0.34) -> rounds to 0 -> duration stays 2
  assert.equal(calculateSnappedDuration(2, 50, dayWidth), 2);

  // Dragged +290px -> 2 full days added -> 2 + 2 = 4
  assert.equal(calculateSnappedDuration(2, 290, dayWidth), 4);

  // Dragged -200px -> clamped at minDuration 1
  assert.equal(calculateSnappedDuration(2, -200, dayWidth), 1);
});
