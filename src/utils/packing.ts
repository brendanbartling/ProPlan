import { StickyNote } from '../types';

export interface PositionedTask extends StickyNote {
  trackIndex: number; // Line / row number within the swimlane (0, 1, 2, ...)
}

export interface LaneLayout {
  laneId: string;
  tasks: PositionedTask[];
  trackCount: number; // Number of parallel lines needed for this location
  laneHeight: number; // Computed height in pixels
}

export const TRACK_HEIGHT = 88; // Height per line of sticky notes
export const TRACK_GAP = 8;
export const LANE_PADDING_TOP = 8;
export const LANE_PADDING_BOTTOM = 8;

/**
 * Computes parallel line tracks for tasks in a single swimlane.
 * Ensures concurrent/overlapping activities in the same location are on separate lines.
 */
export function packLaneTasks(tasks: StickyNote[]): {
  positionedTasks: PositionedTask[];
  trackCount: number;
  laneHeight: number;
} {
  if (tasks.length === 0) {
    return {
      positionedTasks: [],
      trackCount: 1,
      laneHeight: LANE_PADDING_TOP + TRACK_HEIGHT + LANE_PADDING_BOTTOM,
    };
  }

  // Sort tasks by start day, then duration
  const sorted = [...tasks].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return b.duration - a.duration;
  });

  // Track the end day of the last task placed on each line
  const lineEndDays: number[] = [];
  const positionedTasks: PositionedTask[] = [];

  for (const task of sorted) {
    const taskStart = task.day;
    const taskEnd = task.day + task.duration; // Exclusive end day

    // Find the first line where the last task ended on or before taskStart
    let assignedLine = -1;
    for (let i = 0; i < lineEndDays.length; i++) {
      if (lineEndDays[i] <= taskStart) {
        assignedLine = i;
        lineEndDays[i] = taskEnd;
        break;
      }
    }

    // If no line available without overlap, create a new concurrent line!
    if (assignedLine === -1) {
      assignedLine = lineEndDays.length;
      lineEndDays.push(taskEnd);
    }

    positionedTasks.push({
      ...task,
      trackIndex: assignedLine,
    });
  }

  const trackCount = Math.max(1, lineEndDays.length);
  const laneHeight =
    LANE_PADDING_TOP +
    trackCount * TRACK_HEIGHT +
    (trackCount - 1) * TRACK_GAP +
    LANE_PADDING_BOTTOM;

  return {
    positionedTasks,
    trackCount,
    laneHeight,
  };
}
