/**
 * SPLD SAFETY - Final Project Refactoring
 * Mock Dashboard Service
 *
 * Computes KPIs, charts, and recent reports directly from mockFindingService.
 * Single source of truth — no hardcoded metrics!
 */

import { mockFindingService } from './mockFindingService.ts';
import type {
  DashboardData,
  DashboardFilters,
  DashboardKPIs,
  MonthlyTrendData,
  RiskDistributionData,
  CategoryDistributionData,
} from '../../types/dashboard.ts';
import type { FindingRecord } from '../../types/finding.ts';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export class MockDashboardService {
  public async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    const findings = await mockFindingService.getFindings({
      department: filters?.department,
      operationalArea: filters?.operationalArea,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });

    const kpis = this.calculateKPIs(findings);
    const monthlyTrend = this.calculateMonthlyTrend(findings);
    const riskDistribution = this.calculateRiskDistribution(findings);
    const categoryDistribution = this.calculateCategoryDistribution(findings);
    const recentFindings = findings.slice(0, 5);

    return {
      kpis,
      monthlyTrend,
      riskDistribution,
      categoryDistribution,
      recentFindings,
    };
  }

  private calculateKPIs(findings: FindingRecord[]): DashboardKPIs {
    let openCount = 0;
    let inProgressCount = 0;
    let closedCount = 0;
    let highRiskCount = 0;

    for (const f of findings) {
      if (f.status === 'OPEN') openCount++;
      else if (f.status === 'IN_PROGRESS') inProgressCount++;
      else if (f.status === 'CLOSED') closedCount++;

      if (f.riskLevel === 'High' || f.riskLevel === 'Critical') {
        highRiskCount++;
      }
    }

    return {
      totalFindings: findings.length,
      openFindings: openCount,
      inProgressFindings: inProgressCount,
      closedFindings: closedCount,
      highRiskFindings: highRiskCount,
    };
  }

  private calculateMonthlyTrend(findings: FindingRecord[]): MonthlyTrendData[] {
    // Collect by Year-Month key
    const monthMap = new Map<string, { monthLabel: string; count: number; openCount: number; closedCount: number; sortKey: string }>();

    for (const f of findings) {
      const date = new Date(f.findingDate);
      if (isNaN(date.getTime())) continue;

      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const sortKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

      if (!monthMap.has(sortKey)) {
        monthMap.set(sortKey, {
          monthLabel,
          count: 0,
          openCount: 0,
          closedCount: 0,
          sortKey,
        });
      }

      const item = monthMap.get(sortKey)!;
      item.count++;
      if (f.status === 'CLOSED') {
        item.closedCount++;
      } else {
        item.openCount++;
      }
    }

    // Sort chronologically
    return Array.from(monthMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ monthLabel, count, openCount, closedCount }) => ({
        month: monthLabel,
        count,
        openCount,
        closedCount,
      }));
  }

  private calculateRiskDistribution(findings: FindingRecord[]): RiskDistributionData[] {
    const total = findings.length;
    const levels: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];
    const colorMap: Record<string, string> = {
      Low: '#10B981',      // Emerald
      LOW: '#10B981',
      Medium: '#F59E0B',   // Amber
      MEDIUM: '#F59E0B',
      High: '#F97316',     // Orange
      HIGH: '#F97316',
      Critical: '#EF4444', // Red
      CRITICAL: '#EF4444',
    };

    const counts: Record<string, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    for (const f of findings) {
      const norm =
        f.riskLevel === 'LOW'
          ? 'Low'
          : f.riskLevel === 'MEDIUM'
          ? 'Medium'
          : f.riskLevel === 'HIGH'
          ? 'High'
          : f.riskLevel === 'CRITICAL'
          ? 'Critical'
          : f.riskLevel;
      if (counts[norm] !== undefined) {
        counts[norm]++;
      }
    }

    return levels.map((lvl) => ({
      level: lvl,
      count: counts[lvl] || 0,
      percentage: total > 0 ? Math.round(((counts[lvl] || 0) / total) * 100) : 0,
      color: colorMap[lvl] || '#6B7280',
    }));
  }

  private calculateCategoryDistribution(findings: FindingRecord[]): CategoryDistributionData[] {
    const total = findings.length;
    const categories: ('Unsafe Condition' | 'Unsafe Action' | 'Improvement Opportunity')[] = [
      'Unsafe Condition',
      'Unsafe Action',
      'Improvement Opportunity',
    ];
    const colorMap: Record<string, string> = {
      'Unsafe Condition': '#EF4444',
      UNSAFE_CONDITION: '#EF4444',
      'Unsafe Action': '#3B82F6',
      UNSAFE_ACTION: '#3B82F6',
      'Improvement Opportunity': '#10B981',
      IMPROVEMENT_OPPORTUNITY: '#10B981',
    };

    const counts: Record<string, number> = {
      'Unsafe Condition': 0,
      'Unsafe Action': 0,
      'Improvement Opportunity': 0,
    };

    for (const f of findings) {
      const norm =
        f.findingCategory === 'UNSAFE_CONDITION'
          ? 'Unsafe Condition'
          : f.findingCategory === 'UNSAFE_ACTION'
          ? 'Unsafe Action'
          : f.findingCategory === 'IMPROVEMENT_OPPORTUNITY'
          ? 'Improvement Opportunity'
          : f.findingCategory;
      if (counts[norm] !== undefined) {
        counts[norm]++;
      }
    }

    return categories.map((cat) => ({
      category: cat,
      count: counts[cat] || 0,
      percentage: total > 0 ? Math.round(((counts[cat] || 0) / total) * 100) : 0,
      color: colorMap[cat] || '#6B7280',
    }));
  }
}

export const mockDashboardService = new MockDashboardService();
