import React, { useState } from 'react';
import { StickyNote, Dependency, DependencyType, Trade } from '../types';
import {
  Link2,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FooterDependenciesProps {
  selectedTask: StickyNote | null;
  allTasks: StickyNote[];
  trades: Trade[];
  dependencies: Dependency[];
  onAddDependency: (fromTaskId: string, toTaskId: string, type: DependencyType, lag?: number) => void;
  onRemoveDependency: (depId: string) => void;
  onUpdateDependency: (depId: string, updates: Partial<Pick<Dependency, 'type' | 'lag'>>) => void;
  onClose: () => void;
}

export const FooterDependencies: React.FC<FooterDependenciesProps> = ({
  selectedTask,
  allTasks,
  trades,
  dependencies,
  onAddDependency,
  onRemoveDependency,
  onUpdateDependency,
  onClose,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!selectedTask) return null;

  const tradeMap = new Map(trades.map((t) => [t.id, t]));
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  const predecessors = dependencies.filter((d) => d.toTaskId === selectedTask.id);
  const successors = dependencies.filter((d) => d.fromTaskId === selectedTask.id);
  const existingPredIds = new Set(predecessors.map((p) => p.fromTaskId));

  const availablePredecessors = allTasks.filter(
    (t) =>
      t.id !== selectedTask.id &&
      !existingPredIds.has(t.id) &&
      (searchQuery
        ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true)
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    let fromTaskId = e.dataTransfer.getData('text/plain');
    if (!fromTaskId) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        fromTaskId = data.taskId;
      } catch {
        // ignore
      }
    }

    if (fromTaskId && fromTaskId !== selectedTask.id) {
      onAddDependency(fromTaskId, selectedTask.id, 'FS', 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'link';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <footer
      className="fixed bottom-0 left-0 right-96 bg-white/95 backdrop-blur-md border-t-2 border-[#0066B3] shadow-2xl z-30 flex flex-col text-slate-900 animate-in slide-in-from-bottom duration-200 font-sans"
      aria-label="Dependencies Inspector Footer"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <Link2 className="w-4 h-4 text-[#0066B3] flex-shrink-0" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">
            Dependencies & Hand-offs:
          </span>
          <span className="font-mono text-xs font-black bg-[#0066B3]/15 text-[#0066B3] px-1.5 py-0.5 rounded border border-[#0066B3]/30">
            {selectedTask.id}
          </span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-md font-sans">
            {selectedTask.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2.5 py-1 rounded bg-[#0066B3] hover:bg-[#005291] text-white font-bold text-[11px] flex items-center gap-1 shadow cursor-pointer transition-colors font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Predecessor</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
            title="Close footer"
            aria-label="Close footer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 grid grid-cols-12 gap-3 max-h-48 overflow-y-auto bg-white">
        {/* Predecessors Column (6 cols) */}
        <div className="col-span-6 flex flex-col space-y-1.5 border-r border-slate-200 pr-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0066B3]" />
              Predecessors (Must complete before {selectedTask.id})
            </span>
            <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 px-1.5 rounded text-slate-800 font-bold">
              {predecessors.length}
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-32 pr-1">
            {predecessors.map((dep) => {
              const fromTask = taskMap.get(dep.fromTaskId);
              const trade = fromTask ? tradeMap.get(fromTask.tradeId) : undefined;
              return (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trade?.color || '#00A9E0' }}
                    />
                    <span className="font-mono text-[10px] font-black text-slate-800 bg-white border border-slate-300 px-1 rounded flex-shrink-0">
                      {dep.fromTaskId}
                    </span>
                    <span className="text-xs text-slate-900 truncate font-bold font-sans">
                      {fromTask?.name || 'Unknown Activity'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <select
                      value={dep.type}
                      onChange={(e) =>
                        onUpdateDependency(dep.id, {
                          type: e.target.value as DependencyType,
                        })
                      }
                      className="bg-white border border-slate-300 text-[#0066B3] font-bold font-mono text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      title="Dependency Type"
                    >
                      <option value="FS">FS (Finish-Start)</option>
                      <option value="FF">FF (Finish-Finish)</option>
                      <option value="SS">SS (Start-Start)</option>
                      <option value="SS&FF">SS & FF</option>
                    </select>

                    <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded px-1 py-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <input
                        type="number"
                        min={-10}
                        max={30}
                        value={dep.lag || 0}
                        onChange={(e) =>
                          onUpdateDependency(dep.id, {
                            lag: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-7 text-center font-mono text-[10px] bg-transparent text-slate-800 focus:outline-none font-bold"
                        title="Lag (Days)"
                      />
                      <span className="text-[9px] text-slate-500">d</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveDependency(dep.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 cursor-pointer transition-colors"
                      title="Remove dependency"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {predecessors.length === 0 && (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded border border-dashed border-slate-300">
                No predecessors linked yet. Drag a sticky note here or use button above.
              </div>
            )}
          </div>
        </div>

        {/* Drag Drop Zone (3 cols) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`col-span-3 rounded-lg border-2 border-dashed p-3 flex flex-col items-center justify-center text-center transition-all ${
            isDragOver
              ? 'border-[#0066B3] bg-[#0066B3]/10 scale-102'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5 text-[#0066B3] mb-1 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 leading-tight font-sans">
            Drag Sticky Note Here
          </span>
          <span className="text-[10px] text-slate-500 leading-tight mt-0.5 font-sans">
            Drops auto-link as a predecessor to this activity
          </span>
        </div>

        {/* Successors Column (3 cols) */}
        <div className="col-span-3 flex flex-col space-y-1.5 pl-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5 text-[#00C76D]" />
              Successors (Downstream)
            </span>
            <span className="font-mono text-[10px] bg-slate-100 border border-slate-300 px-1.5 rounded text-slate-800 font-bold">
              {successors.length}
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-32 pr-1">
            {successors.map((dep) => {
              const toTask = taskMap.get(dep.toTaskId);
              const trade = toTask ? tradeMap.get(toTask.tradeId) : undefined;
              return (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-1.5 p-1.5 rounded bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trade?.color || '#00A9E0' }}
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-700">
                      {dep.toTaskId}
                    </span>
                    <span className="text-[11px] text-slate-900 truncate font-medium font-sans">
                      {toTask?.name || 'Task'}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded">
                    {dep.type}
                  </span>
                </div>
              );
            })}

            {successors.length === 0 && (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded border border-dashed border-slate-300">
                No downstream tasks linked yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Search Dropdown Modal */}
      {showAddMenu && (
        <div className="absolute bottom-full mb-1 left-4 w-96 bg-white border-2 border-slate-300 rounded-lg shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 font-sans">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1.5">
            <span className="text-xs font-bold text-slate-900">
              Choose Predecessor Activity
            </span>
            <button
              type="button"
              onClick={() => setShowAddMenu(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search by ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 mb-2 focus:bg-white focus:outline-none focus:border-[#0066B3]"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availablePredecessors.map((t) => {
              const trade = tradeMap.get(t.tradeId);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onAddDependency(t.id, selectedTask.id, 'FS', 0);
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-100 flex items-center justify-between text-xs cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: trade?.color || '#00A9E0' }}
                    />
                    <span className="font-mono text-xs font-bold text-[#0066B3]">
                      {t.id}
                    </span>
                    <span className="text-slate-900 text-xs font-bold truncate">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Day {t.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </footer>
  );
};
