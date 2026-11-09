import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';
import { masterDataService } from '../../services/masterDataService';
import type { PatrolFilters, PatrolLifecycleStatus } from '../../types/safety';
import { PatrolFormModal } from '../../components/patrols/PatrolFormModal';
import { Button } from '../../components/common/Button';
import {
  Footprints,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  AlertTriangle,
  Building2,
  ArrowRight,
} from 'lucide-react';

export const PatrolsListPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  const [filters, setFilters] = useState<PatrolFilters>({
    search: '',
    status: 'ALL',
    departmentId: 'ALL',
    operationalAreaId: 'ALL',
    startDate: '',
    endDate: '',
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Master Data Filters
  const departments = masterDataService.getActiveDepartments();
  const operationalAreas = masterDataService.getActiveOperationalAreas();

  // If APPROVER, restrict selectable areas to their assigned areaAccess
  const availableAreas =
    currentUser.role === 'APPROVER'
      ? operationalAreas.filter((a) => (currentUser.areaAccess || []).includes(a.id))
      : operationalAreas;

  // Fetch scoped patrols from safetyService
  const patrols = refreshKey >= 0 ? safetyService.getPatrols(currentUser, filters) : [];

  const canSchedule = currentUser.role === 'QSHE_ADMIN' || currentUser.role === 'APPROVER';

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      departmentId: 'ALL',
      operationalAreaId: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status: PatrolLifecycleStatus) => {
    switch (status) {
      case 'Planned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Planned</span>
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <User className="w-3 h-3 text-purple-600" />
            <span>Assigned</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <PlayCircle className="w-3 h-3 text-amber-600" />
            <span>In Progress</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
            <XCircle className="w-3 h-3 text-gray-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-600 bg-gray-100">
            {status}
          </span>
        );
    }
  };

  // KPI calculations based on current scoped list
  const totalPatrols = patrols.length;
  const plannedCount = patrols.filter((p) => p.status === 'Planned' || p.status === 'Assigned').length;
  const inProgressCount = patrols.filter((p) => p.status === 'In Progress').length;
  const completedCount = patrols.filter((p) => p.status === 'Completed').length;

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#EB0A1E] flex items-center justify-center shrink-0 border border-red-100">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Safety Patrol Management
                </h1>
                <span className="text-xs bg-red-100 text-[#EB0A1E] px-2 py-0.5 rounded-full font-bold">
                  Module 05
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Jadwalkan, laksanakan inspeksi lapangan berbasis checklist, dan laporkan temuan keselamatan secara terpadu.
              </p>
            </div>
          </div>

          {canSchedule && (
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Jadwalkan Patroli Baru</span>
              </Button>
            </div>
          )}
        </div>

        {/* Operational Role Notification Banner */}
        {currentUser.role === 'APPROVER' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-800">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold">Area Access Terbatas:</span> Sebagai Approver, Anda melihat dan mengelola agenda patroli di area yang ditugaskan kepada Anda (
              {(currentUser.areaAccess || []).length} area terotorisasi).
            </div>
          </div>
        )}

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="text-xs font-medium text-gray-500">Total Agenda Patroli</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{totalPatrols}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Sesuai filter aktif</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/20 shadow-2xs">
            <div className="text-xs font-medium text-blue-700">Terjadwal (Planned)</div>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">{plannedCount}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Menunggu pelaksanaan</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-2xs">
            <div className="text-xs font-medium text-amber-700">Sedang Berjalan</div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{inProgressCount}</div>
            <div className="text-[11px] text-amber-500 mt-0.5">Checklist sedang diisi</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
            <div className="text-xs font-medium text-emerald-700">Selesai (Completed)</div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">{completedCount}</div>
            <div className="text-[11px] text-emerald-500 mt-0.5">Inspeksi terverifikasi</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Filter className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Filter & Pencarian Agenda Patroli</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-[#EB0A1E] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Cari agenda, ref no, leader..."
                value={filters.search || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status || 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value as 'ALL' | PatrolLifecycleStatus }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Status Patroli</option>
                <option value="Planned">Planned (Terjadwal)</option>
                <option value="Assigned">Assigned (Ditugaskan)</option>
                <option value="In Progress">In Progress (Berjalan)</option>
                <option value="Completed">Completed (Selesai)</option>
                <option value="Cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>

            {/* Operational Area Filter */}
            <div>
              <select
                value={filters.operationalAreaId || 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, operationalAreaId: e.target.value }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Area Operasional</option>
                {availableAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={filters.departmentId || 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, departmentId: e.target.value }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Departemen</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Patrols Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span>Daftar Agenda Safety Patrol</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                {patrols.length} item
              </span>
            </h2>
          </div>

          {patrols.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-800">Tidak ada agenda patroli yang cocok</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Silakan sesuaikan parameter pencarian atau jadwalkan agenda inspeksi baru melalui tombol di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No. Ref</th>
                    <th className="py-3 px-3">Nama / Agenda Patroli</th>
                    <th className="py-3 px-3">Area Operasional</th>
                    <th className="py-3 px-3">Departemen</th>
                    <th className="py-3 px-3">Tgl Jadwal</th>
                    <th className="py-3 px-3">Leader</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Temuan</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {patrols.map((p) => {
                    const verifiedCount = p.checklist.filter((c) => c.status !== 'UNCHECKED').length;
                    const totalChecklist = p.checklist.length;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                          <Link to={`/patrols/${p.id}`} className="hover:text-[#EB0A1E] hover:underline">
                            {p.referenceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-gray-900 truncate" title={p.patrolName}>
                            {p.patrolName}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                              Checklist: {verifiedCount}/{totalChecklist}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{p.operationalAreaName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                          {p.departmentName}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{p.plannedDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-gray-900 font-medium">{p.leaderName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.leaderNoreg}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {renderStatusBadge(p.status)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-center">
                          {p.findingsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{p.findingsCount}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-center">
                          <Link
                            to={`/patrols/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-[#EB0A1E] hover:text-white rounded-lg transition-colors"
                          >
                            <span>Buka Checklist</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        <PatrolFormModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={() => {
            setRefreshKey((k) => k + 1);
          }}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};
