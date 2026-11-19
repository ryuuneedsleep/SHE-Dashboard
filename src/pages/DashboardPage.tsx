import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService.ts';
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
  FileQuestion,
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

    dashboardService
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
      const result = await dashboardService.getDashboardData(filters);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <DashboardHeader
        lastUpdated={lastUpdated || 'Menghubungkan...'}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
      />

      {/* Filters Bar */}
      <DashboardFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="font-bold underline hover:text-[#7F1F2E] cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-5 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-[#E5E7EB] rounded-[6px]" />
            ))}
          </div>
          <div className="h-64 bg-[#E5E7EB] rounded-[6px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-[#E5E7EB] rounded-[6px]" />
            <div className="h-64 bg-[#E5E7EB] rounded-[6px]" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard
              title="Total Findings"
              value={data.kpis.totalFindings}
              subtitle="Semua temuan tercatat"
              icon={<ClipboardList className="w-5 h-5" />}
              iconBgColor="bg-[#F7F8FA] text-[#333333]"
              accentColor="border-l-[#333333]"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="Open Findings"
              value={data.kpis.openFindings}
              subtitle="Belum ditindaklanjuti"
              icon={<AlertCircle className="w-5 h-5" />}
              iconBgColor="bg-[#FFFBEB] text-[#D97706]"
              accentColor="border-l-[#D97706]"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="In Progress"
              value={data.kpis.inProgressFindings}
              subtitle="Dalam penanganan"
              icon={<Clock className="w-5 h-5" />}
              iconBgColor="bg-[#EFF6FF] text-[#2563EB]"
              accentColor="border-l-[#2563EB]"
              onClick={() => navigate('/findings')}
            />
            <KPICard
              title="Closed"
              value={data.kpis.closedFindings}
              subtitle="Tindakan selesai"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgColor="bg-[#F0FDF4] text-[#16A34A]"
              accentColor="border-l-[#16A34A]"
              onClick={() => navigate('/findings')}
            />
            <div className="col-span-2 sm:col-span-1">
              <KPICard
                title="High Risk"
                value={data.kpis.highRiskFindings}
                subtitle="High & Critical level"
                icon={<ShieldAlert className="w-5 h-5" />}
                iconBgColor="bg-[#FEF2F2] text-[#DC2626]"
                accentColor="border-l-[#DC2626]"
                onClick={() => navigate('/findings')}
              />
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/findings/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E2638] hover:bg-[#7F1F2E] text-white rounded-[4px] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Laporan Temuan K3</span>
            </button>
          </div>

          {data.kpis.totalFindings === 0 ? (
            <div className="p-8 text-center bg-white rounded-[6px] border border-[#E5E7EB] space-y-3">
              <div className="w-12 h-12 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] flex items-center justify-center mx-auto text-[#666666]">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#000000]">Belum Ada Temuan K3 Tercatat</h3>
              <p className="text-xs text-[#666666] max-w-md mx-auto">
                Belum ada temuan K3 aktif untuk filter yang dipilih. Silakan buat temuan K3 baru untuk mulai mencatat insiden dan kondisi bahaya.
              </p>
            </div>
          ) : (
            <>
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
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-[6px] border border-[#E5E7EB]">
          <p className="text-[#666666] text-sm">Data dashboard tidak tersedia.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
