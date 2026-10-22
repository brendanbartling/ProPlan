import React, { useRef } from 'react';
import { PullPlanProject, Trade } from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  FileSpreadsheet,
  Upload,
  Printer,
  Download,
  Plus,
  Palette,
  Route,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface HeaderProps {
  project: PullPlanProject;
  selectedTradeFilter: string | null;
  autoLinkEnabled: boolean;
  criticalPathEnabled: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateProjectNumber: (projectNumber: string) => void;
  onUpdateLogo: (logoUrl?: string) => void;
  onAddStickyQuick: () => void;
  onToggleAutoLink: () => void;
  onToggleCriticalPath: () => void;
  onSelectTradeFilter: (tradeId: string | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExportP6: () => void;
  onImportP6: (file: File) => void;
  onOpenPdfModal: () => void;
  onOpenTradeManager: () => void;
  onSaveLocalJson: () => void;
  onLoadLocalJson: (file: File) => void;
  onResetSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  selectedTradeFilter,
  autoLinkEnabled,
  criticalPathEnabled,
  onUpdateTitle,
  onUpdateProjectNumber,
  onUpdateLogo,
  onAddStickyQuick,
  onToggleAutoLink,
  onToggleCriticalPath,
  onSelectTradeFilter,
  onZoomIn,
  onZoomOut,
  onExportP6,
  onImportP6,
  onOpenPdfModal,
  onOpenTradeManager,
  onSaveLocalJson,
  onLoadLocalJson,
  onResetSample,
}) => {
  const p6FileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleP6FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportP6(file);
      e.target.value = '';
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadLocalJson(file);
      e.target.value = '';
    }
  };

  return (
    <header
      className="relative z-50 border-b-2 border-[#0066B3]/40 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none no-print font-sans shadow-md"
      style={{ backgroundColor: '#001430' }} // Clark Primary Navy color distinct from white background
    >
      {/* Hidden file inputs */}
      <input
        ref={p6FileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleP6FileChange}
        className="hidden"
        aria-label="Upload P6 Excel file"
      />
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,.pullplan"
        onChange={handleJsonFileChange}
        className="hidden"
        aria-label="Upload Project JSON"
      />

      {/* Left Section: Company Logo (exact 909x347 px ratio) + Project metadata */}
      <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
        {/* Company Logo Container */}
        <CompanyLogo
          customLogoUrl={project.logoUrl}
          onUpdateLogo={onUpdateLogo}
        />

        {/* Project Title & Project # */}
        <div className="flex flex-col min-w-0">
          <input
            type="text"
            value={project.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-base font-black text-white bg-transparent hover:bg-white/10 focus:bg-white/15 border border-transparent hover:border-white/20 focus:border-[#00A9E0] rounded px-2 py-0.5 focus:outline-none truncate max-w-sm tracking-tight font-sans"
            title="Click to edit project title"
          />
          <div className="flex items-center gap-2 px-1 text-xs text-slate-300 font-mono">
            <span className="font-semibold text-slate-400">Project #:</span>
            <input
              type="text"
              value={project.projectNumber}
              onChange={(e) => onUpdateProjectNumber(e.target.value)}
              className="text-[#00A9E0] font-black bg-transparent hover:bg-white/10 focus:bg-white/15 border border-transparent hover:border-white/20 focus:border-[#00A9E0] rounded px-1.5 py-0 focus:outline-none w-28"
              title="Click to edit project number"
            />
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-medium">
              {project.tasks.length} Activities
            </span>
          </div>
        </div>
      </div>

      {/* Middle & Right Section: Low Effort Toolbars */}
      <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
        {/* Quick Add Sticky Note (Minimize clicks) */}
        <button
          type="button"
          onClick={onAddStickyQuick}
          className="px-3 py-1.5 rounded-lg bg-[#00A9E0] hover:bg-[#0095c7] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#00A9E0]/30 cursor-pointer transition-transform hover:scale-102 font-sans"
          title="Click to quickly add a new sticky note"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sticky Note</span>
        </button>

        {/* Auto Link Toggle */}
        <button
          type="button"
          onClick={onToggleAutoLink}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all font-sans ${
            autoLinkEnabled
              ? 'border-[#00A9E0] bg-[#00A9E0]/20 text-[#00A9E0]'
              : 'border-white/20 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="When enabled, placing a sticky note automatically links it to the activity to its left"
        >
          <Zap className={`w-3.5 h-3.5 ${autoLinkEnabled ? 'fill-[#00A9E0]' : ''}`} />
          <span className="hidden sm:inline">Auto-Link Left</span>
        </button>

        {/* Critical Path Toggle */}
        <button
          type="button"
          onClick={onToggleCriticalPath}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all font-sans ${
            criticalPathEnabled
              ? 'border-rose-400 bg-rose-950/60 text-rose-300'
              : 'border-white/20 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Critical Path / Flow Chain highlight"
        >
          <Route className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Critical Path</span>
        </button>

        {/* Trade Filter Dropdown */}
        <div className="relative flex items-center">
          <select
            value={selectedTradeFilter || ''}
            onChange={(e) => onSelectTradeFilter(e.target.value || null)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00A9E0] cursor-pointer shadow-xs font-sans font-medium"
            title="Filter board by Trade"
          >
            <option value="">All Trades ({project.trades.length})</option>
            {project.trades.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.code}] {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trade Color Manager */}
        <button
          type="button"
          onClick={onOpenTradeManager}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-colors shadow-xs"
          title="Manage Trades & Color Swatches"
        >
          <Palette className="w-4 h-4 text-[#00A9E0]" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom out timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-[#00A9E0] font-bold">
            {project.dayWidth}px
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom in timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* P6 XLSX Import / Export Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5 shadow-xs">
          <button
            type="button"
            onClick={onExportP6}
            className="px-2.5 py-1 rounded bg-[#0066B3] hover:bg-[#005291] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs font-sans"
            title="Export to Primavera P6 XLSX (TASK & TASKPRED sheets)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A9E0]" />
            <span>P6 XLSX</span>
          </button>
          <button
            type="button"
            onClick={() => p6FileInputRef.current?.click()}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
            title="Import from P6 or Excel XLSX file"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 11x17 PDF Export */}
        <button
          type="button"
          onClick={onOpenPdfModal}
          className="px-2.5 py-1.5 rounded-lg bg-[#0066B3]/60 hover:bg-[#0066B3] border border-[#00A9E0]/40 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs font-sans"
          title="Print or export 11x17 Landscape PDF Report"
        >
          <Printer className="w-3.5 h-3.5 text-[#00A9E0]" />
          <span>11x17 PDF</span>
        </button>

        {/* Local JSON Save / Load & Reset */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSaveLocalJson}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Save Project locally (.pullplan / .json)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => jsonFileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors shadow-xs"
            title="Load Project (.pullplan / .json)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetSample}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors shadow-xs"
            title="Reset to Clark Sample Pull Plan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
