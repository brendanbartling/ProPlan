/**
 * Computes snapped duration in work days when dragging the resize handle
 */
export function calculateSnappedDuration(
  initialDuration: number,
  deltaPixels: number,
  dayWidth: number,
  minDuration: number = 1,
  maxDuration: number = 60
): number {
  if (dayWidth <= 0) return initialDuration;
  const deltaDays = Math.round(deltaPixels / dayWidth);
  const target = initialDuration + deltaDays;
  return Math.min(maxDuration, Math.max(minDuration, target));
}
