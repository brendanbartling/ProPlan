export interface DragSnapResult {
  day: number;
  laneId: string;
}

export interface LaneBoundary {
  id: string;
  top: number;
  bottom: number;
}

/**
 * Calculates snapped day and target lane from mouse coordinates, accounting for grab offset.
 */
export function calculateDragSnap(
  mouseX: number,
  mouseY: number,
  grabOffsetX: number,
  containerLeft: number,
  containerTop: number,
  scrollLeft: number,
  scrollTop: number,
  dayWidth: number,
  totalDays: number,
  duration: number,
  laneBoundaries: LaneBoundary[],
  gridStartX: number = 256
): DragSnapResult {
  // 1. Calculate intended left edge of card in canvas coordinates
  const canvasMouseX = mouseX - containerLeft + scrollLeft;
  const intendedCardLeft = canvasMouseX - grabOffsetX;

  // 2. Snap to day (1-indexed)
  const relativeX = intendedCardLeft - gridStartX;
  let day = Math.round(relativeX / dayWidth) + 1;
  const maxDay = Math.max(1, totalDays - duration + 1);
  day = Math.max(1, Math.min(maxDay, day));

  // 3. Determine lane from vertical position
  const canvasMouseY = mouseY - containerTop + scrollTop;
  let laneId = laneBoundaries[0]?.id || 'LANE-1';

  for (const boundary of laneBoundaries) {
    if (canvasMouseY >= boundary.top && canvasMouseY <= boundary.bottom) {
      laneId = boundary.id;
      break;
    }
  }

  // If above all lanes, first lane; if below all, last lane
  if (laneBoundaries.length > 0) {
    if (canvasMouseY < laneBoundaries[0].top) {
      laneId = laneBoundaries[0].id;
    } else if (canvasMouseY > laneBoundaries[laneBoundaries.length - 1].bottom) {
      laneId = laneBoundaries[laneBoundaries.length - 1].id;
    }
  }

  return { day, laneId };
}
