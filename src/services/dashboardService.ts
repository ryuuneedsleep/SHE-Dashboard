/**
 * SPLD SAFETY - Safety Dashboard Service
 * Module 04: Centralized Analytics, KPI Calculation, Role-Based Scoping & Master Data Integration
 */

import type { AuthUser } from '../types/auth';
import type {
  SafetyFindingRecord,
  CorrectiveActionRecord,
  SafetyPatrolRecord,
  IncidentRecord,
  DashboardFilters,
  DashboardSummary,
  TrendDataPoint,
  CategoryDistribution,
  RiskDistribution,
  CorrectiveActionSummary,
  PatrolPerformanceSummary,
  IncidentSummary,
  SafetyActivityItem,
  UserPersonalSummary,
  FindingStatus,
} from '../types/dashboard';
import {
  SEED_FINDINGS,
  SEED_ACTIONS,
  SEED_PATROLS,
  SEED_INCIDENTS,
} from '../data/dashboardSeeds.ts';
import { masterDataService } from './masterDataService.ts';

export class DashboardService {
  private findings: SafetyFindingRecord[] = [...SEED_FINDINGS];
  private actions: CorrectiveActionRecord[] = [...SEED_ACTIONS];
  private patrols: SafetyPatrolRecord[] = [...SEED_PATROLS];
  private incidents: IncidentRecord[] = [...SEED_INCIDENTS];

  // Demo mode toggle: allows switching between populated prototype seed data and a clean empty state
  private demoModeEnabled: boolean = true;

  public setDemoMode(enabled: boolean): void {
    this.demoModeEnabled = enabled;
  }

  public isDemoMode(): boolean {
    return this.demoModeEnabled;
  }

  // -------------------------------------------------------------------------
  // Helper: Date Range Calculation
  // -------------------------------------------------------------------------
  private getDateBounds(filters: DashboardFilters): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const end = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999Z') : new Date();
    let start: Date;

