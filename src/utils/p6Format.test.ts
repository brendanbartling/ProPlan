import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  generateP6Workbook,
  parseP6OrExcelWorkbook,
  toP6PredType,
  fromP6PredType,
} from './p6Format';
import { PullPlanProject } from '../types';

const sampleProject: PullPlanProject = {
  id: 'PROJ-TEST',
  title: 'Tower 4 - Level 2 Fit-out',
  projectNumber: 'CC-2026-908',
  startDate: '2026-11-02',
  totalDays: 20,
  dayWidth: 140,
  lanes: [
    { id: 'LANE-1', name: 'Level 2 - Zone A', wbsCode: '1.02.01', order: 1 },
    { id: 'LANE-2', name: 'Level 2 - Zone B', wbsCode: '1.02.02', order: 2 },
  ],
  trades: [
    {
      id: 'TRADE-ELEC',
      name: 'Electrical',
      code: 'E',
      color: '#FFCD00',
      textColor: '#000000',
      company: 'PowerLine Systems',
    },
    {
      id: 'TRADE-MECH',
      name: 'Mechanical',
      code: 'M',
      color: '#00A9E0',
      textColor: '#FFFFFF',
      company: 'Apex HVAC',
    },
  ],
  tasks: [
    {
      id: 'ACT-1010',
      name: 'Install Cable Trays',
      tradeId: 'TRADE-ELEC',
      laneId: 'LANE-1',
      day: 1,
      duration: 3,
      crewSize: 4,
      shape: 'rectangle',
      status: 'complete',
      constraints: ['Material verified'],
    },
    {
      id: 'ACT-1020',
      name: 'Ductwork Rough-in',
      tradeId: 'TRADE-MECH',
      laneId: 'LANE-1',
      day: 4,
      duration: 2,
      crewSize: 3,
      shape: 'rectangle',
      status: 'planned',
    },
  ],
  dependencies: [
    {
      id: 'DEP-1',
      fromTaskId: 'ACT-1010',
      toTaskId: 'ACT-1020',
      type: 'FS',
      lag: 0,
    },
  ],
  updatedAt: new Date().toISOString(),
};

test('P6 Pred Type mapping functions correctly', () => {
  assert.equal(toP6PredType('FS'), 'PR_FS');
  assert.equal(toP6PredType('SS'), 'PR_SS');
  assert.equal(toP6PredType('FF'), 'PR_FF');

  assert.equal(fromP6PredType('PR_FS'), 'FS');
  assert.equal(fromP6PredType('PR_SS'), 'SS');
  assert.equal(fromP6PredType('PR_FF'), 'FF');
});

test('generateP6Workbook produces TASK, TASKPRED, and PULL_PLAN_SUMMARY sheets', () => {
  const wb = generateP6Workbook(sampleProject);
  assert.ok(wb.SheetNames.includes('TASK'));
  assert.ok(wb.SheetNames.includes('TASKPRED'));
  assert.ok(wb.SheetNames.includes('PULL_PLAN_SUMMARY'));
  assert.ok(wb.SheetNames.includes('TRADE_ROSTER'));

  const taskRows = XLSX.utils.sheet_to_json<any>(wb.Sheets['TASK']);
  assert.equal(taskRows.length, 2);
  assert.equal(taskRows[0].task_code, 'ACT-1010');
  assert.equal(taskRows[0].target_durn_hr_cnt, 24); // 3 days * 8h

  const predRows = XLSX.utils.sheet_to_json<any>(wb.Sheets['TASKPRED']);
  assert.equal(predRows.length, 1);
  assert.equal(predRows[0].pred_task_id, 'ACT-1010');
  assert.equal(predRows[0].task_id, 'ACT-1020');
});

test('parseP6OrExcelWorkbook round-trips exported project data accurately', () => {
  const wb = generateP6Workbook(sampleProject);
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const parsed = parseP6OrExcelWorkbook(buffer, sampleProject);
  assert.equal(parsed.tasks.length, 2);
  assert.equal(parsed.tasks[0].id, 'ACT-1010');
  assert.equal(parsed.tasks[1].id, 'ACT-1020');
  assert.equal(parsed.dependencies.length, 1);
  assert.equal(parsed.dependencies[0].fromTaskId, 'ACT-1010');
  assert.equal(parsed.dependencies[0].toTaskId, 'ACT-1020');
});
