import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';
import { masterDataService } from '../../services/masterDataService';
import type { FindingFilters, FindingLifecycleStatus, FindingSource } from '../../types/safety';
import { FindingFormModal } from '../../components/findings/FindingFormModal';
import { Button } from '../../components/common/Button';
import {
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  Eye,
  User,
  RefreshCw,
} from 'lucide-react';

export const FindingsManagementPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  const [filters, setFilters] = useState<FindingFilters>({
    search: '',
    source: 'ALL',
    status: 'ALL',
    departmentId: 'ALL',
    operationalAreaId: 'ALL',
    categoryId: 'ALL',
    riskLevelId: 'ALL',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Master Data Filters
  const departments = masterDataService.getActiveDepartments();
  const operationalAreas = masterDataService.getActiveOperationalAreas();
  const findingCategories = masterDataService.getActiveFindingCategories();
  const riskLevels = masterDataService.getActiveRiskLevels();

  // Fetch scoped findings from safetyService
  const findings = refreshKey >= 0 ? safetyService.getFindings(currentUser, filters) : [];

  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: 'ALL',
      status: 'ALL',
      departmentId: 'ALL',
      operationalAreaId: 'ALL',
      categoryId: 'ALL',
      riskLevelId: 'ALL',
    });
  };

  const getStatusBadge = (status: FindingLifecycleStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accepted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Manajemen Temuan Keselamatan Kerja
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                Finding Management
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Pusat monitoring, evaluasi, dan tindak lanjut laporan kondisi & tindakan tidak aman di lingkungan SPLD.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {currentUser.role === 'MEMBER' && (
              <Link to="/my-findings">
                <Button variant="outline" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                  Laporan Saya Saja
                </Button>
              </Link>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Laporkan Temuan Langsung
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Filter className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Filter & Pencarian Temuan</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-[#EB0A1E] flex items-center gap-1 transition-colors"
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
                placeholder="Cari judul, ref no, pelapor..."
                value={filters.search || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              />
            </div>

            {/* Source Filter (DIRECT vs PATROL) */}
            <div>
              <select
                value={filters.source || 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, source: e.target.value as 'ALL' | FindingSource }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Jalur Pelaporan</option>
                <option value="DIRECT">Direct Finding (Langsung)</option>
                <option value="PATROL">Patrol Finding (Dari Patroli)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status || 'ALL'}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as 'ALL' | FindingLifecycleStatus,
                  }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Status</option>
                <option value="Submitted">Submitted (Baru)</option>
                <option value="Under Review">Under Review (Evaluasi)</option>
                <option value="Accepted">Accepted (Diterima)</option>
                <option value="In Progress">In Progress (Tindak Lanjut)</option>
                <option value="Resolved">Resolved (Selesai Fisik)</option>
                <option value="Closed">Closed (Ditutup)</option>
                <option value="Rejected">Rejected (Ditolak)</option>
              </select>
            </div>

            {/* Risk Level Filter */}
            <div>
              <select
                value={filters.riskLevelId || 'ALL'}
                onChange={(e) => setFilters((prev) => ({ ...prev, riskLevelId: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Tingkat Risiko</option>
                {riskLevels.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            {/* Department Filter */}
            <div>
              <select
                value={filters.departmentId || 'ALL'}
                onChange={(e) => setFilters((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Operational Area Filter */}
            <div>
              <select
                value={filters.operationalAreaId || 'ALL'}
                onChange={(e) => setFilters((prev) => ({ ...prev, operationalAreaId: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Area Operasional</option>
                {operationalAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finding Category */}
            <div>
              <select
                value={filters.categoryId || 'ALL'}
                onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
              >
                <option value="ALL">Semua Kategori Temuan</option>
                {findingCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Findings Table Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-900">
              Daftar Temuan Keselamatan ({findings.length} Data)
            </span>
            <span className="text-gray-500 text-[11px]">
              Otorisasi: <strong>{currentUser.role}</strong>
              {currentUser.role === 'APPROVER' && ` (${currentUser.areaAccess?.length || 0} Area)`}
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-800">Tidak ada temuan yang cocok</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Silakan sesuaikan filter pencarian Anda atau laporkan temuan baru menggunakan tombol di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No. Ref</th>
                    <th className="py-3 px-3">Judul Temuan</th>
                    <th className="py-3 px-3">Jalur</th>
                    <th className="py-3 px-3">Tingkat Risiko</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Area Operasional</th>
                    <th className="py-3 px-3">Pelapor</th>
                    <th className="py-3 px-3">Tgl Lapor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {findings.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <Link to={`/findings/${f.id}`} className="hover:text-[#EB0A1E] hover:underline">
                          {f.referenceNo}
                        </Link>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-gray-900 truncate" title={f.title}>
                          {f.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate" title={f.description}>
                          {f.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            f.source === 'DIRECT'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {f.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: f.riskDisplayColor || '#EF4444' }}
                        >
                          {f.riskLevelName}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {f.categoryName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                        {f.operationalAreaName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{f.reportedByName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{f.reportedByNoreg}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-500 text-[11px]">
                        {new Date(f.reportedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            f.status
                          )}`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Link to={`/findings/${f.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Eye className="w-3.5 h-3.5 text-gray-600 mr-1" />
                            <span>Detail</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Direct Finding Creation Modal */}
      <FindingFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        currentUser={currentUser}
        source="DIRECT"
      />
    </div>
  );
};
