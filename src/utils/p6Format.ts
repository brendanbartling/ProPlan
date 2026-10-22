import * as XLSX from 'xlsx';
import { Dependency, DependencyType, PullPlanProject, StickyNote, SwimLane, Trade } from '../types';

/**
 * Converts internal dependency type to P6 relationship code
 */
export function toP6PredType(type: DependencyType): string {
  switch (type) {
    case 'FS':
      return 'PR_FS';
    case 'SS':
      return 'PR_SS';
    case 'FF':
      return 'PR_FF';
    case 'SS&FF':
      return 'PR_FS'; // Closest P6 single relationship code or dual
    default:
      return 'PR_FS';
  }
}

/**
 * Converts P6 relationship code to internal dependency type
 */
export function fromP6PredType(p6Code: string): DependencyType {
  const code = (p6Code || '').trim().toUpperCase();
  if (code.includes('SS')) return 'SS';
  if (code.includes('FF')) return 'FF';
  if (code.includes('SF')) return 'SS&FF';
  return 'FS';
}

/**
 * Calculates start and finish dates given a project start date and day index (1-indexed work days)
 */
export function calculateWorkDate(projectStartDate: string, dayOffset: number): string {
  const start = new Date(projectStartDate);
  if (isNaN(start.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  // Count work days (skipping weekends if needed, or simple calendar offset)
  const date = new Date(start);
  let daysAdded = 0;
  // Offset of 1 means start day itself
  const targetOffset = Math.max(0, dayOffset - 1);
  while (daysAdded < targetOffset) {
    date.setDate(date.getDate() + 1);
    // skip Saturday(6) and Sunday(0)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      daysAdded++;
    }
  }
  return date.toISOString().split('T')[0];
}

/**
 * Generates an Excel workbook compatible with Primavera P6 and spreadsheet review
 */
export function generateP6Workbook(project: PullPlanProject): XLSX.WorkBook {
  const tradeMap = new Map(project.trades.map((t) => [t.id, t]));
  const laneMap = new Map(project.lanes.map((l) => [l.id, l]));

  // 1. TASK sheet (P6 standard schema)
  const taskRows = project.tasks.map((task) => {
    const trade = tradeMap.get(task.tradeId);
    const lane = laneMap.get(task.laneId);
    const startDate = calculateWorkDate(project.startDate, task.day);
    const finishDate = calculateWorkDate(project.startDate, task.day + task.duration - 1);
    const hours = task.duration * 8;
    const crew = task.crewSize || 1;
    const totalManhours = hours * crew;

    let p6Status = 'TK_NotStart';
    if (task.status === 'in_progress') p6Status = 'TK_Active';
    if (task.status === 'complete') p6Status = 'TK_Complete';

    return {
      task_code: task.id,
      task_name: task.name,
      wbs_code: lane?.wbsCode || 'WBS-1.0',
      wbs_name: lane?.name || 'General Area',
      status_code: p6Status,
      target_durn_hr_cnt: hours,
      remain_durn_hr_cnt: task.status === 'complete' ? 0 : hours,
      target_start_date: `${startDate} 07:00`,
      target_end_date: `${finishDate} 15:30`,
      rsrc_id: trade?.code || 'GC',
      rsrc_name: trade?.name || 'General Contractor',
      trade_company: trade?.company || '',
      crew_size: crew,
      total_manhours: totalManhours,
      task_type: task.shape === 'diamond' ? 'TT_Mile' : 'TT_Task',
      shape: task.shape,
      board_day: task.day,
      constraints: (task.constraints || []).join('; '),
      notes: task.notes || '',
    };
  });

  // 2. TASKPRED sheet (P6 relationship schema)
  const taskpredRows = project.dependencies.map((dep) => {
    const lagHours = (dep.lag || 0) * 8;
    return {
      pred_task_id: dep.fromTaskId,
      task_id: dep.toTaskId,
      pred_type: toP6PredType(dep.type),
      lag_hr_cnt: lagHours,
      custom_type: dep.type,
      lag_days: dep.lag,
    };
  });

  // 3. PROJWBS sheet
  const wbsRows = project.lanes.map((lane, index) => ({
    wbs_short_name: lane.wbsCode,
    wbs_name: lane.name,
    seq_num: index + 1,
  }));

  // 4. PULL_PLAN_SUMMARY (Human-friendly superintendent board view)
  const summaryRows = project.tasks.map((task) => {
    const trade = tradeMap.get(task.tradeId);
    const lane = laneMap.get(task.laneId);
    const preds = project.dependencies
      .filter((d) => d.toTaskId === task.id)
      .map((d) => `${d.fromTaskId} (${d.type}${d.lag ? ` +${d.lag}d` : ''})`)
      .join(', ');
    const succs = project.dependencies
      .filter((d) => d.fromTaskId === task.id)
      .map((d) => `${d.toTaskId} (${d.type})`)
      .join(', ');

    return {
      'Activity ID': task.id,
      'Activity Description': task.name,
      'Trade / Responsible': trade?.name || 'GC',
      'Trade Code': trade?.code || 'GC',
      'Subcontractor Company': trade?.company || '',
      'Location / Swimlane': lane?.name || '',
      'Plan Day': task.day,
      'Duration (Days)': task.duration,
      'Crew Size': task.crewSize,
      'Total Manhours': task.duration * task.crewSize * 8,
      Shape: task.shape,
      Status: task.status,
      Predecessors: preds || 'None',
      Successors: succs || 'None',
      Constraints: (task.constraints || []).join('; ') || 'None',
    };
  });

  // 5. TRADE_ROSTER sheet
  const tradeRows = project.trades.map((t) => {
    const tradeTasks = project.tasks.filter((tk) => tk.tradeId === t.id);
    const totalHours = tradeTasks.reduce(
      (sum, tk) => sum + tk.duration * (tk.crewSize || 1) * 8,
      0
    );
    return {
      'Trade Code': t.code,
      'Trade Name': t.name,
      'Subcontractor / Vendor': t.company || '',
      Color: t.color,
      'Total Activities': tradeTasks.length,
      'Planned Manhours': totalHours,
    };
  });

  const wb = XLSX.utils.book_new();

  // Create worksheets
  const wsTask = XLSX.utils.json_to_sheet(taskRows);
  const wsPred = XLSX.utils.json_to_sheet(taskpredRows);
  const wsWbs = XLSX.utils.json_to_sheet(wbsRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsTrades = XLSX.utils.json_to_sheet(tradeRows);

  // Set column widths for clean readability
  wsSummary['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 26 },
    { wch: 26 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, wsTask, 'TASK');
  XLSX.utils.book_append_sheet(wb, wsPred, 'TASKPRED');
  XLSX.utils.book_append_sheet(wb, wsWbs, 'PROJWBS');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'PULL_PLAN_SUMMARY');
  XLSX.utils.book_append_sheet(wb, wsTrades, 'TRADE_ROSTER');

  return wb;
}

/**
 * Parses an uploaded XLSX file into PullPlanProject tasks, lanes, trades, and dependencies
 */
export function parseP6OrExcelWorkbook(
  data: ArrayBuffer,
  currentProject: PullPlanProject
): {
  tasks: StickyNote[];
  lanes: SwimLane[];
  trades: Trade[];
  dependencies: Dependency[];
  totalDays: number;
} {
  const wb = XLSX.read(data, { type: 'array' });
  const sheetNames = wb.SheetNames;

  let tasks: StickyNote[] = [];
  let dependencies: Dependency[] = [];
  const lanesMap = new Map<string, SwimLane>(currentProject.lanes.map((l) => [l.id, l]));
  const tradesMap = new Map<string, Trade>(currentProject.trades.map((t) => [t.id, t]));

  // Check if standard P6 sheets exist
  const taskSheetName = sheetNames.find(
    (s) => s.toUpperCase() === 'TASK' || s.toUpperCase() === 'TASKS' || s.toUpperCase() === 'PULL_PLAN_SUMMARY'
  );
  const predSheetName = sheetNames.find(
    (s) => s.toUpperCase() === 'TASKPRED' || s.toUpperCase() === 'PRED' || s.toUpperCase() === 'DEPENDENCIES'
  );

  if (taskSheetName) {
    const rawRows = XLSX.utils.sheet_to_json<any>(wb.Sheets[taskSheetName]);

    let dayCounter = 1;
    let maxDayFound = 1;

    rawRows.forEach((row, idx) => {
      const id = String(
        row.task_code || row['Activity ID'] || row.taskId || row.ID || `ACT-${1000 + idx * 10}`
      ).trim();
      const name = String(
        row.task_name || row['Activity Description'] || row.Name || row.description || `Task ${idx + 1}`
      ).trim();
      const wbs = String(row.wbs_name || row['Location / Swimlane'] || row.wbs_code || 'General Location').trim();
      const tradeName = String(
        row.rsrc_name || row['Trade / Responsible'] || row.rsrc_id || row['Trade Code'] || 'GC'
      ).trim();

      // Find or create lane
      let lane = Array.from(lanesMap.values()).find(
        (l) => l.name.toLowerCase() === wbs.toLowerCase() || l.wbsCode.toLowerCase() === wbs.toLowerCase()
      );
      if (!lane) {
        const laneId = `LANE-${lanesMap.size + 1}`;
        lane = {
          id: laneId,
          name: wbs,
          wbsCode: row.wbs_code || `WBS-${lanesMap.size + 1}.0`,
          order: lanesMap.size + 1,
        };
        lanesMap.set(laneId, lane);
      }

      // Find or create trade
      let trade = Array.from(tradesMap.values()).find(
        (t) =>
          t.name.toLowerCase() === tradeName.toLowerCase() ||
          t.code.toLowerCase() === tradeName.toLowerCase()
      );
      if (!trade) {
        const tradeId = `TRADE-${tradesMap.size + 1}`;
        trade = {
          id: tradeId,
          name: tradeName,
          code: tradeName.substring(0, 4).toUpperCase(),
          color: '#00A9E0',
          textColor: '#FFFFFF',
          company: row.trade_company || row['Subcontractor Company'] || '',
          isCustom: true,
        };
        tradesMap.set(tradeId, trade);
      }

      // Duration: hours / 8 or explicit days
      let duration = 1;
      if (row.target_durn_hr_cnt) {
        duration = Math.max(1, Math.round(Number(row.target_durn_hr_cnt) / 8));
      } else if (row['Duration (Days)']) {
        duration = Math.max(1, Math.round(Number(row['Duration (Days)'])));
      } else if (row.duration) {
        duration = Math.max(1, Math.round(Number(row.duration)));
      }

      // Day
      let day = 1;
      if (row.board_day) {
        day = Number(row.board_day);
      } else if (row['Plan Day']) {
        day = Number(row['Plan Day']);
      } else {
        day = (idx % 12) + 1;
      }
      maxDayFound = Math.max(maxDayFound, day + duration);

      // Crew size
      const crew = Number(row.crew_size || row['Crew Size'] || 4) || 4;

      // Shape
      let shape: 'rectangle' | 'diamond' | 'circle' = 'rectangle';
      if (row.shape === 'diamond' || row.task_type === 'TT_Mile') shape = 'diamond';
      if (row.shape === 'circle') shape = 'circle';

      // Status
      let status: 'planned' | 'ready' | 'in_progress' | 'complete' | 'delayed' = 'planned';
      if (row.status_code === 'TK_Complete' || row.Status === 'complete') status = 'complete';
      if (row.status_code === 'TK_Active' || row.Status === 'in_progress') status = 'in_progress';

      const constraints = row.constraints ? String(row.constraints).split(';').map((c) => c.trim()).filter(Boolean) : [];

      tasks.push({
        id,
        name,
        tradeId: trade.id,
        laneId: lane.id,
        day,
        duration,
        crewSize: crew,
        shape,
        status,
        constraints,
        notes: row.notes || '',
      });
    });

    // 2. Read dependencies if sheet exists
    if (predSheetName) {
      const rawPreds = XLSX.utils.sheet_to_json<any>(wb.Sheets[predSheetName]);
      rawPreds.forEach((pred, i) => {
        const fromTaskId = String(pred.pred_task_id || pred['Predecessor Task Code'] || pred.fromTaskId || '').trim();
        const toTaskId = String(pred.task_id || pred['Successor Task Code'] || pred.toTaskId || '').trim();
        const predTypeRaw = String(pred.pred_type || pred.custom_type || 'PR_FS');
        const lagDays = pred.lag_days ? Number(pred.lag_days) : (pred.lag_hr_cnt ? Math.round(Number(pred.lag_hr_cnt) / 8) : 0);

        if (fromTaskId && toTaskId) {
          dependencies.push({
            id: `DEP-IMP-${i + 1}`,
            fromTaskId,
            toTaskId,
            type: fromP6PredType(predTypeRaw),
            lag: lagDays || 0,
          });
        }
      });
    }
  }

  return {
    tasks: tasks.length > 0 ? tasks : currentProject.tasks,
    lanes: Array.from(lanesMap.values()),
    trades: Array.from(tradesMap.values()),
    dependencies,
    totalDays: Math.max(25, tasks.reduce((max, t) => Math.max(max, t.day + t.duration + 2), 20)),
  };
}
