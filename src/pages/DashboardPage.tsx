import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDashboardService } from '../services/mock/mockDashboardService.ts';
import { mockFindingService } from '../services/mock/mockFindingService.ts';
import type { DashboardData, DashboardFilters } from '../types/dashboard.ts';
import { DashboardHeader } from '../components/dashboard/DashboardHeader.tsx';
import { DashboardFiltersBar } from '../components/dashboard/DashboardFilters.tsx';
import { KPICard } from '../components/dashboard/KPICard.tsx';
import { FindingsTrendChart } from '../components/dashboard/charts/FindingsTrendChart.tsx';
import { RiskDistributionChart } from '../components/dashboard/charts/RiskDistributionChart.tsx';
import { CategoryDistributionChart } from '../components/dashboard/charts/CategoryDistributionChart.tsx';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed.tsx';
import {
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  PlusCircle,
  Info,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [filters, setFilters] = useState<DashboardFilters>({
    department: 'ALL',
    operationalArea: 'ALL',
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    let active = true;

    mockDashboardService
      .getDashboardData(filters)
      .then((result) => {
        if (!active) return;
        setData(result);
        setIsLoading(false);
        setIsRefreshing(false);
        setLastUpdated(
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const result = await mockDashboardService.getDashboardData(filters);
      setData(result);
      setLastUpdated(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      department: 'ALL',
      operationalArea: 'ALL',
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleResetDemoData = async () => {
    mockFindingService.resetToDemoData();
    await handleManualRefresh();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Demo Mode Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
        <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Mode Prototipe (Phase 1 Frontend Only)</p>
          <p className="text-amber-800/90 mt-0.5">
            Semua metrik dan laporan dihitung secara real-time dari dataset demo K3 (12 laporan). Data tersimpan di memori browser dan belum terhubung ke database Neon PostgreSQL.
          </p>
        </div>
      </div>

      {/* Header */}
      <DashboardHeader
        lastUpdated={lastUpdated || 'Menghubungkan...'}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        onResetDemoData={handleResetDemoData}
      />

      {/* Filters Bar */}
      <DashboardFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="font-bold underline hover:text-rose-800"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-200 rounded-xl" />
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards (5 Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPICard
              title="Total Findings"
              value={data.kpis.totalFindings}
              subtitle="Semua temuan tercatat"
              icon={<ClipboardList className="w-5 h-5" />}
              iconBgColor="bg-slate-100 text-slate-700"
              accentColor="border-l-slate-700"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="Open Findings"
              value={data.kpis.openFindings}
              subtitle="Belum ditindaklanjuti"
              icon={<AlertCircle className="w-5 h-5" />}
              iconBgColor="bg-rose-50 text-rose-600"
              accentColor="border-l-rose-500"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="In Progress"
              value={data.kpis.inProgressFindings}
              subtitle="Dalam penanganan"
              icon={<Clock className="w-5 h-5" />}
              iconBgColor="bg-amber-50 text-amber-600"
              accentColor="border-l-amber-500"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="Closed"
              value={data.kpis.closedFindings}
              subtitle="Tindakan selesai"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgColor="bg-emerald-50 text-emerald-600"
              accentColor="border-l-emerald-500"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="High Risk"
              value={data.kpis.highRiskFindings}
              subtitle="High & Critical level"
              icon={<ShieldAlert className="w-5 h-5" />}
              iconBgColor="bg-red-50 text-red-600"
              accentColor="border-l-red-600"
              onClick={() => navigate('/findings')}
            />
          </div>

          {/* Quick Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/findings/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition hover:shadow cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Laporan Temuan K3</span>
            </button>
          </div>

          {/* Monthly Trend Chart */}
          <FindingsTrendChart data={data.monthlyTrend} />

          {/* Risk & Category Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RiskDistributionChart data={data.riskDistribution} />
            <CategoryDistributionChart data={data.categoryDistribution} />
          </div>

          {/* Recent Findings (Top 5) */}
          <RecentActivityFeed findings={data.recentFindings} />
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm">Data dashboard tidak tersedia.</p>
        </div>
      )}
    </div>
  );
};
