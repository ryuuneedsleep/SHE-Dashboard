/**
 * SPLD SAFETY - Safety Dashboard Page
 * Module 04: Centralized Safety Monitoring Interface for Service Parts Logistic Division (SPLD).
 * Features role-aware segregation:
 * - Regular Member View: Exclusively displays personal report statistics and status.
 * - Administrator / Leader View: Division-wide analytics, filterable across all personnel, and data export.
 */

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authService } from '../services/authService.ts';
import { dashboardService } from '../services/dashboardService.ts';
import type { DashboardFilters } from '../types/dashboard.ts';
import {
  exportFindingsToExcel,
  exportUsersToExcel,
} from '../utils/exportUtils.ts';
import { DashboardHeader } from '../components/dashboard/DashboardHeader.tsx';
import { DashboardFiltersBar } from '../components/dashboard/DashboardFilters.tsx';
import { KPICard } from '../components/dashboard/KPICard.tsx';
import { FindingsTrendChart } from '../components/dashboard/charts/FindingsTrendChart.tsx';
import { CategoryDistributionChart } from '../components/dashboard/charts/CategoryDistributionChart.tsx';
import { RiskDistributionChart } from '../components/dashboard/charts/RiskDistributionChart.tsx';
import { CorrectiveActionStatusCard } from '../components/dashboard/charts/CorrectiveActionStatusCard.tsx';
import { PatrolPerformanceCard } from '../components/dashboard/charts/PatrolPerformanceCard.tsx';
import { IncidentSummaryCard } from '../components/dashboard/charts/IncidentSummaryCard.tsx';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed.tsx';
import { MemberPersonalDashboard } from '../components/dashboard/MemberPersonalDashboard.tsx';
import { Button } from '../components/common/Button.tsx';
import {
  AlertTriangle,
  Clock,
  Footprints,
  AlertOctagon,
  ShieldAlert,
  Database,
  MapPin,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const unauthorizedMessage = (
    location.state as { unauthorized?: boolean; message?: string }
  )?.message;

  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    datePreset: '30d',
    departmentId: 'ALL',
    sectionId: 'ALL',
    operationalAreaId: 'ALL',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setRefreshTicker] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshTicker((t) => t + 1);
      setIsRefreshing(false);
    }, 400);
  };

  const handleResetFilters = () => {
    setFilters({
      datePreset: '30d',
      departmentId: 'ALL',
      sectionId: 'ALL',
      operationalAreaId: 'ALL',
    });
  };

  const handleToggleDemoMode = () => {
    dashboardService.setDemoMode(!dashboardService.isDemoMode());
    setRefreshTicker((t) => t + 1);
  };

  if (!currentUser) return null;

  // Query service data
  const summary = dashboardService.getDashboardSummary(currentUser, filters);
  const trendData = dashboardService.getFindingTrend(currentUser, filters);
  const categoryData = dashboardService.getFindingByCategory(currentUser, filters);
  const riskData = dashboardService.getRiskDistribution(currentUser, filters);
  const actionSummary = dashboardService.getCorrectiveActionSummary(currentUser, filters);
  const patrolSummary = dashboardService.getPatrolPerformance(currentUser, filters);
  const incidentSummary = dashboardService.getIncidentSummary(currentUser, filters);
  const recentActivities = dashboardService.getRecentActivities(currentUser, filters, 8);

  // Export handlers (Generates real, styled Excel workbooks with separated columns & styling)
  const handleExportFilteredFindings = () => {
    const findings = dashboardService.getScopedFindings(currentUser, filters);
    exportFindingsToExcel(
      findings,
      'SPLD_Safety_Reports_Filtered',
      'LAPORAN TEMUAN KESELAMATAN KERJA (FILTER AKTIF)'
    );
  };

  const handleExportAllFindings = () => {
    const allFindings = dashboardService.getAllDivisionFindings();
    exportFindingsToExcel(
      allFindings,
      'SPLD_Safety_Reports_All_Division',
      'SELURUH LAPORAN TEMUAN KESELAMATAN KERJA DIVISI (SPLD)'
    );
  };

  const handleExportAllUsers = () => {
    const allUsers = authService.getAllUsers();
    exportUsersToExcel(allUsers, 'SPLD_User_Directory_All');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Unauthorized Notification Banner if redirected from Admin Portal */}
        {unauthorizedMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Access Denied</div>
              <p className="mt-0.5">{unauthorizedMessage}</p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 1: REGULAR MEMBER / REPORTER PERSONAL DASHBOARD */}
        {/* =================================================================== */}
        {currentUser.role === 'MEMBER' ? (
          <div className="space-y-6">
            <DashboardHeader
              currentUser={currentUser}
              lastUpdated={summary.lastUpdated}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              isDemoMode={dashboardService.isDemoMode()}
              onToggleDemoMode={handleToggleDemoMode}
              onExportFilteredFindings={handleExportFilteredFindings}
            />

            <MemberPersonalDashboard
              currentUser={currentUser}
              filters={filters}
              lastUpdated={summary.lastUpdated}
            />
          </div>
        ) : (
          /* =================================================================== */
          /* VIEW 2: ADMINISTRATOR / LEADER / MANAGEMENT OVERVIEW DASHBOARD */
          /* =================================================================== */
          <div className="space-y-6">
            {/* Section A: Dashboard Header with Export Actions */}
            <DashboardHeader
              currentUser={currentUser}
              lastUpdated={summary.lastUpdated}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
              isDemoMode={dashboardService.isDemoMode()}
              onToggleDemoMode={handleToggleDemoMode}
              onExportFilteredFindings={handleExportFilteredFindings}
              onExportAllFindings={handleExportAllFindings}
              onExportUsers={currentUser.role === 'QSHE_ADMIN' ? handleExportAllUsers : undefined}
            />

            {/* Section B: Dashboard Filters */}
            <DashboardFiltersBar
              currentUser={currentUser}
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
            />

            {/* Section C: 6 Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              <KPICard
                metric={summary.totalFindings}
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBgColor="bg-amber-50 text-amber-600"
                accentColor="border-l-amber-500"
              />

              <KPICard
                metric={summary.openFindings}
                icon={<Clock className="w-5 h-5" />}
                iconBgColor="bg-blue-50 text-blue-600"
                accentColor="border-l-blue-500"
              />

              <KPICard
                metric={summary.overdueActions}
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBgColor="bg-red-50 text-red-600"
                accentColor="border-l-red-600"
              />

              <KPICard
                metric={summary.patrolAchievement}
                icon={<Footprints className="w-5 h-5" />}
                iconBgColor="bg-emerald-50 text-emerald-600"
                accentColor="border-l-emerald-600"
              />

              <KPICard
                metric={summary.totalIncidents}
                icon={<AlertOctagon className="w-5 h-5" />}
                iconBgColor="bg-purple-50 text-purple-600"
                accentColor="border-l-purple-600"
              />

              <KPICard
                metric={summary.highRiskFindings}
                icon={<ShieldAlert className="w-5 h-5" />}
                iconBgColor="bg-red-100 text-[#EB0A1E]"
                accentColor="border-l-[#EB0A1E]"
              />
            </div>

            {/* Section D: Charts and Analytics Grid */}
            <div className="space-y-6">
              {/* Row 1: Time-Series Findings Trend (2/3 width) & Risk Matrix Distribution (1/3 width) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <FindingsTrendChart data={trendData} />
                </div>
                <div className="lg:col-span-1">
                  <RiskDistributionChart data={riskData} />
                </div>
              </div>

              {/* Row 2: Finding Category (1/3), Corrective Action Status (1/3), Patrol Performance (1/3) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CategoryDistributionChart data={categoryData} />
                <CorrectiveActionStatusCard summary={actionSummary} />
                <PatrolPerformanceCard summary={patrolSummary} />
              </div>

              {/* Row 3: Incident & Near Miss Summary (1/3) & Operational Area Summary Card (2/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <IncidentSummaryCard summary={incidentSummary} />
                </div>

                {/* Quick Admin Navigation & Multiple Operational Area Access Card */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#EB0A1E]" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                          Operational Area Access & Governance
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Module 02 multiple area assignment policy
                        </p>
                      </div>
                    </div>

                    {currentUser.role === 'QSHE_ADMIN' && (
                      <div className="flex items-center gap-2">
                        <Link to="/admin/master-data">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Database className="w-3.5 h-3.5 text-red-600" />}
                          >
                            Master Data
                          </Button>
                        </Link>
                        <Link to="/admin">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                          >
                            Admin Portal
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Your account has access to{' '}
                        <strong className="text-gray-900">
                          {currentUser.role === 'QSHE_ADMIN' || currentUser.role === 'MANAGEMENT'
                            ? 'All 10 Division Areas'
                            : `${currentUser.areaAccess?.length || 0} Authorized Operational Areas`}
                        </strong>
                      </span>
                      <span className="text-[11px] text-gray-400">Governed by QSHE Admin</span>
                    </div>

                    {/* Display authorized area badges */}
                    <div className="flex flex-wrap gap-2">
                      {currentUser.areaAccess && currentUser.areaAccess.length > 0 ? (
                        currentUser.areaAccess.map((aid) => (
                          <span
                            key={aid}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EB0A1E]" />
                            <span>{aid}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          No operational areas assigned yet. Contact QSHE Admin.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Kaizen Notice */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span>
                      <strong>Toyota Kaizen Safety Standard:</strong> Report near misses and hazards promptly to eliminate operational risk.
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                      AoS PWA v1.0
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section E: Recent Safety Activities Feed */}
            <RecentActivityFeed activities={recentActivities} />
          </div>
        )}
      </div>
    </div>
  );
};