    switch (filters.datePreset) {
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 3600 * 1000);
        break;
      case 'ytd':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case 'custom':
        start = filters.startDate
          ? new Date(filters.startDate + 'T00:00:00.000Z')
          : new Date(end.getTime() - 30 * 24 * 3600 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
        break;
    }

    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);

    return { start, end, prevStart, prevEnd };
  }

  // -------------------------------------------------------------------------
  // Role-Based Scope Enforcer
  // -------------------------------------------------------------------------
  /**
   * Filters records strictly according to Module 02 authorization policy:
   * - QSHE_ADMIN: full division-wide scope.
   * - APPROVER: strictly clipped to user.areaAccess.
   * - MEMBER: strictly clipped to personal submissions (user.noreg).
   * - MANAGEMENT: division-wide aggregated scope.
   */
  private scopeRecords<T extends { operationalAreaId?: string; reportedByNoreg?: string }>(
    user: AuthUser,
    records: T[]
  ): T[] {
    if (user.role === 'QSHE_ADMIN' || user.role === 'MANAGEMENT') {
      return records;
    }

    if (user.role === 'APPROVER') {
      const allowedAreas = user.areaAccess || [];
      return records.filter((r) => r.operationalAreaId && allowedAreas.includes(r.operationalAreaId));
    }

    if (user.role === 'MEMBER') {
      return records.filter((r) => r.reportedByNoreg === user.noreg);
    }

    return [];
  }

  // -------------------------------------------------------------------------
  // Filter Matching
  // -------------------------------------------------------------------------
  private matchesFilter(
    record: {
      departmentId?: string;
      sectionId?: string;
      operationalAreaId?: string;
    },
    filters: DashboardFilters,
    user: AuthUser
  ): boolean {
    // 1. Department Filter
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      if (record.departmentId !== filters.departmentId) return false;
    }

    // 2. Section Filter
    if (filters.sectionId && filters.sectionId !== 'ALL') {
      if (record.sectionId !== filters.sectionId) return false;
    }

    // 3. Operational Area Filter
    if (filters.operationalAreaId && filters.operationalAreaId !== 'ALL') {
      // If user is APPROVER, check they actually have authorization for this area
      if (user.role === 'APPROVER' && !(user.areaAccess || []).includes(filters.operationalAreaId)) {
        return false;
      }
      if (record.operationalAreaId !== filters.operationalAreaId) return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 1. Summary & Primary KPI Cards
  // -------------------------------------------------------------------------
  public getDashboardSummary(user: AuthUser, filters: DashboardFilters): DashboardSummary {
    if (!this.demoModeEnabled) {
      return {
        totalFindings: { title: 'Total Safety Findings', value: 0, description: 'No records in selected scope' },
        openFindings: { title: 'Open Findings', value: 0, description: 'All findings resolved' },
        overdueActions: { title: 'Overdue Corrective Actions', value: 0, description: 'Zero overdue actions' },
        patrolAchievement: { title: 'Safety Patrol Achievement', value: 'N/A', description: 'No patrol targets set' },
        totalIncidents: { title: 'Total Incidents & Near Misses', value: 0, description: 'Zero incidents recorded' },
        highRiskFindings: { title: 'High Risk Findings', value: 0, description: 'Zero high risk items' },
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const { start, end, prevStart, prevEnd } = this.getDateBounds(filters);

    // Filter Findings
    const scopedFindings = this.scopeRecords(user, this.findings);
    const currentFindings = scopedFindings.filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });
    const prevFindings = scopedFindings.filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= prevStart && d <= prevEnd && this.matchesFilter(f, filters, user);
    });

    // KPI 1: Total Findings
    const totalCount = currentFindings.length;
    const prevTotalCount = prevFindings.length;

    // KPI 2: Open Findings (status in Open, Under Review, In Progress)
    const openCount = currentFindings.filter(
      (f) => f.status === 'Open' || f.status === 'Under Review' || f.status === 'In Progress'
    ).length;
    const prevOpenCount = prevFindings.filter(
      (f) => f.status === 'Open' || f.status === 'Under Review' || f.status === 'In Progress'
    ).length;

    // KPI 3: Overdue Corrective Actions
    const scopedActions = this.scopeRecords(user, this.actions);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = scopedActions.filter((a) => {
      if (a.status === 'Completed') return false;
      const isPastDue = a.dueDate < todayStr;
      return (a.status === 'Overdue' || isPastDue) && this.matchesFilter(a, filters, user);
    }).length;

    // KPI 4: Safety Patrol Achievement (Completed / Planned * 100)
    const scopedPatrols = this.scopeRecords(user, this.patrols);
    const currentPatrols = scopedPatrols.filter((p) => {
      const d = new Date(p.plannedDate);
      return d >= start && d <= end && this.matchesFilter(p, filters, user);
    });
    const plannedPatrolsCount = currentPatrols.length;
    const completedPatrolsCount = currentPatrols.filter((p) => p.status === 'Completed').length;

    let patrolDisplayValue: string | number = 'N/A';
    if (plannedPatrolsCount > 0) {
      const rate = Math.round((completedPatrolsCount / plannedPatrolsCount) * 100);
      patrolDisplayValue = `${rate}%`;
    }

    // KPI 5: Total Incidents & Near Misses
    const scopedIncidents = this.scopeRecords(user, this.incidents);
    const currentIncidents = scopedIncidents.filter((inc) => {
      const d = new Date(inc.incidentDate);
      return d >= start && d <= end && this.matchesFilter(inc, filters, user);
    });
    const prevIncidents = scopedIncidents.filter((inc) => {
      const d = new Date(inc.incidentDate);
      return d >= prevStart && d <= prevEnd && this.matchesFilter(inc, filters, user);
    });

    // KPI 6: High Risk Findings (using Module 03 configured risk levels)
    // High Risk = riskLevelId is 'rl-hi' or 'rl-crt', or risk name contains High/Critical
    const highRiskCount = currentFindings.filter((f) => {
      const rId = f.riskLevelId.toLowerCase();
      const rName = f.riskLevelName.toLowerCase();
      return rId === 'rl-hi' || rId === 'rl-crt' || rName.includes('high') || rName.includes('critical');
    }).length;
    const prevHighRiskCount = prevFindings.filter((f) => {
      const rId = f.riskLevelId.toLowerCase();
      const rName = f.riskLevelName.toLowerCase();
      return rId === 'rl-hi' || rId === 'rl-crt' || rName.includes('high') || rName.includes('critical');
    }).length;

    return {
      totalFindings: {
        title: 'Total Safety Findings',
        value: totalCount,
        description: 'Safety observations recorded in period',
        comparison: {
          previousValue: prevTotalCount,
          percentageChange:
            prevTotalCount > 0 ? Math.round(((totalCount - prevTotalCount) / prevTotalCount) * 100) : undefined,
          isImprovement: totalCount <= prevTotalCount,
        },
      },
      openFindings: {
        title: 'Open Findings',
        value: openCount,
        description: 'Requiring containment or action plan',
        comparison: {
          previousValue: prevOpenCount,
          percentageChange:
            prevOpenCount > 0 ? Math.round(((openCount - prevOpenCount) / prevOpenCount) * 100) : undefined,
          isImprovement: openCount <= prevOpenCount,
        },
      },
      overdueActions: {
        title: 'Overdue Corrective Actions',
        value: overdueCount,
        description: overdueCount > 0 ? 'Tindakan perbaikan melebihi target waktu' : 'Semua tindakan tepat waktu',
        comparison: undefined,
      },
      patrolAchievement: {
        title: 'Safety Patrol Achievement',
        value: patrolDisplayValue,
        description:
          plannedPatrolsCount > 0
            ? `${completedPatrolsCount} of ${plannedPatrolsCount} planned patrols completed`
            : 'No planned patrol targets in selected range',
      },
      totalIncidents: {
        title: 'Total Incidents & Near Misses',
        value: currentIncidents.length,
        description: `${currentIncidents.filter((i) => i.isNearMiss).length} near misses, ${
          currentIncidents.filter((i) => !i.isNearMiss).length
        } incidents`,
        comparison: {
          previousValue: prevIncidents.length,
          percentageChange:
            prevIncidents.length > 0
              ? Math.round(((currentIncidents.length - prevIncidents.length) / prevIncidents.length) * 100)
              : undefined,
          isImprovement: currentIncidents.length <= prevIncidents.length,
        },
      },
      highRiskFindings: {
        title: 'High Risk Findings',
        value: highRiskCount,
        description: 'High and Critical risk priority items',
        comparison: {
          previousValue: prevHighRiskCount,
          percentageChange:
            prevHighRiskCount > 0
              ? Math.round(((highRiskCount - prevHighRiskCount) / prevHighRiskCount) * 100)
              : undefined,
          isImprovement: highRiskCount <= prevHighRiskCount,
        },
      },
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  // -------------------------------------------------------------------------
  // 2. Finding Trend (Time-Series)
  // -------------------------------------------------------------------------
  public getFindingTrend(user: AuthUser, filters: DashboardFilters): TrendDataPoint[] {
    if (!this.demoModeEnabled) return [];

    const { start, end } = this.getDateBounds(filters);
    const scopedFindings = this.scopeRecords(user, this.findings).filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });

    // Create 7 interval bins for charting
    const daySpan = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)));
    const binCount = Math.min(daySpan, 7);
    const binDuration = (end.getTime() - start.getTime()) / binCount;

    const points: TrendDataPoint[] = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = new Date(start.getTime() + i * binDuration);
      const binEnd = new Date(start.getTime() + (i + 1) * binDuration);

      const inBin = scopedFindings.filter((f) => {
        const d = new Date(f.reportedAt);
        return d >= binStart && d <= binEnd;
      });

      const openCount = inBin.filter(
        (f) => f.status === 'Open' || f.status === 'Under Review' || f.status === 'In Progress'
      ).length;
      const resolvedCount = inBin.filter((f) => f.status === 'Resolved' || f.status === 'Closed').length;

      const label = binStart.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });

      points.push({
        label,
        date: binStart.toISOString().split('T')[0],
        findingsCount: inBin.length,
        openCount,
        resolvedCount,
      });
    }

    return points;
  }

  // -------------------------------------------------------------------------
  // 3. Finding by Category (Module 03 finding_categories)
  // -------------------------------------------------------------------------
  public getFindingByCategory(user: AuthUser, filters: DashboardFilters): CategoryDistribution[] {
    if (!this.demoModeEnabled) return [];

    const { start, end } = this.getDateBounds(filters);
    const scopedFindings = this.scopeRecords(user, this.findings).filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });

    const activeCategories = masterDataService.getActiveFindingCategories();
    const total = scopedFindings.length;

    return activeCategories.map((cat) => {
      const count = scopedFindings.filter(
        (f) => f.categoryId.toLowerCase() === cat.id.toLowerCase() || f.categoryName === cat.name
      ).length;

      return {
        id: cat.id,
        name: cat.name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }

  // -------------------------------------------------------------------------
  // 4. Risk Level Distribution (Module 03 risk_levels)
  // -------------------------------------------------------------------------
  public getRiskDistribution(user: AuthUser, filters: DashboardFilters): RiskDistribution[] {
    if (!this.demoModeEnabled) return [];

    const { start, end } = this.getDateBounds(filters);
    const scopedFindings = this.scopeRecords(user, this.findings).filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });

    const activeRiskLevels = masterDataService.getActiveRiskLevels();
    const total = scopedFindings.length;

    return activeRiskLevels.map((rl) => {
      const count = scopedFindings.filter(
        (f) => f.riskLevelId.toLowerCase() === rl.id.toLowerCase() || f.riskLevelName === rl.name
      ).length;

      return {
        id: rl.id,
        code: rl.code,
        name: rl.name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        displayColor: rl.displayColor,
        sortOrder: rl.sortOrder,
      };
    });
  }

  // -------------------------------------------------------------------------
  // 5. Corrective Action Summary
  // -------------------------------------------------------------------------
  public getCorrectiveActionSummary(user: AuthUser, filters: DashboardFilters): CorrectiveActionSummary {
    if (!this.demoModeEnabled) {
      return { total: 0, open: 0, inProgress: 0, completed: 0, overdue: 0, complianceRate: 100 };
    }

    const scopedActions = this.scopeRecords(user, this.actions).filter((a) =>
      this.matchesFilter(a, filters, user)
    );

    const todayStr = new Date().toISOString().split('T')[0];
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    scopedActions.forEach((a) => {
      if (a.status === 'Completed') {
        completed++;
      } else if (a.status === 'Overdue' || a.dueDate < todayStr) {
        overdue++;
      } else if (a.status === 'In Progress') {
        inProgress++;
      } else {
        open++;
      }
    });

    const total = scopedActions.length;
    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    return { total, open, inProgress, completed, overdue, complianceRate };
  }

  // -------------------------------------------------------------------------
  // 6. Safety Patrol Performance
  // -------------------------------------------------------------------------
  public getPatrolPerformance(user: AuthUser, filters: DashboardFilters): PatrolPerformanceSummary {
    if (!this.demoModeEnabled) {
      return { planned: 0, completed: 0, pending: 0, achievementRate: null, achievementDisplay: 'N/A' };
    }

    const { start, end } = this.getDateBounds(filters);
    const scopedPatrols = this.scopeRecords(user, this.patrols).filter((p) => {
      const d = new Date(p.plannedDate);
      return d >= start && d <= end && this.matchesFilter(p, filters, user);
    });

    const planned = scopedPatrols.length;
    const completed = scopedPatrols.filter((p) => p.status === 'Completed').length;
    const pending = scopedPatrols.filter((p) => p.status === 'Planned').length;

    if (planned === 0) {
      return { planned: 0, completed: 0, pending: 0, achievementRate: null, achievementDisplay: 'N/A' };
    }

    const achievementRate = Math.round((completed / planned) * 100);
    return {
      planned,
      completed,
      pending,
      achievementRate,
      achievementDisplay: `${achievementRate}%`,
    };
  }

  // -------------------------------------------------------------------------
  // 7. Incident & Near Miss Summary
  // -------------------------------------------------------------------------
  public getIncidentSummary(user: AuthUser, filters: DashboardFilters): IncidentSummary {
    if (!this.demoModeEnabled) {
      return { total: 0, incidentsCount: 0, nearMissCount: 0, byType: [] };
    }

    const { start, end } = this.getDateBounds(filters);
    const scopedIncidents = this.scopeRecords(user, this.incidents).filter((i) => {
      const d = new Date(i.incidentDate);
      return d >= start && d <= end && this.matchesFilter(i, filters, user);
    });

    const nearMissCount = scopedIncidents.filter((i) => i.isNearMiss).length;
    const incidentsCount = scopedIncidents.filter((i) => !i.isNearMiss).length;
    const activeTypes = masterDataService.getActiveIncidentTypes();

    const byType = activeTypes.map((t) => {
      const matches = scopedIncidents.filter(
        (i) => i.incidentTypeId.toLowerCase() === t.id.toLowerCase() || i.incidentTypeName === t.name
      );
      const isNearMiss = t.id === 'inc-nm' || t.name.toLowerCase().includes('near miss');

      return {
        typeId: t.id,
        typeName: t.name,
        count: matches.length,
        isNearMiss,
      };
    });

    return {
      total: scopedIncidents.length,
      incidentsCount,
      nearMissCount,
      byType,
    };
  }

  // -------------------------------------------------------------------------
  // 8. Recent Safety Activities Feed
  // -------------------------------------------------------------------------
  public getRecentActivities(
    user: AuthUser,
    filters: DashboardFilters,
    limit: number = 8
  ): SafetyActivityItem[] {
    if (!this.demoModeEnabled) return [];

    const items: SafetyActivityItem[] = [];
    const activeRiskLevels = masterDataService.getActiveRiskLevels();

    // 1. Map Findings
    const scopedFindings = this.scopeRecords(user, this.findings).filter((f) =>
      this.matchesFilter(f, filters, user)
    );
    scopedFindings.forEach((f) => {
      const rl = activeRiskLevels.find(
        (r) => r.id.toLowerCase() === f.riskLevelId.toLowerCase() || r.name === f.riskLevelName
      );

      items.push({
        id: f.id,
        activityType: 'SAFETY_FINDING',
        referenceNo: f.referenceNo,
        title: f.title,
        timestamp: f.reportedAt,
        departmentName: f.departmentName,
        operationalAreaName: f.operationalAreaName,
        riskLevelName: f.riskLevelName,
        riskDisplayColor: rl?.displayColor || '#6B7280',
        status: f.status,
        actorName: f.reportedByName,
        rawRecord: f,
      });
    });

    // 2. Map Corrective Actions
    const scopedActions = this.scopeRecords(user, this.actions).filter((a) =>
      this.matchesFilter(a, filters, user)
    );
    scopedActions.forEach((a) => {
      items.push({
        id: a.id,
        activityType: 'CORRECTIVE_ACTION',
        referenceNo: a.referenceNo,
        title: a.title,
        timestamp: a.completedAt || a.dueDate + 'T12:00:00Z',
        departmentName: a.assignedDepartment,
        operationalAreaName: a.operationalAreaName,
        status: a.status,
        actorName: a.assignedToName,
        rawRecord: a,
      });
    });

    // 3. Map Patrols
    const scopedPatrols = this.scopeRecords(user, this.patrols).filter((p) =>
      this.matchesFilter(p, filters, user)
    );
    scopedPatrols.forEach((p) => {
      items.push({
        id: p.id,
        activityType: 'SAFETY_PATROL',
        referenceNo: p.referenceNo,
        title: p.patrolName,
        timestamp: p.conductedDate || p.plannedDate + 'T09:00:00Z',
        departmentName: p.departmentName,
        operationalAreaName: p.operationalAreaName,
        status: p.status,
        actorName: p.leaderName,
        rawRecord: p,
      });
    });

    // 4. Map Incidents
    const scopedIncidents = this.scopeRecords(user, this.incidents).filter((i) =>
      this.matchesFilter(i, filters, user)
    );
    scopedIncidents.forEach((i) => {
      const rl = activeRiskLevels.find(
        (r) => r.id.toLowerCase() === i.riskLevelId.toLowerCase() || r.name === i.riskLevelName
      );

      items.push({
        id: i.id,
        activityType: i.isNearMiss ? 'NEAR_MISS' : 'INCIDENT',
        referenceNo: i.referenceNo,
        title: i.title,
        timestamp: i.incidentDate,
        departmentName: i.departmentName,
        operationalAreaName: i.operationalAreaName,
        riskLevelName: i.riskLevelName,
        riskDisplayColor: rl?.displayColor || '#EB0A1E',
        status: i.status,
        actorName: i.reportedByName,
        rawRecord: i,
      });
    });

    // Sort by timestamp descending and slice
    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 9. Personal Reporting Summary (Exclusively for Regular Member Dashboard)
  // -------------------------------------------------------------------------
  public getUserPersonalSummary(user: AuthUser, filters: DashboardFilters): UserPersonalSummary {
    if (!this.demoModeEnabled) {
      return {
        totalSubmitted: 0,
        openCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        resolutionRate: 100,
        highRiskCount: 0,
        statusBreakdown: [],
        categoryBreakdown: [],
        myFindings: [],
      };
    }

    const { start, end } = this.getDateBounds(filters);

    // Strictly filter findings submitted by this user (user.noreg)
    const myFindings = this.findings.filter((f) => {
      if (f.reportedByNoreg !== user.noreg) return false;
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });

    const totalSubmitted = myFindings.length;
    const openCount = myFindings.filter((f) => f.status === 'Open' || f.status === 'Under Review').length;
    const inProgressCount = myFindings.filter((f) => f.status === 'In Progress').length;
    const resolvedCount = myFindings.filter((f) => f.status === 'Resolved' || f.status === 'Closed').length;

    const resolutionRate = totalSubmitted > 0 ? Math.round((resolvedCount / totalSubmitted) * 100) : 100;

    const highRiskCount = myFindings.filter((f) => {
      const rId = f.riskLevelId.toLowerCase();
      const rName = f.riskLevelName.toLowerCase();
      return rId === 'rl-hi' || rId === 'rl-crt' || rName.includes('high') || rName.includes('critical');
    }).length;

    // Status breakdown for user pie/bar
    const statusMap: {
      status: FindingStatus;
      label: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      color: string;
    }[] = [
      {
        status: 'Open',
        label: 'Menunggu Review / Open',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-700',
        badgeBorder: 'border-red-200',
        color: '#EF4444',
      },
      {
        status: 'Under Review',
        label: 'Dalam Evaluasi / Triage',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
        color: '#F59E0B',
      },
      {
        status: 'In Progress',
        label: 'Sedang Ditindaklanjuti',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
        color: '#3B82F6',
      },
      {
        status: 'Resolved',
        label: 'Perbaikan Selesai',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
        color: '#10B981',
      },
      {
        status: 'Closed',
        label: 'Terverifikasi & Ditutup',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        badgeBorder: 'border-gray-300',
        color: '#6B7280',
      },
    ];

    const statusBreakdown = statusMap.map((sm) => {
      const count = myFindings.filter((f) => f.status === sm.status).length;
      return {
        status: sm.status,
        label: sm.label,
        count,
        percentage: totalSubmitted > 0 ? Math.round((count / totalSubmitted) * 100) : 0,
        badgeBg: sm.badgeBg,
        badgeText: sm.badgeText,
        badgeBorder: sm.badgeBorder,
        color: sm.color,
      };
    });

    // Category breakdown for user findings
    const activeCategories = masterDataService.getActiveFindingCategories();
    const categoryBreakdown = activeCategories.map((cat) => {
      const count = myFindings.filter(
        (f) => f.categoryId.toLowerCase() === cat.id.toLowerCase() || f.categoryName === cat.name
      ).length;
      return {
        id: cat.id,
        name: cat.name,
        count,
        percentage: totalSubmitted > 0 ? Math.round((count / totalSubmitted) * 100) : 0,
      };
    });

    return {
      totalSubmitted,
      openCount,
      inProgressCount,
      resolvedCount,
      resolutionRate,
      highRiskCount,
      statusBreakdown,
      categoryBreakdown,
      myFindings: [...myFindings].sort(
        (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      ),
    };
  }

  // -------------------------------------------------------------------------
  // 10. Direct Scoped Findings (For Data Export & Scoped Listing)
  // -------------------------------------------------------------------------
  public getScopedFindings(user: AuthUser, filters: DashboardFilters): SafetyFindingRecord[] {
    if (!this.demoModeEnabled) return [];
    const { start, end } = this.getDateBounds(filters);

    return this.scopeRecords(user, this.findings).filter((f) => {
      const d = new Date(f.reportedAt);
      return d >= start && d <= end && this.matchesFilter(f, filters, user);
    });
  }

  public getAllDivisionFindings(): SafetyFindingRecord[] {
    return [...this.findings];
  }

  // -------------------------------------------------------------------------
  // 11. Module 05 Operational Synchronization Hooks
  // -------------------------------------------------------------------------
  public syncFromSafetyFinding(record: {
    id: string;
    referenceNo: string;
    title: string;
    description: string;
    categoryId: string;
    categoryName: string;
    riskLevelId: string;
    riskLevelName: string;
    departmentId: string;
    departmentName: string;
    sectionId?: string;
    sectionName?: string;
    operationalAreaId: string;
    operationalAreaName: string;
    reportedByNoreg: string;
    reportedByName: string;
    reportedAt: string;
    status: string;
  }): void {
    let mappedStatus: FindingStatus = 'Open';
    if (record.status === 'In Progress') mappedStatus = 'In Progress';
    else if (record.status === 'Resolved') mappedStatus = 'Resolved';
    else if (record.status === 'Closed' || record.status === 'Rejected') mappedStatus = 'Closed';
    else if (record.status === 'Under Review' || record.status === 'Accepted') mappedStatus = 'Under Review';

    const dashRecord: SafetyFindingRecord = {
      id: record.id,
      referenceNo: record.referenceNo,
      title: record.title,
      description: record.description,
      categoryId: record.categoryId,
      categoryName: record.categoryName,
      riskLevelId: record.riskLevelId,
      riskLevelName: record.riskLevelName,
      departmentId: record.departmentId,
      departmentName: record.departmentName,
      sectionId: record.sectionId || 'sec-gen',
      sectionName: record.sectionName || 'General Operations',
      operationalAreaId: record.operationalAreaId,
      operationalAreaName: record.operationalAreaName,
      reportedByNoreg: record.reportedByNoreg,
      reportedByName: record.reportedByName,
      reportedAt: record.reportedAt,
      status: mappedStatus,
    };

    const existingIdx = this.findings.findIndex((f) => f.id === dashRecord.id);
    if (existingIdx >= 0) {
      this.findings[existingIdx] = dashRecord;
    } else {
      this.findings.unshift(dashRecord);
    }
  }

  public syncFromSafetyPatrol(patrol: {
    id: string;
    referenceNo: string;
    patrolName: string;
    plannedDate: string;
    conductedDate?: string | null;
    departmentId: string;
    departmentName: string;
    operationalAreaId: string;
    operationalAreaName: string;
    leaderNoreg: string;
    leaderName: string;
    status: string;
    findingsCount: number;
  }): void {
    const existing = this.patrols.find((p) => p.id === patrol.id);
    const mappedPatrolStatus =
      patrol.status === 'Completed' ? 'Completed' : patrol.status === 'Cancelled' ? 'Cancelled' : 'Planned';
    if (existing) {
      existing.status = mappedPatrolStatus;
      existing.findingsCount = patrol.findingsCount;
      existing.conductedDate = patrol.conductedDate || undefined;
    } else {
      this.patrols.unshift({
        id: patrol.id,
        referenceNo: patrol.referenceNo,
        patrolName: patrol.patrolName,
        plannedDate: patrol.plannedDate,
        conductedDate: patrol.conductedDate || undefined,
        departmentId: patrol.departmentId,
        departmentName: patrol.departmentName,
        operationalAreaId: patrol.operationalAreaId,
        operationalAreaName: patrol.operationalAreaName,
        leaderNoreg: patrol.leaderNoreg,
        leaderName: patrol.leaderName,
        status: mappedPatrolStatus,
        findingsCount: patrol.findingsCount,
      });
    }
  }
}

export const dashboardService = new DashboardService();

