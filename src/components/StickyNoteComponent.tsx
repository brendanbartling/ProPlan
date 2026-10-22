import React, { useState, useRef } from 'react';
import { StickyNote, Trade } from '../types';
import { calculateSnappedDuration } from '../utils/resizeLogic';

interface StickyNoteProps {
  task: StickyNote;
  trade?: Trade;
  dayWidth: number;
  isSelected: boolean;
  isCritical: boolean;
  isBeingDragged?: boolean;
  onSelect: (task: StickyNote) => void;
  onStartConnectionDrag: (taskId: string, side: 'left' | 'right', startX: number, startY: number) => void;
  onCompleteConnection: (targetTaskId: string) => void;
  onResizeDuration?: (taskId: string, newDuration: number) => void;
  onCardPointerDown?: (task: StickyNote, e: React.PointerEvent) => void;
}

export const StickyNoteComponent: React.FC<StickyNoteProps> = ({
  task,
  trade,
  dayWidth,
  isSelected,
  isCritical,
  isBeingDragged = false,
  onSelect,
  onStartConnectionDrag,
  onCompleteConnection,
  onResizeDuration,
  onCardPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragDurationPreview, setDragDurationPreview] = useState<number | null>(null);

  const startXRef = useRef(0);
  const startDurationRef = useRef(task.duration);

  const tradeColor = trade?.color || '#00A9E0';
  const effectiveDuration = dragDurationPreview !== null ? dragDurationPreview : task.duration;
  const widthPx = Math.max(90, effectiveDuration * dayWidth - 12);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isResizing) return;
    if (onCardPointerDown) {
      onCardPointerDown(task, e);
    }
  };

  const handleConnectionDotPointerDown = (
    e: React.PointerEvent,
    side: 'left' | 'right'
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onStartConnectionDrag(task.id, side, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    onCompleteConnection(task.id);
  };

  // Drag-to-resize duration handler (Pure flat, zero shadows)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startDurationRef.current = task.duration;

    const handlePointerMoveWindow = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const snapped = calculateSnappedDuration(startDurationRef.current, deltaX, dayWidth);
      setDragDurationPreview(snapped);
    };

    const handlePointerUpWindow = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
      window.removeEventListener('pointercancel', handlePointerUpWindow);

      const deltaX = upEvent.clientX - startXRef.current;
      const finalDuration = calculateSnappedDuration(startDurationRef.current, deltaX, dayWidth);

      setIsResizing(false);
      setDragDurationPreview(null);

      if (onResizeDuration && finalDuration !== task.duration) {
        onResizeDuration(task.id, finalDuration);
      }
    };

    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);
    window.addEventListener('pointercancel', handlePointerUpWindow);
  };

  // Shape rendering: NOISE-FREE & SHADOW-FREE flat design with clean Inter font
  const renderShapeContent = () => {
    if (task.shape === 'diamond') {
      return (
        <div
          className={`relative group h-22 w-22 mx-auto cursor-pointer select-none flex items-center justify-center ${
            isSelected ? 'ring-4 ring-[#0066B3] scale-105' : 'hover:scale-105'
          } ${isCritical ? 'ring-2 ring-rose-500 animate-pulse' : ''} ${
            isBeingDragged ? 'opacity-25' : ''
          }`}
          onPointerDown={handlePointerDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerUp={handlePointerUp}
          data-testid={`sticky-${task.id}`}
        >
          {/* Flat Diamond Background - Zero Shadows */}
          <div
            className="absolute inset-1.5 rotate-45 rounded-xs border-2 flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: tradeColor,
              borderColor: isSelected ? '#001430' : 'rgba(0, 20, 48, 0.5)',
            }}
          />

          {/* Diamond Content: ONLY Activity Name */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-2 leading-tight">
            <span
              className="text-xs md:text-sm font-bold line-clamp-3 font-sans px-1"
              style={{ color: trade?.textColor || '#FFFFFF' }}
            >
              {task.name}
            </span>
          </div>

          {/* Miro Anchor Dots */}
          {isHovered && !isResizing && !isBeingDragged && (
            <>
              <button
                type="button"
                onPointerDown={(e) => handleConnectionDotPointerDown(e, 'left')}
                className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
                title="Drag to create dependency (Predecessor)"
                aria-label={`Link dependency from ${task.id} left`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00A9E0]" />
              </button>
              <button
                type="button"
                onPointerDown={(e) => handleConnectionDotPointerDown(e, 'right')}
                className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
                title="Drag to create dependency (Successor)"
                aria-label={`Link dependency from ${task.id} right`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00A9E0]" />
              </button>
            </>
          )}
        </div>
      );
    }

    if (task.shape === 'circle') {
      return (
        <div
          className={`relative group h-22 w-22 mx-auto rounded-full cursor-pointer select-none flex flex-col items-center justify-center p-2 border-2 ${
            isSelected ? 'ring-4 ring-[#0066B3] scale-105' : 'hover:scale-105'
          } ${isCritical ? 'ring-2 ring-rose-500' : ''} ${
            isBeingDragged ? 'opacity-25' : ''
          }`}
          style={{
            backgroundColor: tradeColor,
            borderColor: isSelected ? '#001430' : 'rgba(0, 20, 48, 0.5)',
          }}
          onPointerDown={handlePointerDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerUp={handlePointerUp}
          data-testid={`sticky-${task.id}`}
        >
          <span
            className="relative z-10 text-xs md:text-sm font-bold text-center line-clamp-3 leading-tight px-1 font-sans"
            style={{ color: trade?.textColor || '#FFFFFF' }}
          >
            {task.name}
          </span>

          {/* Miro Anchor Dots */}
          {isHovered && !isResizing && !isBeingDragged && (
            <>
              <button
                type="button"
                onPointerDown={(e) => handleConnectionDotPointerDown(e, 'left')}
                className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
                title="Drag to create dependency"
                aria-label={`Link dependency from ${task.id} left`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00A9E0]" />
              </button>
              <button
                type="button"
                onPointerDown={(e) => handleConnectionDotPointerDown(e, 'right')}
                className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
                title="Drag to create dependency"
                aria-label={`Link dependency from ${task.id} right`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00A9E0]" />
              </button>
            </>
          )}
        </div>
      );
    }

    // Default: Rectangle sticky note - ZERO SHADOWS, FLAT & CLEAN
    return (
      <div
        className={`relative group rounded-md cursor-grab active:cursor-grabbing select-none flex items-center justify-center p-3 border-2 ${
          isSelected
            ? 'ring-4 ring-[#0066B3] scale-[1.01] z-20'
            : 'hover:brightness-105 z-10'
        } ${isCritical ? 'ring-2 ring-rose-500' : ''} ${
          isBeingDragged ? 'opacity-25' : ''
        }`}
        style={{
          width: `${widthPx}px`,
          minHeight: '84px',
          backgroundColor: tradeColor,
          borderColor: isSelected ? '#001430' : 'rgba(0, 20, 48, 0.45)',
        }}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerUp={handlePointerUp}
        data-testid={`sticky-${task.id}`}
      >
        {/* Center: ONLY Activity Name in clean Inter sans-serif, bold & clear */}
        <div className="relative z-10 w-full text-center px-1 pointer-events-none">
          <p
            className="text-sm md:text-base font-bold leading-snug line-clamp-3 font-sans select-none tracking-tight"
            style={{ color: trade?.textColor || '#FFFFFF' }}
          >
            {task.name}
          </p>
        </div>

        {/* Live Duration Snap Indicator while dragging resize handle */}
        {isResizing && dragDurationPreview !== null && (
          <div className="absolute -top-7 right-0 bg-[#001430] text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded z-40 border border-white/30">
            {dragDurationPreview} {dragDurationPreview === 1 ? 'Day' : 'Days'}
          </div>
        )}

        {/* Right-edge Duration Resize Handle (Snap to day) */}
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute top-0 right-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-black/20 flex items-center justify-center z-25 group/resize transition-colors rounded-r-[4px]"
          title="Drag side to change duration (snaps to day)"
        >
          <div className="w-1 h-6 rounded-full bg-white/70 group-hover/resize:bg-white transition-all" />
        </div>

        {/* Miro Anchor Dots (Left for predecessor link, Right for successor link) */}
        {isHovered && !isResizing && !isBeingDragged && (
          <>
            <button
              type="button"
              onPointerDown={(e) => handleConnectionDotPointerDown(e, 'left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
              title="Drag from this dot to create dependency (Predecessor)"
              aria-label={`Link dependency from ${task.id} left`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#00A9E0]" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => handleConnectionDotPointerDown(e, 'right')}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#00A9E0] hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair z-30"
              title="Drag from this dot to create dependency (Successor)"
              aria-label={`Link dependency from ${task.id} right`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#00A9E0]" />
            </button>
          </>
        )}
      </div>
    );
  };

  return <div className="inline-block relative">{renderShapeContent()}</div>;
};
