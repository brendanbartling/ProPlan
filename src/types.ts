export type StickyShape = 'rectangle' | 'diamond' | 'circle';

export type DependencyType = 'FS' | 'FF' | 'SS' | 'SS&FF';

export interface Dependency {
  id: string;
  fromTaskId: string; // Predecessor
  toTaskId: string;   // Successor
  type: DependencyType;
  lag: number;        // days (e.g. 0, 1, 2...)
}

export type TaskStatus = 'planned' | 'ready' | 'in_progress' | 'complete' | 'delayed';

export interface StickyNote {
  id: string;              // Activity ID (e.g. 'ACT-1020')
  name: string;            // Description / Name
  tradeId: string;         // Responsible sub/trade ID
  laneId: string;          // Swimlane / Location ID
  day: number;             // Day position on board (1-indexed work day)
  duration: number;        // Duration in days (min 1)
  crewSize: number;        // Crew count (e.g. 4)
  shape: StickyShape;      // rectangle = task, diamond = milestone, circle = constraint/inspection
  status: TaskStatus;
  constraints?: string[];  // Known constraints (RFI, Material, Inspection, etc.)
  notes?: string;
  manhours?: number;       // calculated crewSize * duration * 8
}

export interface Trade {
  id: string;
  name: string;
  code: string;            // e.g. "M", "E", "P", "CONC", "STEEL", "DRY", "GC"
  color: string;           // Hex color
  textColor: string;       // White or dark text
  company?: string;        // Subcontractor name (e.g. "Dynalectric", "Clark Concrete")
  phone?: string;
  isCustom?: boolean;
}

export interface SwimLane {
  id: string;
  name: string;            // Location / Sector / Area name (e.g. "Level 1 - Pod A")
  wbsCode: string;         // e.g. "WBS-1.01"
  order: number;
}

export interface PullPlanProject {
  id: string;
  title: string;
  projectNumber: string;
  startDate: string;       // YYYY-MM-DD
  totalDays: number;       // default 20-30 days
  dayWidth: number;        // px width per day (default 140)
  lanes: SwimLane[];
  trades: Trade[];
  tasks: StickyNote[];
  dependencies: Dependency[];
  logoUrl?: string;        // Optional custom logo, or built-in Clark/Company space
  updatedAt: string;
}

export interface DraggingConnection {
  fromTaskId: string;
  fromSide: 'left' | 'right';
  currentX: number;
  currentY: number;
}
