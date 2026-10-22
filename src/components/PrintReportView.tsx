import React from 'react';
import { PullPlanProject } from '../types';
import { calculateWorkDate } from '../utils/p6Format';

interface PrintReportViewProps {
  project: PullPlanProject;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ project }) => {
  const tradeMap = new Map(project.trades.map((t) => [t.id, t]));

  return (
    <div className="hidden print-only p-4 text-black bg-white min-w-full">
      {/* 11x17 Title Block Header */}
      <div className="border-4 border-[#001430] p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 bg-[#001430] text-white flex flex-col items-center justify-center font-bold">
            <span className="text-sm font-extrabold text-[#00A9E0]">CLARK</span>
            <span className="text-[8px] tracking-widest">BUILD</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#001430] uppercase">
              {project.title}
            </h1>
            <p className="text-xs font-bold text-[#00A9E0]">
              LEAN PULL PLANNING WORKFLOW & DELIVERABLES (HIGH LOD)
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono space-y-0.5">
          <div><span className="font-bold">Project Number:</span> {project.projectNumber}</div>
          <div><span className="font-bold">Start Date:</span> {project.startDate}</div>
          <div><span className="font-bold">Generated:</span> {new Date().toLocaleDateString()}</div>
          <div className="text-[10px] text-gray-600">Standard: 11" x 17" Tabloid Landscape</div>
        </div>
      </div>

      {/* Trade Color Swatches Legend */}
      <div className="flex items-center gap-2 mb-4 p-2 border border-gray-300 bg-gray-50 flex-wrap">
        <span className="text-xs font-bold mr-2">TRADE LEGEND:</span>
        {project.trades.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-400 text-xs font-semibold"
            style={{ backgroundColor: trade.color, color: trade.textColor || '#FFFFFF' }}
          >
            <span>[{trade.code}]</span>
            <span>{trade.name}</span>
          </div>
        ))}
      </div>

      {/* Detailed Tasks Breakdown by Swimlane */}
      <div className="space-y-4">
        {project.lanes.map((lane) => {
          const laneTasks = project.tasks
            .filter((t) => t.laneId === lane.id)
            .sort((a, b) => a.day - b.day);

          return (
            <div key={lane.id} className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#001430] text-white px-3 py-1 text-xs font-bold flex justify-between">
                <span>{lane.name} ({lane.wbsCode})</span>
                <span>{laneTasks.length} Planned Tasks</span>
              </div>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-[11px]">
                    <th className="p-1.5">ID</th>
                    <th className="p-1.5">Activity Description</th>
                    <th className="p-1.5">Trade / Sub</th>
                    <th className="p-1.5">Plan Day</th>
                    <th className="p-1.5">Duration</th>
                    <th className="p-1.5">Crew</th>
                    <th className="p-1.5">Predecessors</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {laneTasks.map((t, idx) => {
                    const trade = tradeMap.get(t.tradeId);
                    const preds = project.dependencies
                      .filter((d) => d.toTaskId === t.id)
                      .map((d) => `${d.fromTaskId} (${d.type})`)
                      .join(', ') || '-';

                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-gray-200 ${
                          idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        <td className="p-1.5 font-mono font-bold">{t.id}</td>
                        <td className="p-1.5 font-medium">{t.name}</td>
                        <td className="p-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: trade?.color, color: trade?.textColor || '#FFF' }}
                          >
                            {trade?.code}
                          </span>{' '}
                          {trade?.name}
                        </td>
                        <td className="p-1.5 font-mono">Day {t.day}</td>
                        <td className="p-1.5 font-mono">{t.duration}d</td>
                        <td className="p-1.5 font-mono">{t.crewSize} workers</td>
                        <td className="p-1.5 font-mono text-[10px] text-blue-700">{preds}</td>
                        <td className="p-1.5 uppercase text-[10px] font-bold">{t.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};
