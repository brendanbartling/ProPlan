import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDragSnap, LaneBoundary } from './dragMath';

test('calculateDragSnap snaps by a single day when dragged by dayWidth', () => {
  const dayWidth = 145;
  const laneBoundaries: LaneBoundary[] = [
    { id: 'LANE-1', top: 56, bottom: 160 },
    { id: 'LANE-2', top: 160, bottom: 270 },
  ];

  // User clicked at Day 2 (x = 256 + 145 = 401), grabOffset = 40px inside card
  // Initial mouseX = 401 + 40 = 441
  const initialSnap = calculateDragSnap(
    441,
    100,
    40, // grabOffset
    0, 0, 0, 0, // container at 0, 0, no scroll
    dayWidth,
    20, // total days
    2,  // duration
    laneBoundaries
  );
  assert.equal(initialSnap.day, 2);
  assert.equal(initialSnap.laneId, 'LANE-1');

  // Dragging right by +145px (exactly 1 dayWidth)
  const movedSnap = calculateDragSnap(
    441 + 145,
    100,
    40,
    0, 0, 0, 0,
    dayWidth,
    20,
    2,
    laneBoundaries
  );
  assert.equal(movedSnap.day, 3); // Snapped cleanly to Day 3!

  // Dragging right by +75px (> half dayWidth) -> snaps to Day 3
  const halfSnap = calculateDragSnap(
    441 + 75,
    100,
    40,
    0, 0, 0, 0,
    dayWidth,
    20,
    2,
    laneBoundaries
  );
  assert.equal(halfSnap.day, 3);

  // Dragging left by -75px -> snaps to Day 1
  const leftSnap = calculateDragSnap(
    441 - 75,
    100,
    40,
    0, 0, 0, 0,
    dayWidth,
    20,
    2,
    laneBoundaries
  );
  assert.equal(leftSnap.day, 1);

  // Dragging vertically to Lane 2 (y = 200)
  const lane2Snap = calculateDragSnap(
    441,
    200,
    40,
    0, 0, 0, 0,
    dayWidth,
    20,
    2,
    laneBoundaries
  );
  assert.equal(lane2Snap.laneId, 'LANE-2');
});
