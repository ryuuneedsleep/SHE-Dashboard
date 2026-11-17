/**
 * SPLD SAFETY - Dashboard Model
 * Database aggregation engine for Administrator K3 Analytics & KPIs
 */

import { sql } from '../config/database.js';
import { formatFindingRecord } from './findingModel.js';

export const dashboardModel = {
  /**
   * Aggregate complete dashboard metrics using parameterized SQL queries
   */
  async getDashboardData({
    department = '',
    operational_area = '',
    operationalArea = '',
    from_date = '',
    to_date = '',
    startDate = '',
    endDate = '',
  } = {}) {
    const activeDept = department && department !== 'ALL' ? department.trim() : '';
    const activeArea = (operational_area || operationalArea || '').trim();
    const activeFrom = from_date || startDate || '';
    const activeTo = to_date || endDate || '';

    const conditions = ['archived_at IS NULL'];
    const params = [];

    if (activeDept && activeDept !== 'ALL') {
      params.push(activeDept);
      conditions.push(`reporter_department = $${params.length}`);
    }

    if (activeArea && activeArea !== 'ALL') {
      params.push(activeArea);
      conditions.push(`operational_area = $${params.length}`);
    }

    if (activeFrom) {
      params.push(activeFrom);
      conditions.push(`finding_date >= $${params.length}`);
    }

    if (activeTo) {
      params.push(activeTo);
      conditions.push(`finding_date <= $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 1. KPI Cards Aggregation
    const kpiSql = `
      SELECT 
        COUNT(*)::int AS total_findings,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_findings,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress_findings,
        COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed_findings,
        COUNT(*) FILTER (WHERE risk_level IN ('HIGH', 'CRITICAL'))::int AS high_risk_findings
      FROM findings
      ${whereClause};
    `;
    const kpiRows = await sql.query(kpiSql, params);
    const kpiRow = kpiRows[0] || {};
    const totalCount = kpiRow.total_findings || 0;

    const kpis = {
      totalFindings: totalCount,
      openFindings: kpiRow.open_findings || 0,
      inProgressFindings: kpiRow.in_progress_findings || 0,
      closedFindings: kpiRow.closed_findings || 0,
      highRiskFindings: kpiRow.high_risk_findings || 0,
    };

    // 2. Risk Level Distribution (all 4 levels always represented)
    const riskSql = `
      SELECT 
        risk_level,
        COUNT(*)::int AS count
      FROM findings
      ${whereClause}
      GROUP BY risk_level;
    `;
    const riskRows = await sql.query(riskSql, params);
    const riskMap = {};
    riskRows.forEach((r) => {
      riskMap[r.risk_level] = r.count;
    });

    const riskConfig = [
      { key: 'LOW', label: 'Low', color: '#10B981' },
      { key: 'MEDIUM', label: 'Medium', color: '#F59E0B' },
      { key: 'HIGH', label: 'High', color: '#F97316' },
      { key: 'CRITICAL', label: 'Critical', color: '#EF4444' },
    ];

    const riskDistribution = riskConfig.map((rc) => {
      const count = riskMap[rc.key] || 0;
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        level: rc.label,
        rawLevel: rc.key,
        count,
        percentage,
        color: rc.color,
      };
    });

    // 3. Finding Category Distribution (all 3 categories always represented)
    const catSql = `
      SELECT 
        finding_category,
        COUNT(*)::int AS count
      FROM findings
      ${whereClause}
      GROUP BY finding_category;
    `;
    const catRows = await sql.query(catSql, params);
    const catMap = {};
    catRows.forEach((c) => {
      catMap[c.finding_category] = c.count;
    });

    const categoryConfig = [
      { key: 'UNSAFE_CONDITION', label: 'Unsafe Condition', color: '#EF4444' },
      { key: 'UNSAFE_ACTION', label: 'Unsafe Action', color: '#F59E0B' },
      { key: 'IMPROVEMENT_OPPORTUNITY', label: 'Improvement Opportunity', color: '#3B82F6' },
    ];

    const categoryDistribution = categoryConfig.map((cc) => {
      const count = catMap[cc.key] || 0;
      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      return {
        category: cc.label,
        rawCategory: cc.key,
        count,
        percentage,
        color: cc.color,
      };
    });

    // 4. Monthly Trend (12 Months series)
    // Build array of last 12 calendar months: [ { year, monthIndex, label } ]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const ymKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      months.push({
        key: ymKey,
        month: `${monthNames[m]} ${y}`,
      });
    }

    const trendSql = `
      SELECT 
        TO_CHAR(finding_date, 'YYYY-MM') AS month_key,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed_count
      FROM findings
      ${whereClause}
      GROUP BY TO_CHAR(finding_date, 'YYYY-MM');
    `;
    const trendRows = await sql.query(trendSql, params);
    const trendMap = {};
    trendRows.forEach((tr) => {
      trendMap[tr.month_key] = tr;
    });

    const monthlyTrend = months.map((m) => {
      const row = trendMap[m.key];
      return {
        month: m.month,
        count: row?.count || 0,
        openCount: row?.open_count || 0,
        closedCount: row?.closed_count || 0,
      };
    });

    // 5. Recent Findings (top 5 matching active filters)
    const recentSql = `
      SELECT *
      FROM findings
      ${whereClause}
      ORDER BY finding_date DESC, created_at DESC
      LIMIT 5;
    `;
    const recentRows = await sql.query(recentSql, params);
    const recentFindings = recentRows.map(formatFindingRecord);

    return {
      kpis,
      monthlyTrend,
      riskDistribution,
      categoryDistribution,
      recentFindings,
    };
  },
};

export default dashboardModel;
