/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  PullPlanProject,
  StickyNote,
  SwimLane,
  Trade,
  Dependency,
  DependencyType,
  StickyShape,
} from './types';
import { INITIAL_PROJECT } from './defaultData';
import { Header } from './components/Header';
import { PullPlanBoard } from './components/PullPlanBoard';
import { SidebarEditor } from './components/SidebarEditor';
import { FooterDependencies } from './components/FooterDependencies';
import { TradeManagerModal } from './components/TradeManagerModal';
import { PdfExportModal } from './components/PdfExportModal';
import { PrintReportView } from './components/PrintReportView';
import {
  handleLanePlacementDependencies,
  addOrUpdateDependency,
  removeDependency,
  updateDependency,
  getCriticalPathTaskIds,
} from './utils/dependencyLogic';
import {
  generateP6Workbook,
  parseP6OrExcelWorkbook,
} from './utils/p6Format';

const LOCAL_STORAGE_KEY = 'clark_pull_plan_project_v1';

export default function App() {
  // Load from localStorage or initial realistic Clark Construction sample
  const [project, setProject] = useState<PullPlanProject>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading stored project:', e);
    }
    return INITIAL_PROJECT;
  });

  // Selected sticky note (opens both right sidebar and bottom footer simultaneously!)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Settings & Filters
  const [autoLinkEnabled, setAutoLinkEnabled] = useState(true);
  const [criticalPathEnabled, setCriticalPathEnabled] = useState(false);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string | null>(null);

  // Modals
  const [isTradeManagerOpen, setIsTradeManagerOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [project]);

  // Selected Task object
  const selectedTask = useMemo(() => {
    return project.tasks.find((t) => t.id === selectedTaskId) || null;
  }, [project.tasks, selectedTaskId]);

  // Critical path calculation
  const criticalTaskIds = useMemo(() => {
    if (!criticalPathEnabled) return new Set<string>();
    return getCriticalPathTaskIds(project.tasks, project.dependencies);
  }, [project.tasks, project.dependencies, criticalPathEnabled]);

  // 1. Quick Add Sticky Note (Single click / zero friction)
  const handleAddTaskAtCell = (laneId: string, day: number) => {
    // Generate next available Activity ID
    const maxIdNum = project.tasks.reduce((max, t) => {
      const match = t.id.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0])) : max;
    }, 1000);
    const newId = `ACT-${maxIdNum + 10}`;

    // Pick a trade (filter if active, else GC or first trade)
    const defaultTradeId =
      selectedTradeFilter || project.trades[0]?.id || 'TRADE-GC';

    const newTask: StickyNote = {
      id: newId,
      name: 'New Activity',
      tradeId: defaultTradeId,
      laneId,
      day,
      duration: 2,
      crewSize: 4,
      shape: 'rectangle',
      status: 'planned',
      constraints: [],
    };

    let updatedDependencies = project.dependencies;
    if (autoLinkEnabled) {
      updatedDependencies = handleLanePlacementDependencies(
        newTask,
        project.tasks,
        project.dependencies
      );
    }

    setProject((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
      dependencies: updatedDependencies,
      updatedAt: new Date().toISOString(),
    }));

    // Auto-select newly created sticky note so user can immediately edit description
    setSelectedTaskId(newId);
  };

  const handleAddStickyQuick = () => {
    const firstLane = project.lanes[0]?.id || 'LANE-1';
    // Find next open day in first lane
    const laneTasks = project.tasks.filter((t) => t.laneId === firstLane);
    const maxDay = laneTasks.reduce((max, t) => Math.max(max, t.day + t.duration), 1);
    handleAddTaskAtCell(firstLane, Math.min(maxDay, project.totalDays - 2));
  };

  // 2. Move Sticky Note (Drag across cells / lanes)
  const handleMoveTask = (taskId: string, targetLaneId: string, targetDay: number) => {
    const existingTask = project.tasks.find((t) => t.id === taskId);
    if (!existingTask) return;

    const previousLaneId = existingTask.laneId;
    const updatedTask: StickyNote = {
      ...existingTask,
      laneId: targetLaneId,
      day: Math.max(1, targetDay),
    };

    const remainingTasks = project.tasks.filter((t) => t.id !== taskId);
    const newTasksList = [...remainingTasks, updatedTask];

    let updatedDependencies = project.dependencies;
    if (autoLinkEnabled) {
      updatedDependencies = handleLanePlacementDependencies(
        updatedTask,
        newTasksList,
        project.dependencies,
        previousLaneId
      );
    }

    setProject((prev) => ({
      ...prev,
      tasks: newTasksList,
      dependencies: updatedDependencies,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Resize Sticky Note duration by dragging edge (snapping to day)
  const handleResizeTaskDuration = (taskId: string, newDuration: number) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, duration: Math.max(1, newDuration) } : t
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 3. Update Sticky Note from Sidebar
  const handleUpdateTask = (updatedTask: StickyNote) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      updatedAt: new Date().toISOString(),
    }));
  };

  // 4. Delete Sticky Note
  const handleDeleteTask = (taskId: string) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      dependencies: prev.dependencies.filter(
        (d) => d.fromTaskId !== taskId && d.toTaskId !== taskId
      ),
      updatedAt: new Date().toISOString(),
    }));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  // 5. Duplicate Sticky Note
  const handleDuplicateTask = (taskToDup: StickyNote) => {
    const maxIdNum = project.tasks.reduce((max, t) => {
      const match = t.id.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0])) : max;
    }, 1000);
    const newId = `ACT-${maxIdNum + 10}`;

    const dupTask: StickyNote = {
      ...taskToDup,
      id: newId,
      name: `${taskToDup.name} (Copy)`,
      day: Math.min(taskToDup.day + taskToDup.duration, project.totalDays - 1),
    };

    let updatedDependencies = project.dependencies;
    if (autoLinkEnabled) {
      updatedDependencies = handleLanePlacementDependencies(
        dupTask,
        project.tasks,
        project.dependencies
      );
    }

    setProject((prev) => ({
      ...prev,
      tasks: [...prev.tasks, dupTask],
      dependencies: updatedDependencies,
      updatedAt: new Date().toISOString(),
    }));

    setSelectedTaskId(newId);
  };

  // 6. Dependencies Management
  const handleAddDependency = (
    fromTaskId: string,
    toTaskId: string,
    type: DependencyType = 'FS',
    lag: number = 0
  ) => {
    const updated = addOrUpdateDependency(
      project.dependencies,
      fromTaskId,
      toTaskId,
      type,
      lag
    );
    setProject((prev) => ({
      ...prev,
      dependencies: updated,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRemoveDependency = (depId: string) => {
    const updated = removeDependency(project.dependencies, depId);
    setProject((prev) => ({
      ...prev,
      dependencies: updated,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateDependency = (
    depId: string,
    updates: Partial<Pick<Dependency, 'type' | 'lag'>>
  ) => {
    const updated = updateDependency(project.dependencies, depId, updates);
    setProject((prev) => ({
      ...prev,
      dependencies: updated,
      updatedAt: new Date().toISOString(),
    }));
  };

  // 7. Swimlane Management
  const handleAddLane = () => {
    const newNum = project.lanes.length + 1;
    const newLane: SwimLane = {
      id: `LANE-${Date.now()}`,
      name: `New Zone / Sector ${newNum}`,
      wbsCode: `WBS-1.0${newNum}`,
      order: newNum,
    };
    setProject((prev) => ({
      ...prev,
      lanes: [...prev.lanes, newLane],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteLane = (laneId: string) => {
    if (project.lanes.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      lanes: prev.lanes.filter((l) => l.id !== laneId),
      // Move orphaned tasks to first lane
      tasks: prev.tasks.map((t) =>
        t.laneId === laneId
          ? { ...t, laneId: prev.lanes.find((l) => l.id !== laneId)?.id || 'LANE-1' }
          : t
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateLane = (laneId: string, name: string, wbsCode: string) => {
    setProject((prev) => ({
      ...prev,
      lanes: prev.lanes.map((l) => (l.id === laneId ? { ...l, name, wbsCode } : l)),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Extend timeline
  const handleAddDays = () => {
    setProject((prev) => ({
      ...prev,
      totalDays: prev.totalDays + 5,
    }));
  };

  // 8. P6 XLSX Export & Import
  const handleExportP6 = () => {
    try {
      const wb = generateP6Workbook(project);
      const fileName = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_P6_Export.xlsx`;
      XLSX.writeFile(wb, fileName);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      console.error('Error exporting P6 workbook:', e);
      alert('Could not export P6 file. Please check console for details.');
    }
  };

  const handleImportP6 = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseP6OrExcelWorkbook(buffer, project);
      setProject((prev) => ({
        ...prev,
        tasks: parsed.tasks,
        lanes: parsed.lanes,
        trades: parsed.trades,
        dependencies: parsed.dependencies,
        totalDays: parsed.totalDays,
        updatedAt: new Date().toISOString(),
      }));
      setSelectedTaskId(null);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error('Error importing P6 file:', e);
      alert('Failed to parse Excel file. Ensure it contains a TASK or Activities sheet.');
    }
  };

  // 9. Local JSON Save / Load
  const handleSaveLocalJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${project.title.replace(/\s+/g, '_')}_pullplan.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLoadLocalJson = async (file: File) => {
    try {
      const text = await file.text();
      const loadedProject = JSON.parse(text) as PullPlanProject;
      if (loadedProject && Array.isArray(loadedProject.tasks)) {
        setProject(loadedProject);
        setSelectedTaskId(null);
      }
    } catch (e) {
      console.error('Error loading JSON project:', e);
      alert('Invalid project JSON file.');
    }
  };

  // Reset to default sample
  const handleResetSample = () => {
    if (window.confirm('Reset board to Clark Construction sample pull plan?')) {
      setProject(INITIAL_PROJECT);
      setSelectedTaskId(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setProject((prev) => ({
      ...prev,
      dayWidth: Math.min(240, prev.dayWidth + 15),
    }));
  };

  const handleZoomOut = () => {
    setProject((prev) => ({
      ...prev,
      dayWidth: Math.max(90, prev.dayWidth - 15),
    }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white text-slate-900 font-sans">
      {/* Top Application Bar */}
      <Header
        project={project}
        selectedTradeFilter={selectedTradeFilter}
        autoLinkEnabled={autoLinkEnabled}
        criticalPathEnabled={criticalPathEnabled}
        onUpdateTitle={(title) => setProject((p) => ({ ...p, title }))}
        onUpdateProjectNumber={(projectNumber) =>
          setProject((p) => ({ ...p, projectNumber }))
        }
        onUpdateLogo={(logoUrl) => setProject((p) => ({ ...p, logoUrl }))}
        onAddStickyQuick={handleAddStickyQuick}
        onToggleAutoLink={() => setAutoLinkEnabled(!autoLinkEnabled)}
        onToggleCriticalPath={() => setCriticalPathEnabled(!criticalPathEnabled)}
        onSelectTradeFilter={setSelectedTradeFilter}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onExportP6={handleExportP6}
        onImportP6={handleImportP6}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenTradeManager={() => setIsTradeManagerOpen(true)}
        onSaveLocalJson={handleSaveLocalJson}
        onLoadLocalJson={handleLoadLocalJson}
        onResetSample={handleResetSample}
      />

      {/* Main Pull Plan Interactive Grid */}
      <PullPlanBoard
        project={project}
        selectedTaskId={selectedTaskId}
        selectedTradeFilter={selectedTradeFilter}
        criticalTaskIds={criticalTaskIds}
        autoLinkEnabled={autoLinkEnabled}
        onSelectTask={(task) => setSelectedTaskId(task.id)}
        onAddTaskAtCell={handleAddTaskAtCell}
        onMoveTask={handleMoveTask}
        onResizeTaskDuration={handleResizeTaskDuration}
        onAddDependency={handleAddDependency}
        onDeleteDependency={handleRemoveDependency}
        onAddLane={handleAddLane}
        onDeleteLane={handleDeleteLane}
        onUpdateLane={handleUpdateLane}
        onAddDays={handleAddDays}
      />

      {/* Sidebar Editor (Slides out from right when a sticky note is selected) */}
      {selectedTask && (
        <SidebarEditor
          task={selectedTask}
          trades={project.trades}
          lanes={project.lanes}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onDuplicate={handleDuplicateTask}
          onClose={() => setSelectedTaskId(null)}
          onOpenTradeManager={() => setIsTradeManagerOpen(true)}
        />
      )}

      {/* Footer Dependencies Dock (Pops out from bottom when a sticky note is selected) */}
      {selectedTask && (
        <FooterDependencies
          selectedTask={selectedTask}
          allTasks={project.tasks}
          trades={project.trades}
          dependencies={project.dependencies}
          onAddDependency={handleAddDependency}
          onRemoveDependency={handleRemoveDependency}
          onUpdateDependency={handleUpdateDependency}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Trade & Colors Manager Modal */}
      <TradeManagerModal
        isOpen={isTradeManagerOpen}
        trades={project.trades}
        onClose={() => setIsTradeManagerOpen(false)}
        onUpdateTrades={(trades) =>
          setProject((prev) => ({ ...prev, trades }))
        }
      />

      {/* 11x17 Landscape PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        project={project}
        onClose={() => setIsPdfModalOpen(false)}
      />

      {/* 11x17 Landscape Print View (Targeted by @media print) */}
      <PrintReportView project={project} />
    </div>
  );
}
