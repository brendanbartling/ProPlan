import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findLeftNeighbor,
  handleLanePlacementDependencies,
  addOrUpdateDependency,
  removeDependency,
} from './dependencyLogic';
import { StickyNote, Dependency } from '../types';

const mockTasks: StickyNote[] = [
  {
    id: 'ACT-1',
    name: 'Formwork',
    tradeId: 'CONC',
    laneId: 'LANE-1',
    day: 1,
    duration: 2,
    crewSize: 6,
    shape: 'rectangle',
    status: 'complete',
  },
  {
    id: 'ACT-2',
    name: 'Rebar Placement',
    tradeId: 'IRON',
    laneId: 'LANE-1',
    day: 4,
    duration: 2,
    crewSize: 4,
    shape: 'rectangle',
    status: 'in_progress',
  },
  {
    id: 'ACT-3',
    name: 'Overhead MEP Rough',
    tradeId: 'MEP',
    laneId: 'LANE-2',
    day: 2,
    duration: 3,
    crewSize: 5,
    shape: 'rectangle',
    status: 'planned',
  },
];

test('findLeftNeighbor finds the closest task before target day in same lane', () => {
  const left = findLeftNeighbor(mockTasks, 'LANE-1', 5);
  assert.equal(left?.id, 'ACT-2');

  const leftOfTwo = findLeftNeighbor(mockTasks, 'LANE-1', 3);
  assert.equal(leftOfTwo?.id, 'ACT-1');

  const leftEmpty = findLeftNeighbor(mockTasks, 'LANE-1', 1);
  assert.equal(leftEmpty, null);
});

test('handleLanePlacementDependencies auto-links to left neighbor when adding sticky note', () => {
  const newTask: StickyNote = {
    id: 'ACT-NEW',
    name: 'Concrete Pour',
    tradeId: 'CONC',
    laneId: 'LANE-1',
    day: 7,
    duration: 1,
    crewSize: 8,
    shape: 'diamond',
    status: 'planned',
  };

  const initialDeps: Dependency[] = [
    { id: 'D1', fromTaskId: 'ACT-1', toTaskId: 'ACT-2', type: 'FS', lag: 0 },
  ];

  const updatedDeps = handleLanePlacementDependencies(newTask, mockTasks, initialDeps);

  assert.equal(updatedDeps.length, 2);
  const created = updatedDeps.find((d) => d.toTaskId === 'ACT-NEW');
  assert.ok(created);
  assert.equal(created?.fromTaskId, 'ACT-2');
  assert.equal(created?.type, 'FS');
});

test('handleLanePlacementDependencies rewires dependency to new left neighbor when moved to another lane with left activity', () => {
  const taskToMove: StickyNote = {
    id: 'ACT-2',
    name: 'Rebar Placement',
    tradeId: 'IRON',
    laneId: 'LANE-2', // moved from LANE-1 to LANE-2
    day: 6,
    duration: 2,
    crewSize: 4,
    shape: 'rectangle',
    status: 'in_progress',
  };

  const initialDeps: Dependency[] = [
    { id: 'D1', fromTaskId: 'ACT-1', toTaskId: 'ACT-2', type: 'FS', lag: 0 },
  ];

  const updatedDeps = handleLanePlacementDependencies(
    taskToMove,
    mockTasks,
    initialDeps,
    'LANE-1' // previousLaneId
  );

  // Should have replaced ACT-1 -> ACT-2 with ACT-3 -> ACT-2 (since ACT-3 is at day 2 in LANE-2)
  const incoming = updatedDeps.filter((d) => d.toTaskId === 'ACT-2');
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].fromTaskId, 'ACT-3');
});

test('handleLanePlacementDependencies leaves dependency unchanged when moving to lane with no left activity', () => {
  const taskToMove: StickyNote = {
    id: 'ACT-2',
    name: 'Rebar Placement',
    tradeId: 'IRON',
    laneId: 'LANE-EMPTY',
    day: 2,
    duration: 2,
    crewSize: 4,
    shape: 'rectangle',
    status: 'in_progress',
  };

  const initialDeps: Dependency[] = [
    { id: 'D1', fromTaskId: 'ACT-1', toTaskId: 'ACT-2', type: 'FS', lag: 0 },
  ];

  const updatedDeps = handleLanePlacementDependencies(
    taskToMove,
    mockTasks,
    initialDeps,
    'LANE-1' // previousLaneId
  );

  // Left same because LANE-EMPTY has no activity to the left
  assert.equal(updatedDeps.length, 1);
  assert.equal(updatedDeps[0].fromTaskId, 'ACT-1');
});

test('addOrUpdateDependency and removeDependency manage relationships safely', () => {
  let deps: Dependency[] = [];
  deps = addOrUpdateDependency(deps, 'ACT-1', 'ACT-2', 'FS', 0);
  assert.equal(deps.length, 1);

  // Prevent duplicate insertion
  deps = addOrUpdateDependency(deps, 'ACT-1', 'ACT-2', 'SS', 2);
  assert.equal(deps.length, 1);
  assert.equal(deps[0].type, 'SS');
  assert.equal(deps[0].lag, 2);

  // Self reference prevented
  deps = addOrUpdateDependency(deps, 'ACT-1', 'ACT-1', 'FS', 0);
  assert.equal(deps.length, 1);

  // Remove
  deps = removeDependency(deps, deps[0].id);
  assert.equal(deps.length, 0);
});
