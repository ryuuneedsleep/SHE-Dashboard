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
import type { FindingRecord, RiskLevel, FindingCategory } from '../../types/finding.ts';

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
    const levels: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical'];
    const colorMap: Record<RiskLevel, string> = {
      Low: '#10B981',      // Emerald
      Medium: '#F59E0B',   // Amber
      High: '#F97316',     // Orange
      Critical: '#EF4444', // Red
    };

    const counts: Record<RiskLevel, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    for (const f of findings) {
      if (counts[f.riskLevel] !== undefined) {
        counts[f.riskLevel]++;
      }
    }

    return levels.map((lvl) => ({
      level: lvl,
      count: counts[lvl],
      percentage: total > 0 ? Math.round((counts[lvl] / total) * 100) : 0,
      color: colorMap[lvl],
    }));
  }

  private calculateCategoryDistribution(findings: FindingRecord[]): CategoryDistributionData[] {
    const total = findings.length;
    const categories: FindingCategory[] = [
      'Unsafe Condition',
      'Unsafe Action',
      'Improvement Opportunity',
    ];
    const colorMap: Record<FindingCategory, string> = {
      'Unsafe Condition': '#EF4444',
      'Unsafe Action': '#3B82F6',
      'Improvement Opportunity': '#10B981',
    };

    const counts: Record<FindingCategory, number> = {
      'Unsafe Condition': 0,
      'Unsafe Action': 0,
      'Improvement Opportunity': 0,
    };

    for (const f of findings) {
      if (counts[f.findingCategory] !== undefined) {
        counts[f.findingCategory]++;
      }
    }

    return categories.map((cat) => ({
      category: cat,
      count: counts[cat],
      percentage: total > 0 ? Math.round((counts[cat] / total) * 100) : 0,
      color: colorMap[cat],
    }));
  }
}

export const mockDashboardService = new MockDashboardService();
