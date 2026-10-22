import { PullPlanProject, Trade, SwimLane, StickyNote, Dependency } from './types';

export const DEFAULT_TRADES: Trade[] = [
  {
    id: 'TRADE-GC',
    name: 'General Contractor',
    code: 'GC',
    color: '#00A9E0', // Primary Bright Blue
    textColor: '#FFFFFF',
    company: 'Clark Construction Group',
  },
  {
    id: 'TRADE-CONC',
    name: 'Concrete & Foundations',
    code: 'CONC',
    color: '#702082', // Secondary Purple
    textColor: '#FFFFFF',
    company: 'Baker Concrete Construction',
  },
  {
    id: 'TRADE-STEEL',
    name: 'Ironworking & Structural Steel',
    code: 'IRON',
    color: '#FF8E00', // Secondary Vibrant Orange
    textColor: '#000000',
    company: 'Schuff Steel Co.',
  },
  {
    id: 'TRADE-MECH',
    name: 'Mechanical & HVAC',
    code: 'M',
    color: '#0066B3', // Medium Blue
    textColor: '#FFFFFF',
    company: 'Southland Industries',
  },
  {
    id: 'TRADE-ELEC',
    name: 'Electrical & Telecom',
    code: 'E',
    color: '#FFCD00', // Secondary Yellow
    textColor: '#000000',
    company: 'Rosendin Electric',
  },
  {
    id: 'TRADE-PLUMB',
    name: 'Plumbing & Hydronics',
    code: 'P',
    color: '#0284C7', // Sky Blue
    textColor: '#FFFFFF',
    company: 'Apollo Mechanical',
  },
  {
    id: 'TRADE-DRY',
    name: 'Drywall, Framing & ACT',
    code: 'DRY',
    color: '#00C76D', // Secondary Green
    textColor: '#000000',
    company: 'KHS&S Contractors',
  },
  {
    id: 'TRADE-FP',
    name: 'Fire Protection Sprinklers',
    code: 'FP',
    color: '#DC2626', // Crimson
    textColor: '#FFFFFF',
    company: 'Western States Fire',
  },
  {
    id: 'TRADE-GLAZ',
    name: 'Glazing & Curtain Wall',
    code: 'GLZ',
    color: '#0D9488', // Teal
    textColor: '#FFFFFF',
    company: 'Enclos Corp',
  },
  {
    id: 'TRADE-ROOF',
    name: 'Roofing & Waterproofing',
    code: 'ROOF',
    color: '#854D0E', // Brown
    textColor: '#FFFFFF',
    company: 'Tremco Commercial',
  },
  {
    id: 'TRADE-CLN',
    name: 'Cleaners & Labor Support',
    code: 'CLN',
    color: '#001430', // Deep Navy
    textColor: '#FFFFFF',
    company: 'Apex Site Services',
  },
  {
    id: 'TRADE-OWN',
    name: 'Owner / Inspections / AHJ',
    code: 'OWN',
    color: '#E11D48', // Rose
    textColor: '#FFFFFF',
    company: 'City Building Inspector / Owner Rep',
  },
];

export const DEFAULT_LANES: SwimLane[] = [
  { id: 'LANE-1', name: 'Level 1 - Sector A (East Pod)', wbsCode: 'WBS-1.01', order: 1 },
  { id: 'LANE-2', name: 'Level 1 - Sector B (West Pod)', wbsCode: 'WBS-1.02', order: 2 },
  { id: 'LANE-3', name: 'Core, Shafts & MEP Risers', wbsCode: 'WBS-1.03', order: 3 },
  { id: 'LANE-4', name: 'Exterior Envelope & Storefront', wbsCode: 'WBS-1.04', order: 4 },
];

