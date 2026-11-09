/**
 * SPLD SAFETY - Safety Dashboard Type Definitions
 * Module 04: Centralized Performance Monitoring, KPI Analytics, and Role-Based Scope
 */

import type { AppRole } from './auth';

export type FindingStatus = 'Open' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
export type ActionStatus = 'Open' | 'In Progress' | 'Completed' | 'Overdue';
export type PatrolStatus = 'Planned' | 'Completed' | 'Cancelled';
export type IncidentStatus = 'Reported' | 'Under Investigation' | 'Action Required' | 'Closed';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * Safety Finding Transaction Record
 */
export interface SafetyFindingRecord {
  id: string;
  referenceNo: string; // e.g., FND-2026-0001
  title: string;
  description: string;
  categoryId: string; // references Module 03 FindingCategoryRecord
  categoryName: string;
  riskLevelId: string; // references Module 03 RiskLevelRecord
  riskLevelName: string;
  departmentId: string; // references Module 03 DepartmentRecord
  departmentName: string;
  sectionId: string; // references Module 03 SectionRecord
  sectionName: string;
  operationalAreaId: string; // references Module 03 OperationalAreaRecord
  operationalAreaName: string;
  reportedByNoreg: string;
  reportedByName: string;
  reportedAt: string; // ISO 8601
  status: FindingStatus;
  photoUrl?: string;
  correctiveActionId?: string;
}

/**
 * Corrective Action Plan Record
 */
export interface CorrectiveActionRecord {
  id: string;
  referenceNo: string; // e.g., ACT-2026-0001
  findingId: string;
  findingRefNo: string;
  title: string;
  description: string;
  assignedToNoreg: string;
  assignedToName: string;
  assignedDepartment: string;
  operationalAreaId: string;
  operationalAreaName: string;
  priority: PriorityLevel;
  dueDate: string; // ISO string (YYYY-MM-DD)
  completedAt?: string | null;
  status: ActionStatus;
  actionCategoryName?: string;
}

/**
 * Safety Patrol Activity Record
 */
export interface SafetyPatrolRecord {
  id: string;
  referenceNo: string; // e.g., PTR-2026-0001
  patrolName: string;
  plannedDate: string; // ISO date
  conductedDate?: string | null;
  departmentId: string;
  departmentName: string;
  operationalAreaId: string;
  operationalAreaName: string;
  leaderNoreg: string;
  leaderName: string;
  status: PatrolStatus;
  findingsCount: number;
}

/**
 * Incident & Near Miss Record
 */
export interface IncidentRecord {
  id: string;
  referenceNo: string; // e.g., INC-2026-0001
  title: string;
  incidentTypeId: string; // references Module 03 IncidentTypeRecord
  incidentTypeName: string;
  riskLevelId: string;
  riskLevelName: string;
  departmentId: string;
  departmentName: string;
  operationalAreaId: string;
  operationalAreaName: string;
  reportedByNoreg: string;
  reportedByName: string;
  incidentDate: string; // ISO date
  status: IncidentStatus;
  isNearMiss: boolean; // true = Near Miss, false = Safety Incident
}

/**
 * Filter Parameters for Dashboard
 */
export type DateRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DashboardFilters {
  datePreset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  departmentId?: string; // ALL or specific
  sectionId?: string; // ALL or specific
  operationalAreaId?: string; // ALL or specific
}

/**
 * Primary KPI Metric Representation
 */
export interface KPIMetric {
  title: string;
  value: number | string; // number or "N/A"
  description: string;
  comparison?: {
    previousValue: number | string;
    percentageChange?: number;
    isImprovement?: boolean; // depends on metric context (e.g., lower findings = good)
  };
}

export interface DashboardSummary {
  totalFindings: KPIMetric;
  openFindings: KPIMetric;
  overdueActions: KPIMetric;
  patrolAchievement: KPIMetric;
  totalIncidents: KPIMetric;
  highRiskFindings: KPIMetric;
  lastUpdated: string;
}

/**
 * Time-Series Trend Data Point
 */
export interface TrendDataPoint {
  label: string; // e.g. "Mon", "01 Nov", "W44"
  date: string;
  findingsCount: number;
  openCount: number;
  resolvedCount: number;
}

/**
 * Category Distribution Data Point
 */
export interface CategoryDistribution {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

/**
 * Risk Distribution Data Point (adhering to Module 03 Risk Level configurations)
 */
export interface RiskDistribution {
  id: string;
  code: string;
  name: string;
  count: number;
  percentage: number;
  displayColor: string;
  sortOrder: number;
}

/**
 * Corrective Action Status Breakdown
 */
export interface CorrectiveActionSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  complianceRate: number; // completed / total * 100
}

/**
 * Safety Patrol Performance Breakdown
 */
export interface PatrolPerformanceSummary {
  planned: number;
  completed: number;
  pending: number;
  achievementRate: number | null; // null represents N/A (no planned patrols)
  achievementDisplay: string; // e.g. "85%" or "N/A"
}

/**
 * Incident & Near Miss Summary Breakdown
 */
export interface IncidentSummary {
  total: number;
  incidentsCount: number;
  nearMissCount: number;
  byType: {
    typeId: string;
    typeName: string;
    count: number;
    isNearMiss: boolean;
  }[];
}

/**
 * Recent Activity Feed Item
 */
export type ActivityType =
  | 'SAFETY_FINDING'
  | 'CORRECTIVE_ACTION'
  | 'SAFETY_PATROL'
  | 'INCIDENT'
  | 'NEAR_MISS';

export interface SafetyActivityItem {
  id: string;
  activityType: ActivityType;
  referenceNo: string;
  title: string;
  timestamp: string;
  departmentName: string;
  operationalAreaName: string;
  riskLevelName?: string;
  riskDisplayColor?: string;
  status: string;
  actorName: string;
  rawRecord?:
    | SafetyFindingRecord
    | CorrectiveActionRecord
    | SafetyPatrolRecord
    | IncidentRecord;
}

/**
 * User View Context for Dashboard Scope
 */
export interface DashboardUserContext {
  userId: string;
  noreg: string;
  fullName: string;
  role: AppRole;
  areaAccess: string[];
}

/**
 * Personal Reporting Summary for Member / Reporter View
 * Scoped strictly to the authenticated user's submitted reports.
 */
export interface UserPersonalSummary {
  totalSubmitted: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  resolutionRate: number;
  highRiskCount: number;
  statusBreakdown: {
    status: FindingStatus;
    label: string;
    count: number;
    percentage: number;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    color: string;
  }[];
  categoryBreakdown: CategoryDistribution[];
  myFindings: SafetyFindingRecord[];
}

