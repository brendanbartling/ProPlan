import React from 'react';
import { Dependency, DraggingConnection, StickyNote } from '../types';

export interface TaskCanvasPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DependencyOverlayProps {
  dependencies: Dependency[];
  tasks: StickyNote[];
  selectedTaskId: string | null;
  criticalTaskIds: Set<string>;
  draggingConn: DraggingConnection | null;
  taskPositions: Map<string, TaskCanvasPosition>;
  onDeleteDependency: (depId: string) => void;
}

export const DependencyOverlay: React.FC<DependencyOverlayProps> = ({
  dependencies,
  tasks,
  selectedTaskId,
  criticalTaskIds,
  draggingConn,
  taskPositions,
  onDeleteDependency,
}) => {
  // Helper to compute center coordinates of task anchors in canvas space
  const getAnchorPos = (
    taskId: string,
    side: 'left' | 'right'
  ): { x: number; y: number } | null => {
    const pos = taskPositions.get(taskId);
    if (!pos) return null;

    const x = side === 'left' ? pos.x : pos.x + pos.width;
    const y = pos.y + pos.height / 2;
    return { x, y };
  };

  // Render curved bezier path
  const makeBezierPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string => {
    const dx = Math.abs(x2 - x1);
    const offset = Math.max(30, Math.min(dx * 0.45, 120));
    // If target is to the left (backward dependency / rework loop), curve gracefully
    if (x2 < x1) {
      const loopY = y2 > y1 ? y1 - 45 : y1 + 45;
      return `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x1 + 60} ${loopY}, ${(x1 + x2) / 2} ${loopY} S ${x2 - 60} ${y2}, ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20 overflow-visible"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        {/* Normal Arrowhead (Bright Blue / Deep Navy) */}
        <marker
          id="dep-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <polygon points="0 1, 8 4, 0 7" fill="#0066B3" />
        </marker>

        {/* Selected / Active Arrowhead */}
        <marker
          id="dep-arrow-active"
          markerWidth="10"
          markerHeight="10"
          refX="7"
          refY="5"
          orient="auto"
        >
          <polygon points="0 1.5, 9 5, 0 8.5" fill="#00A9E0" />
        </marker>

        {/* Critical Path Arrowhead */}
        <marker
          id="dep-arrow-critical"
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
        >
          <polygon points="0 1, 8 4.5, 0 8" fill="#E11D48" />
        </marker>
      </defs>

      {/* Render all existing dependency lines */}
      {dependencies.map((dep) => {
        const fromPos = getAnchorPos(dep.fromTaskId, 'right');
        const toPos = getAnchorPos(dep.toTaskId, 'left');

        if (!fromPos || !toPos) return null;

        const isRelatedToSelected =
          dep.fromTaskId === selectedTaskId || dep.toTaskId === selectedTaskId;
        const isCritical =
          criticalTaskIds.has(dep.fromTaskId) && criticalTaskIds.has(dep.toTaskId);

        const strokeColor = isCritical
          ? '#E11D48'
          : isRelatedToSelected
          ? '#00A9E0'
          : '#0066B3';
        const strokeWidth = isRelatedToSelected ? 3.0 : isCritical ? 2.5 : 2.0;
        const markerUrl = isCritical
          ? 'url(#dep-arrow-critical)'
          : isRelatedToSelected
          ? 'url(#dep-arrow-active)'
          : 'url(#dep-arrow)';

        const pathData = makeBezierPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;

        return (
          <g key={dep.id} className="pointer-events-auto group">
            {/* Wider transparent hit zone for easy hover / click */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              className="cursor-pointer"
              onClick={() => onDeleteDependency(dep.id)}
            >
              <title>{`Dependency ${dep.type}${dep.lag ? ` +${dep.lag}d` : ''} (Click to delete)`}</title>
            </path>

            {/* Visual line */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dep.type !== 'FS' ? '5 3' : undefined}
              markerEnd={markerUrl}
              className="transition-all duration-150 group-hover:stroke-amber-500 group-hover:stroke-[3.5px]"
            />

            {/* Relationship badge at midpoint */}
            <g
              transform={`translate(${midX}, ${midY})`}
              className="cursor-pointer"
              onClick={() => onDeleteDependency(dep.id)}
            >
              <rect
                x="-14"
                y="-9"
                width="28"
                height="18"
                rx="4"
                fill="#FFFFFF"
                stroke={isRelatedToSelected ? '#00A9E0' : strokeColor}
                strokeWidth="1.5"
                className="group-hover:fill-rose-50 group-hover:stroke-rose-600 shadow-sm transition-colors"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill={strokeColor}
                fontSize="10"
                fontFamily="'Inter', system-ui, sans-serif"
                fontWeight="bold"
                className="group-hover:hidden select-none pointer-events-none"
              >
                {dep.type}
              </text>
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#E11D48"
                fontSize="11"
                fontWeight="bold"
                className="hidden group-hover:block select-none pointer-events-none"
              >
                ✕
              </text>
            </g>
          </g>
        );
      })}

      {/* Render live line while user is dragging connection from Miro dot */}
      {draggingConn && (() => {
        const fromPos = getAnchorPos(draggingConn.fromTaskId, draggingConn.fromSide);
        if (!fromPos) return null;

        const targetX = draggingConn.currentX;
        const targetY = draggingConn.currentY;

        const pathData = makeBezierPath(fromPos.x, fromPos.y, targetX, targetY);

        return (
          <g>
            <path
              d={pathData}
              fill="none"
              stroke="#00A9E0"
              strokeWidth={3}
              strokeDasharray="6 4"
              markerEnd="url(#dep-arrow-active)"
              className="animate-pulse"
            />
            <circle
              cx={targetX}
              cy={targetY}
              r={6}
              fill="#00A9E0"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </g>
        );
      })()}
    </svg>
  );
};
