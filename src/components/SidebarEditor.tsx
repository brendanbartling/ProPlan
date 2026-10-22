import React, { useState } from 'react';
import { StickyNote, Trade, SwimLane, StickyShape, TaskStatus } from '../types';
import {
  X,
  Trash2,
  Copy,
  Plus,
  Square,
  Diamond,
  Circle,
  Users,
  Clock,
  MapPin,
  Briefcase,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface SidebarEditorProps {
  task: StickyNote | null;
  trades: Trade[];
  lanes: SwimLane[];
  onUpdate: (updatedTask: StickyNote) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: StickyNote) => void;
  onClose: () => void;
  onOpenTradeManager: () => void;
}

export const SidebarEditor: React.FC<SidebarEditorProps> = ({
  task,
  trades,
  lanes,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  onOpenTradeManager,
}) => {
  const [newConstraint, setNewConstraint] = useState('');

  if (!task) return null;

  const currentTrade = trades.find((t) => t.id === task.tradeId);

  const handleAddConstraint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConstraint.trim()) return;
    const current = task.constraints || [];
    onUpdate({
      ...task,
      constraints: [...current, newConstraint.trim()],
    });
    setNewConstraint('');
  };

  const handleRemoveConstraint = (index: number) => {
    const current = task.constraints || [];
    onUpdate({
      ...task,
      constraints: current.filter((_, i) => i !== index),
    });
  };

  return (
    <aside
      className="fixed top-[84px] right-0 bottom-0 w-96 bg-white border-l-2 border-slate-300 shadow-2xl z-40 flex flex-col text-slate-900 animate-in slide-in-from-right duration-200 font-sans"
      aria-label="Sticky Note Editor Sidebar"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full ring-2 ring-slate-400"
            style={{ backgroundColor: currentTrade?.color || '#00A9E0' }}
          />
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            Edit Activity Card
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer transition-colors"
          title="Close editor"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Activity ID & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Activity ID
            </label>
            <input
              type="text"
              value={task.id}
              onChange={(e) => onUpdate({ ...task, id: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-[#0066B3]"
              placeholder="e.g. ACT-1020"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={task.status}
              onChange={(e) => onUpdate({ ...task, status: e.target.value as TaskStatus })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066B3] cursor-pointer font-sans"
            >
              <option value="planned">Planned</option>
              <option value="ready">Ready (Committed)</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>

        {/* Description / Name - Increased legibility */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Description / Activity Name
          </label>
          <textarea
            rows={2}
            value={task.name}
            onChange={(e) => onUpdate({ ...task, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 text-sm font-bold font-sans focus:bg-white focus:outline-none focus:border-[#0066B3] resize-none leading-relaxed"
            placeholder="e.g. Pour Slab on Grade, Install Cable Trays..."
          />
        </div>

        {/* Responsible Subcontractor / Trade */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-[#0066B3]" />
              Responsible Trade / Sub
            </label>
            <button
              type="button"
              onClick={onOpenTradeManager}
              className="text-[11px] text-[#0066B3] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage Trades</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
          <select
            value={task.tradeId}
            onChange={(e) => onUpdate({ ...task, tradeId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066B3] cursor-pointer font-sans"
          >
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.code}] {t.name} ({t.company || 'Direct'})
              </option>
            ))}
          </select>
        </div>

        {/* Location / Swimlane */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#0066B3]" />
            Location / Swimlane
          </label>
          <select
            value={task.laneId}
            onChange={(e) => onUpdate({ ...task, laneId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0066B3] cursor-pointer font-sans"
          >
            {lanes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.wbsCode})
              </option>
            ))}
          </select>
        </div>

        {/* Duration & Crew Size */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#0066B3]" />
              Duration (Days)
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdate({ ...task, duration: Math.max(1, task.duration - 1) })}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Decrease duration"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={60}
                value={task.duration}
                onChange={(e) =>
                  onUpdate({ ...task, duration: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full bg-white border border-slate-300 rounded py-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0066B3]"
              />
              <button
                type="button"
                onClick={() => onUpdate({ ...task, duration: task.duration + 1 })}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Increase duration"
              >
                +
              </button>
            </div>
          </div>

          {/* Crew Size */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#0066B3]" />
              Crew Size
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdate({ ...task, crewSize: Math.max(1, task.crewSize - 1) })}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Decrease crew"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={50}
                value={task.crewSize}
                onChange={(e) =>
                  onUpdate({ ...task, crewSize: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full bg-white border border-slate-300 rounded py-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0066B3]"
              />
              <button
                type="button"
                onClick={() => onUpdate({ ...task, crewSize: task.crewSize + 1 })}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Increase crew"
              >
                +
              </button>
            </div>
          </div>

          <div className="col-span-2 text-xs text-slate-600 font-sans text-center pt-1 border-t border-slate-200">
            Total Manhours: <span className="text-slate-900 font-bold font-mono">{task.duration * task.crewSize * 8} hrs</span>
          </div>
        </div>

        {/* Shape Selector (Rectangle / Diamond / Circle) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Sticky Shape
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ ...task, shape: 'rectangle' })}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                task.shape === 'rectangle'
                  ? 'border-[#0066B3] bg-[#0066B3]/10 text-[#0066B3] font-bold shadow-xs'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Square className="w-5 h-5 text-[#0066B3]" />
              <span className="text-[11px]">Task</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdate({ ...task, shape: 'diamond' })}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                task.shape === 'diamond'
                  ? 'border-[#0066B3] bg-[#0066B3]/10 text-[#0066B3] font-bold shadow-xs'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Diamond className="w-5 h-5 text-[#FF8E00]" />
              <span className="text-[11px]">Milestone</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdate({ ...task, shape: 'circle' })}
              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                task.shape === 'circle'
                  ? 'border-[#0066B3] bg-[#0066B3]/10 text-[#0066B3] font-bold shadow-xs'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Circle className="w-5 h-5 text-[#00C76D]" />
              <span className="text-[11px]">Gate/Insp</span>
            </button>
          </div>
        </div>

        {/* Known Constraints */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Known Site Constraints (LOD & Reality)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(task.constraints || []).map((c, i) => (
              <span
                key={i}
                className="bg-rose-100 border border-rose-300 text-rose-800 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveConstraint(i)}
                  className="hover:text-rose-950 cursor-pointer"
                  title="Remove constraint"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(task.constraints || []).length === 0 && (
              <span className="text-xs text-slate-500 italic">
                No active constraints logged.
              </span>
            )}
          </div>

          <form onSubmit={handleAddConstraint} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              placeholder="e.g. RFI #104, Material on site..."
              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 text-xs focus:outline-none focus:border-[#0066B3]"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Notes / Subcontractor Alignment
          </label>
          <textarea
            rows={2}
            value={task.notes || ''}
            onChange={(e) => onUpdate({ ...task, notes: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 text-xs font-sans focus:bg-white focus:outline-none focus:border-[#0066B3] resize-none"
            placeholder="Special equipment needed, laydown area, etc."
          />
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onDuplicate(task)}
          className="flex-1 py-1.5 px-3 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          title="Duplicate this sticky note"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="py-1.5 px-3 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          title="Delete sticky note"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </aside>
  );
};
