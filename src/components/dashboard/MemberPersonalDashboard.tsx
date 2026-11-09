/**
 * SPLD SAFETY - Member Personal Dashboard Component
 * Exclusively displays reports, status breakdown, and analytics for the authenticated user's own submissions.
 * Features personal report export to CSV.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../../types/auth';
import type { DashboardFilters, SafetyActivityItem } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService.ts';
import { exportFindingsToExcel, exportFindingsToCSV } from '../../utils/exportUtils.ts';
import { RecentActivityFeed } from './RecentActivityFeed.tsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Tag,
  Search,
  Filter,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../common/Button.tsx';

interface MemberPersonalDashboardProps {
  currentUser: AuthUser;
  filters: DashboardFilters;
  lastUpdated: string;
}

export const MemberPersonalDashboard: React.FC<MemberPersonalDashboardProps> = ({
  currentUser,
  filters,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const personalData = dashboardService.getUserPersonalSummary(currentUser, filters);

  const handleExportExcel = () => {
    exportFindingsToExcel(
      personalData.myFindings,
      `Laporan_Safety_${currentUser.fullName.replace(/\s+/g, '_')}_${currentUser.noreg}`,
      `LAPORAN TEMUAN KESELAMATAN KERJA &bull; ${currentUser.fullName.toUpperCase()} (${currentUser.noreg})`
    );
  };

  const handleExportCSV = () => {
    exportFindingsToCSV(
      personalData.myFindings,
      `Laporan_Safety_${currentUser.fullName.replace(/\s+/g, '_')}_${currentUser.noreg}`
    );
  };

  // Convert user's personal findings to SafetyActivityItem for the activity feed
  const personalActivities: SafetyActivityItem[] = personalData.myFindings.map((f) => ({
    id: f.id,
    activityType: 'SAFETY_FINDING',
    referenceNo: f.referenceNo,
    title: f.title,
    timestamp: f.reportedAt,
    departmentName: f.departmentName,
    operationalAreaName: f.operationalAreaName,
    riskLevelName: f.riskLevelName,
    riskDisplayColor: f.riskLevelId === 'rl-hi' ? '#EF4444' : f.riskLevelId === 'rl-crt' ? '#B91C1C' : '#3B82F6',
    status: f.status,
    actorName: f.reportedByName,
    rawRecord: f,
  }));

  // Filtered personal activities
  const filteredActivities = personalActivities.filter((act) => {
    const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.operationalAreaName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Member Header & Personal Scope Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Dashboard Pelaporan Safety Saya
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              Member View
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Menampilkan statistik dan status khusus untuk temuan keselamatan yang Anda laporkan.
          </p>
        </div>

        {/* Export and Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/my-findings">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5 text-white" />}
            >
              Laporkan Temuan
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={personalData.totalSubmitted === 0}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-gray-700" />}
          >
            Export (Excel)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={personalData.totalSubmitted === 0}
            leftIcon={<Download className="w-3.5 h-3.5 text-gray-600" />}
          >
            CSV
          </Button>
        </div>
      </div>

      {/* 4 Personal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submitted */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 border-l-4 border-l-gray-900 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Laporan Saya
            </span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black text-gray-900 font-mono">
              {personalData.totalSubmitted}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Temuan bahaya yang telah Anda kirimkan</p>
        </div>

        {/* In Review / Open */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 border-l-4 border-l-amber-500 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Menunggu Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-900 font-mono">
              {personalData.openCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Laporan dalam antrean verifikasi PIC / Leader</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 border-l-4 border-l-blue-500 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Sedang Ditindaklanjuti
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black text-blue-900 font-mono">
              {personalData.inProgressCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Tindakan perbaikan sedang dikerjakan di lapangan</p>
        </div>

        {/* Resolved / Closed */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 border-l-4 border-l-emerald-500 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Selesai / Terverifikasi
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-900 font-mono">
              {personalData.resolvedCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Tingkat penyelesaian:{' '}
            <strong className="text-emerald-700">{personalData.resolutionRate}%</strong>
          </p>
        </div>
      </div>

      {/* Charts Personalized for Member: Status Breakdown & Category Share */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#EB0A1E]" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                  Status Penanganan Laporan Anda
                </h3>
                <p className="text-[11px] text-gray-500">
                  Progres penanganan laporan yang Anda sampaikan
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-gray-700">
              {personalData.totalSubmitted} Total
            </span>
          </div>

          {personalData.totalSubmitted === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada laporan yang Anda kirimkan pada periode ini.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {personalData.statusBreakdown.map((sb) => (
                <div key={sb.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-800">{sb.label}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-gray-900">{sb.count}</span>
                      <span className="text-gray-400 text-[11px]">({sb.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, sb.percentage)}%`,
                        backgroundColor: sb.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#EB0A1E]" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                  Kategori Bahaya yang Anda Laporkan
                </h3>
                <p className="text-[11px] text-gray-500">
                  Klasifikasi temuan berdasarkan modul K3 SPLD
                </p>
              </div>
            </div>
          </div>

          {personalData.totalSubmitted === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              Belum ada data kategori temuan.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {personalData.categoryBreakdown.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-800 truncate max-w-[200px]" title={cat.name}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-gray-900">{cat.count}</span>
                      <span className="text-gray-400 text-[11px]">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#EB0A1E] transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar for Personal Reports Feed */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor ref, judul, atau area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none w-full sm:w-72"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Feed of Personal Reports */}
      <RecentActivityFeed activities={filteredActivities} />
    </div>
  );
};

