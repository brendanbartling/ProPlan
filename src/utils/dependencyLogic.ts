import { Dependency, DependencyType, StickyNote } from '../types';

/**
 * Finds the sticky note immediately to the left of the given day in the given lane.
 * If multiple exist, picks the one that finishes latest (highest day + duration, or highest day).
 */
export function findLeftNeighbor(
  tasks: StickyNote[],
  laneId: string,
  targetDay: number,
  excludeTaskId?: string
): StickyNote | null {
  const laneTasks = tasks.filter(
    (t) => t.laneId === laneId && t.id !== excludeTaskId && t.day < targetDay
  );

  if (laneTasks.length === 0) return null;

  // Sort descending by day + duration, then by day
  laneTasks.sort((a, b) => {
    const endA = a.day + a.duration;
    const endB = b.day + b.duration;
    if (endB !== endA) return endB - endA;
    return b.day - a.day;
  });

  return laneTasks[0];
}

/**
 * Auto-creates or updates dependency when a sticky note is added or moved to a swim lane.
 * Rules specified by user:
 * 1. When adding a sticky note to a swim lane, auto create dependency (relationship) with the object to the left of it.
 * 2. If moving the sticky to a different lane:
 *    - Change the dependency to the activity to the left in the new lane.
 *    - BUT leave the same if there is no activity in the swim lane it is moved to!
 * 3. When moving within the same lane:
 *    - Auto-correct the same-lane predecessor to the new object to the left of it, removing old obsolete same-lane links.
 */
export function handleLanePlacementDependencies(
  task: StickyNote,
  allTasks: StickyNote[],
  currentDeps: Dependency[],
  previousLaneId?: string
): Dependency[] {
  const isMovingToDifferentLane = Boolean(previousLaneId && previousLaneId !== task.laneId);
  const leftNeighbor = findLeftNeighbor(allTasks, task.laneId, task.day, task.id);

  if (isMovingToDifferentLane) {
    if (!leftNeighbor) {
      // "leave the same if there is no activity in the swim lane it is moved to"
      return currentDeps;
    }
    // Remove previous predecessor from the old lane (if any)
    const filteredDeps = currentDeps.filter((dep) => {
      if (dep.toTaskId !== task.id) return true;
      const predTask = allTasks.find((t) => t.id === dep.fromTaskId);
      return predTask?.laneId !== previousLaneId;
    });

    // Add new dependency from left neighbor
    return addOrUpdateDependency(filteredDeps, leftNeighbor.id, task.id, 'FS', 0);
  }

  // Moved within the same lane or freshly placed:
  // Remove any previous predecessor in this same lane that is no longer the immediate left neighbor
  const filteredDeps = currentDeps.filter((dep) => {
    if (dep.toTaskId !== task.id) return true;
    const predTask = allTasks.find((t) => t.id === dep.fromTaskId);
    // Remove old predecessor if it was in the same lane
    return predTask?.laneId !== task.laneId;
  });

  if (leftNeighbor) {
    return addOrUpdateDependency(filteredDeps, leftNeighbor.id, task.id, 'FS', 0);
  }

  return filteredDeps;
}

/**
 * Adds or updates a dependency between two tasks.
 * Avoids duplicate links or self-loops.
 */
export function addOrUpdateDependency(
  deps: Dependency[],
  fromTaskId: string,
  toTaskId: string,
  type: DependencyType = 'FS',
  lag: number = 0
): Dependency[] {
  if (fromTaskId === toTaskId) return deps;

  // Check if relation already exists between these two tasks
  const existingIndex = deps.findIndex(
    (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
  );

  if (existingIndex >= 0) {
    const updated = [...deps];
    updated[existingIndex] = {
      ...updated[existingIndex],
      type,
      lag,
    };
    return updated;
  }

  const newDep: Dependency = {
    id: `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fromTaskId,
    toTaskId,
    type,
    lag,
  };

  return [...deps, newDep];
}

/**
 * Removes a dependency by its ID.
 */
export function removeDependency(deps: Dependency[], depId: string): Dependency[] {
  return deps.filter((d) => d.id !== depId);
}

/**
 * Updates dependency type or lag.
 */
export function updateDependency(
  deps: Dependency[],
  depId: string,
  updates: Partial<Pick<Dependency, 'type' | 'lag'>>
): Dependency[] {
  return deps.map((d) => (d.id === depId ? { ...d, ...updates } : d));
}

/**
 * Identifies critical path tasks using forward/backward pass algorithm.
 */
export function getCriticalPathTaskIds(tasks: StickyNote[], deps: Dependency[]): Set<string> {
  const critical = new Set<string>();
  if (tasks.length === 0) return critical;

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const successorsMap = new Map<string, string[]>();
  const predecessorsMap = new Map<string, string[]>();

  tasks.forEach((t) => {
    successorsMap.set(t.id, []);
    predecessorsMap.set(t.id, []);
  });

  deps.forEach((d) => {
    if (taskMap.has(d.fromTaskId) && taskMap.has(d.toTaskId)) {
      successorsMap.get(d.fromTaskId)?.push(d.toTaskId);
      predecessorsMap.get(d.toTaskId)?.push(d.fromTaskId);
    }
  });

  // Calculate early finish = day + duration - 1
  // Calculate longest path length to terminal nodes
  const memoPath = new Map<string, number>();

  function getMaxChainLength(taskId: string, visited = new Set<string>()): number {
    if (visited.has(taskId)) return 0;
    if (memoPath.has(taskId)) return memoPath.get(taskId)!;

    visited.add(taskId);
    const task = taskMap.get(taskId);
    const dur = task?.duration || 1;
    const succs = successorsMap.get(taskId) || [];

    if (succs.length === 0) {
      memoPath.set(taskId, dur);
      return dur;
    }

    let maxChild = 0;
    for (const succId of succs) {
      maxChild = Math.max(maxChild, getMaxChainLength(succId, new Set(visited)));
    }

    const total = dur + maxChild;
    memoPath.set(taskId, total);
    return total;
  }

  let longestTotal = 0;
  for (const t of tasks) {
    longestTotal = Math.max(longestTotal, getMaxChainLength(t.id));
  }

  // Tasks contributing to the longest critical chain
  if (longestTotal > 0) {
    for (const t of tasks) {
      if (memoPath.get(t.id) === longestTotal || predecessorsMap.get(t.id)?.length === 0) {
        // trace forward
        let curr: string | undefined = t.id;
        while (curr) {
          critical.add(curr);
          const succs = successorsMap.get(curr) || [];
          if (succs.length === 0) break;
          // find child on path
          const currRemaining = (memoPath.get(curr) || 0) - (taskMap.get(curr)?.duration || 0);
          curr = succs.find((s) => memoPath.get(s) === currRemaining);
        }
      }
    }
  }

  return critical;
}
