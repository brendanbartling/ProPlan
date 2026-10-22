import test from 'node:test';
import assert from 'node:assert/strict';
import { packLaneTasks } from './packing';
import { StickyNote } from '../types';

test('packLaneTasks assigns non-overlapping tasks to line 0', () => {
  const tasks: StickyNote[] = [
    {
      id: 'T1',
      name: 'Task 1',
      tradeId: 'E',
      laneId: 'L1',
      day: 1,
      duration: 2, // finishes at end of day 2 (day 3)
      crewSize: 3,
      shape: 'rectangle',
      status: 'planned',
    },
    {
      id: 'T2',
      name: 'Task 2',
      tradeId: 'M',
      laneId: 'L1',
      day: 3,
      duration: 2,
      crewSize: 3,
      shape: 'rectangle',
      status: 'planned',
    },
  ];

  const result = packLaneTasks(tasks);
  assert.equal(result.trackCount, 1);
  assert.equal(result.positionedTasks[0].trackIndex, 0);
  assert.equal(result.positionedTasks[1].trackIndex, 0);
});

test('packLaneTasks stacks concurrent/overlapping activities onto separate lines', () => {
  const concurrentTasks: StickyNote[] = [
    {
      id: 'T1',
      name: 'Overhead Ductwork',
      tradeId: 'M',
      laneId: 'L1',
      day: 2,
      duration: 3, // days 2, 3, 4
      crewSize: 4,
      shape: 'rectangle',
      status: 'planned',
    },
    {
      id: 'T2',
      name: 'Branch Conduit Wiring',
      tradeId: 'E',
      laneId: 'L1',
      day: 3, // overlaps with T1!
      duration: 2,
      crewSize: 2,
      shape: 'rectangle',
      status: 'planned',
    },
    {
      id: 'T3',
      name: 'Sprinkler Lines',
      tradeId: 'FP',
      laneId: 'L1',
      day: 3, // also overlaps!
      duration: 2,
      crewSize: 2,
      shape: 'rectangle',
      status: 'planned',
    },
  ];

  const result = packLaneTasks(concurrentTasks);
  assert.equal(result.trackCount, 3);
  const trackIndices = result.positionedTasks.map((t) => t.trackIndex);
  assert.ok(trackIndices.includes(0));
  assert.ok(trackIndices.includes(1));
  assert.ok(trackIndices.includes(2));
});
