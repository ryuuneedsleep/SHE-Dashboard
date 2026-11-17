/**
 * SPLD SAFETY - Final Project Refactoring
 * Universal Administrator Dashboard Types
 */

import type { FindingRecord, FindingCategory, RiskLevel, DepartmentOption } from './finding.ts';

export interface DashboardKPIs {
  totalFindings: number;
  openFindings: number;
  inProgressFindings: number;
  closedFindings: number;
  highRiskFindings: number; // HIGH + CRITICAL
}

export interface MonthlyTrendData {
  month: string; // e.g. "Mei 2026"
  count: number;
  openCount: number;
  closedCount: number;
}

export interface RiskDistributionData {
  level: RiskLevel;
  count: number;
  percentage: number;
  color: string;
}

export interface CategoryDistributionData {
  category: FindingCategory;
  count: number;
  percentage: number;
  color: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  monthlyTrend: MonthlyTrendData[];
  riskDistribution: RiskDistributionData[];
  categoryDistribution: CategoryDistributionData[];
  recentFindings: FindingRecord[];
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  department?: DepartmentOption | 'ALL';
  operationalArea?: string | 'ALL';
}
