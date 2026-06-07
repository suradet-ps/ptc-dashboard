// src/types/index.ts

export type RecommendationNo = 1 | 2 | 3;

export type ActionStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked';

export const ACTION_STATUSES: readonly ActionStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'delayed',
  'blocked',
] as const;

export type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  dot: string;
  border: string;
  hex: string;
};

export type StatusConfigMap = Record<ActionStatus, StatusConfig>;

export type StatusStyle = {
  bg: string;
  text: string;
  border: string;
};

// Single source of truth for inline-style status colors.
// Kept in sync with the seed data in `ptc_status_catalog`.
export const STATUS_STYLES: Record<ActionStatus, StatusStyle> = {
  not_started: {
    bg: 'rgba(168,174,128,0.14)',
    text: '#6a7040',
    border: 'rgba(168,174,128,0.32)',
  },
  in_progress: {
    bg: 'rgba(58,90,140,0.12)',
    text: '#3a5a8c',
    border: 'rgba(58,90,140,0.26)',
  },
  completed: {
    bg: 'rgba(46,112,40,0.12)',
    text: '#2e7028',
    border: 'rgba(46,112,40,0.26)',
  },
  delayed: {
    bg: 'rgba(140,96,16,0.12)',
    text: '#8c6010',
    border: 'rgba(140,96,16,0.26)',
  },
  blocked: {
    bg: 'rgba(150,48,32,0.12)',
    text: '#963020',
    border: 'rgba(150,48,32,0.26)',
  },
};

export const STATUS_DOT_COLORS: Record<ActionStatus, string> = {
  not_started: '#b0b0b0',
  in_progress: '#0d6efd',
  completed: '#28a745',
  delayed: '#d97706',
  blocked: '#dc3545',
};

export type ActionItem = {
  id: string;
  recNo: RecommendationNo;
  no: number;
  plan: string;
  subItems: string[];
  timeline: string; // display string e.g. "เม.ย. – มิ.ย. 68"
  startMonth: number; // 1-12 (fiscal year: Oct=1)
  endMonth: number; // 1-12
  kpis: string[];
  target: string;
  owners: string[];
  reportCycle: string;
  haRef: string; // HA II-6 reference
  // runtime fields (from Supabase ptc_action_progress)
  status: ActionStatus;
  progressPct: number; // 0-100
  actualValue: string; // actual KPI value recorded
  notes: string;
  blockers: string;
  lastUpdated: string; // ISO date
  updatedBy: string;
};

export type Recommendation = {
  no: RecommendationNo;
  title: string;
  shortTitle: string;
  color: string; // tailwind color key
  actions: ActionItem[];
};

export type RecommendationGroup = {
  no: RecommendationNo;
  title: string;
  shortTitle: string;
  color: string;
  hexColor: string;
  actions: ActionItem[];
  pct: number;
};

export type DashboardSummary = {
  totalActions: number;
  completed: number;
  inProgress: number;
  delayed: number;
  blocked: number;
  notStarted: number;
  overallPct: number;
};

export type UserRole = 'viewer' | 'editor' | 'admin';

export const USER_ROLES: readonly UserRole[] = ['viewer', 'editor', 'admin'] as const;

export type UserRecord = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
};