export const DEFAULT_TASKS: StickyNote[] = [
  // Lane 1: Sector A
  {
    id: 'ACT-1010',
    name: 'Underground Plumbing Rough-In',
    tradeId: 'TRADE-PLUMB',
    laneId: 'LANE-1',
    day: 1,
    duration: 3,
    crewSize: 4,
    shape: 'rectangle',
    status: 'complete',
    constraints: ['Material verified on site'],
    notes: 'In-slab PVC lines and sleeves verified against BIM.',
  },
  {
    id: 'ACT-1020',
    name: 'Electrical Slab Conduits & Grounding',
    tradeId: 'TRADE-ELEC',
    laneId: 'LANE-1',
    day: 4,
    duration: 2,
    crewSize: 3,
    shape: 'rectangle',
    status: 'complete',
  },
  {
    id: 'ACT-1030',
    name: 'Pre-Pour Rebar & MEP Sign-off Inspection',
    tradeId: 'TRADE-OWN',
    laneId: 'LANE-1',
    day: 6,
    duration: 1,
    crewSize: 2,
    shape: 'circle',
    status: 'complete',
    constraints: ['City inspector scheduled 8:00 AM'],
  },
  {
    id: 'ACT-1040',
    name: 'Slab on Grade Concrete Pour',
    tradeId: 'TRADE-CONC',
    laneId: 'LANE-1',
    day: 7,
    duration: 2,
    crewSize: 8,
    shape: 'diamond',
    status: 'in_progress',
    notes: 'Major milestone for Sector A handoff.',
  },
  {
    id: 'ACT-1050',
    name: 'Overhead Ductwork Main Trunk',
    tradeId: 'TRADE-MECH',
    laneId: 'LANE-1',
    day: 10,
    duration: 3,
    crewSize: 4,
    shape: 'rectangle',
    status: 'planned',
  },
  {
    id: 'ACT-1060',
    name: 'Metal Stud Wall Framing',
    tradeId: 'TRADE-DRY',
    laneId: 'LANE-1',
    day: 13,
    duration: 4,
    crewSize: 6,
    shape: 'rectangle',
    status: 'planned',
  },

  // Lane 2: Sector B
  {
    id: 'ACT-2010',
    name: 'Structural Steel Column Setting',
    tradeId: 'TRADE-STEEL',
    laneId: 'LANE-2',
    day: 2,
    duration: 4,
    crewSize: 6,
    shape: 'rectangle',
    status: 'complete',
  },
  {
    id: 'ACT-2020',
    name: 'Plumbing Branch Rough-in',
    tradeId: 'TRADE-PLUMB',
    laneId: 'LANE-2',
    day: 7,
    duration: 3,
    crewSize: 3,
    shape: 'rectangle',
    status: 'planned',
  },
  {
    id: 'ACT-2030',
    name: 'Electrical Home-run Conduits',
    tradeId: 'TRADE-ELEC',
    laneId: 'LANE-2',
    day: 11,
    duration: 3,
    crewSize: 4,
    shape: 'rectangle',
    status: 'planned',
  },

  // Lane 3: Core & Shafts
  {
    id: 'ACT-3010',
    name: 'Fire Protection Riser Installation',
    tradeId: 'TRADE-FP',
    laneId: 'LANE-3',
    day: 5,
    duration: 3,
    crewSize: 3,
    shape: 'rectangle',
    status: 'planned',
  },
  {
    id: 'ACT-3020',
    name: 'MEP Shaft Pressure Testing & Hydro',
    tradeId: 'TRADE-OWN',
    laneId: 'LANE-3',
    day: 9,
    duration: 1,
    crewSize: 2,
    shape: 'circle',
    status: 'planned',
    constraints: ['Pressure gauges calibrated'],
  },

  // Lane 4: Envelope
  {
    id: 'ACT-4010',
    name: 'Perimeter Curtain Wall Framing',
    tradeId: 'TRADE-GLAZ',
    laneId: 'LANE-4',
    day: 8,
    duration: 5,
    crewSize: 5,
    shape: 'rectangle',
    status: 'planned',
  },
  {
    id: 'ACT-4020',
    name: 'Envelope Dry-In Milestone',
    tradeId: 'TRADE-GC',
    laneId: 'LANE-4',
    day: 14,
    duration: 1,
    crewSize: 2,
    shape: 'diamond',
    status: 'planned',
  },
];

export const DEFAULT_DEPENDENCIES: Dependency[] = [
  { id: 'DEP-1', fromTaskId: 'ACT-1010', toTaskId: 'ACT-1020', type: 'FS', lag: 0 },
  { id: 'DEP-2', fromTaskId: 'ACT-1020', toTaskId: 'ACT-1030', type: 'FS', lag: 0 },
  { id: 'DEP-3', fromTaskId: 'ACT-1030', toTaskId: 'ACT-1040', type: 'FS', lag: 0 },
  { id: 'DEP-4', fromTaskId: 'ACT-1040', toTaskId: 'ACT-1050', type: 'FS', lag: 1 },
  { id: 'DEP-5', fromTaskId: 'ACT-1050', toTaskId: 'ACT-1060', type: 'SS', lag: 2 },
  { id: 'DEP-6', fromTaskId: 'ACT-2010', toTaskId: 'ACT-2020', type: 'FS', lag: 0 },
  { id: 'DEP-7', fromTaskId: 'ACT-2020', toTaskId: 'ACT-2030', type: 'FS', lag: 0 },
  { id: 'DEP-8', fromTaskId: 'ACT-3010', toTaskId: 'ACT-3020', type: 'FS', lag: 0 },
  { id: 'DEP-9', fromTaskId: 'ACT-4010', toTaskId: 'ACT-4020', type: 'FS', lag: 0 },
  // Cross-lane dependency: Sector B plumbing depends on Core FP Riser
  { id: 'DEP-10', fromTaskId: 'ACT-3010', toTaskId: 'ACT-2020', type: 'SS', lag: 1 },
];

export const INITIAL_PROJECT: PullPlanProject = {
  id: 'PROJ-CLARK-001',
  title: 'Clark Metro Hospital - Phase 2 Interior Build-out',
  projectNumber: 'CC-2026-B84',
  startDate: '2026-10-26',
  totalDays: 20,
  dayWidth: 145,
  lanes: DEFAULT_LANES,
  trades: DEFAULT_TRADES,
  tasks: DEFAULT_TASKS,
  dependencies: DEFAULT_DEPENDENCIES,
  updatedAt: new Date().toISOString(),
};
