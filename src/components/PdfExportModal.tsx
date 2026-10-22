import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { PullPlanProject } from '../types';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  project: PullPlanProject;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const [authorName, setAuthorName] = useState('Brendan Bartling');
  const [includeDependencies, setIncludeDependencies] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const tradeMap = new Map(project.trades.map((t) => [t.id, t]));

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadJsPdf = () => {
    setIsExporting(true);
    try {
      // 11x17 Landscape (Tabloid / ANSI B): 17 inches = 431.8 mm, 11 inches = 279.4 mm
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [431.8, 279.4],
      });

      // Title Block & Header
      doc.setFillColor(0, 20, 48); // #001430
      doc.rect(10, 10, 411.8, 26, 'F');

      doc.setFillColor(0, 169, 224); // #00A9E0
      doc.rect(10, 36, 411.8, 2, 'F');

      // Title & Project Details
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('times', 'bold');
      doc.text(project.title.toUpperCase(), 16, 22);

      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 169, 224);
      doc.text(`PROJECT #: ${project.projectNumber}   |   START DATE: ${project.startDate}   |   PRINT FORMAT: 11" x 17" TABLOID LANDSCAPE`, 16, 30);

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.text(`PREPARED BY: ${authorName}   |   DATE: ${new Date().toLocaleDateString()}`, 330, 22);
      doc.text(`LEAN PULL PLAN SCHEDULE (HIGH LOD)`, 330, 30);

      // Section 1: Trade Legend (Summary badges)
      let legendX = 14;
      const legendY = 44;
      doc.setFontSize(8);
      doc.setFont('times', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('TRADE LEGEND:', legendX, legendY + 4);
      legendX += 28;

      project.trades.forEach((trade) => {
        const hex = trade.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;

        doc.setFillColor(r, g, b);
        doc.roundedRect(legendX, legendY, 24, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('times', 'bold');
        doc.text(trade.code, legendX + 2, legendY + 4.2);
        legendX += 26;
      });

      // Section 2: Pull Plan Grid / Swimlane Table
      let tableY = 54;
      doc.setFillColor(245, 247, 250);
      doc.rect(10, tableY, 411.8, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.line(10, tableY + 8, 421.8, tableY + 8);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      doc.setFont('times', 'bold');
      doc.text('LOCATION / SWIMLANE', 14, tableY + 5.5);
      doc.text('ACTIVITY ID', 85, tableY + 5.5);
      doc.text('DESCRIPTION / SCOPE', 110, tableY + 5.5);
      doc.text('TRADE & SUB', 210, tableY + 5.5);
      doc.text('DAY', 280, tableY + 5.5);
      doc.text('DURN', 295, tableY + 5.5);
      doc.text('CREW', 310, tableY + 5.5);
      doc.text('PREDECESSORS (FS/SS)', 325, tableY + 5.5);
      doc.text('STATUS & CONSTRAINTS', 375, tableY + 5.5);

      tableY += 10;

      // Group tasks by lane
      project.lanes.forEach((lane) => {
        const laneTasks = project.tasks
          .filter((t) => t.laneId === lane.id)
          .sort((a, b) => a.day - b.day);

        doc.setFillColor(230, 240, 250);
        doc.rect(10, tableY - 1, 411.8, 6.5, 'F');
        doc.setFont('times', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 102, 179);
        doc.text(`${lane.name.toUpperCase()} (${lane.wbsCode}) - ${laneTasks.length} Planned Activities`, 14, tableY + 3.8);
        tableY += 7.5;

        laneTasks.forEach((task, idx) => {
          if (tableY > 260) {
            doc.addPage([431.8, 279.4], 'landscape');
            tableY = 20;
          }

          const trade = tradeMap.get(task.tradeId);
          const preds = project.dependencies
            .filter((d) => d.toTaskId === task.id)
            .map((d) => `${d.fromTaskId} (${d.type}${d.lag ? `+${d.lag}d` : ''})`)
            .join(', ') || '-';

          if (idx % 2 === 1) {
            doc.setFillColor(250, 252, 255);
            doc.rect(10, tableY - 1, 411.8, 5.5, 'F');
          }

          const hex = (trade?.color || '#00A9E0').replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;
          doc.setFillColor(r, g, b);
          doc.circle(82, tableY + 1.5, 1.8, 'F');

          doc.setFont('times', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(20, 20, 20);
          doc.text(lane.wbsCode, 14, tableY + 2.5);

          doc.setFont('courier', 'bold');
          doc.text(task.id, 86, tableY + 2.5);

          doc.setFont('times', 'normal');
          doc.setTextColor(30, 30, 30);
          doc.text(task.name.substring(0, 55), 110, tableY + 2.5);

          doc.text(`[${trade?.code || 'GC'}] ${trade?.name.substring(0, 24) || ''}`, 210, tableY + 2.5);
          doc.text(`Day ${task.day}`, 280, tableY + 2.5);
          doc.text(`${task.duration}d`, 295, tableY + 2.5);
          doc.text(`${task.crewSize}p`, 310, tableY + 2.5);

          doc.setFontSize(7.5);
          doc.setTextColor(0, 102, 179);
          doc.text(preds.substring(0, 32), 325, tableY + 2.5);

          const statusStr = task.status.toUpperCase();
          const constrStr = (task.constraints || []).length > 0 ? ` [${task.constraints?.join('; ')}]` : '';
          doc.setTextColor(task.status === 'complete' ? 16 : 100, task.status === 'complete' ? 149 : 100, task.status === 'complete' ? 109 : 100);
          doc.text(`${statusStr}${constrStr}`.substring(0, 30), 375, tableY + 2.5);

          tableY += 5.5;
        });

        tableY += 2;
      });

      doc.save(`${project.title.replace(/\s+/g, '_')}_11x17_PullPlan.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-slate-300 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0066B3]" />
            <h2 className="text-base font-black text-slate-900 uppercase">
              Export 11x17 Landscape PDF Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Target Standard:</span>
              <span className="font-mono text-[#0066B3] font-bold">
                ANSI B (11" x 17" Tabloid Landscape)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Total Activities:</span>
              <span className="font-mono text-slate-900 font-bold">{project.tasks.length} Notes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Dependencies:</span>
              <span className="font-mono text-slate-900 font-bold">{project.dependencies.length} Hand-offs</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prepared By (Title Block)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0066B3]"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDependencies}
                onChange={(e) => setIncludeDependencies(e.target.checked)}
                className="rounded border-slate-300 text-[#0066B3] focus:ring-[#0066B3]"
              />
              <span className="text-slate-800 font-bold">
                Include Predecessor and Successor Hand-off Codes
              </span>
            </label>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownloadJsPdf}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-[#0066B3] hover:bg-[#005291] text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 font-sans"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>11x17 PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download 11x17 Landscape PDF Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg border-2 border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all font-sans"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print to 11x17 Landscape (Browser Engine)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold cursor-pointer font-sans"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
