import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockFindingService } from '../../services/mock/mockFindingService.ts';
import type {
  FindingRecord,
  FindingFilters,
  FindingStatus,
  RiskLevel,
  FindingCategory,
  DepartmentOption,
} from '../../types/finding.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_LIST,
  RISK_LEVEL_LIST,
  FINDING_STATUS_LIST,
} from '../../types/finding.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { RiskBadge } from '../../components/common/RiskBadge.tsx';
import {
  Search,
  Filter,
  PlusCircle,
  RotateCcw,
  Calendar,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Archive,
  AlertTriangle,
  X,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export const FindingsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FindingStatus | 'ALL'>('ALL');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'ALL'>('ALL');
  const [findingCategory, setFindingCategory] = useState<FindingCategory | 'ALL'>('ALL');
  const [department, setDepartment] = useState<DepartmentOption | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = useState<FindingRecord | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    let active = true;

    const filters: FindingFilters = {
      search: search.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      riskLevel: riskLevel !== 'ALL' ? riskLevel : undefined,
      findingCategory: findingCategory !== 'ALL' ? findingCategory : undefined,
      department: department !== 'ALL' ? department : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    mockFindingService.getFindings(filters).then((result) => {
      if (!active) return;
      setFindings(result);
      setIsLoading(false);
      setCurrentPage(1);
    });

    return () => {
      active = false;
    };
  }, [search, status, riskLevel, findingCategory, department, startDate, endDate]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setRiskLevel('ALL');
    setFindingCategory('ALL');
    setDepartment('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await mockFindingService.archiveFinding(archiveTarget.id);
      setArchiveTarget(null);
      const updated = await mockFindingService.getFindings();
      setFindings(updated);
    } catch {
      // ignore
    } finally {
      setIsArchiving(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(findings.length / ITEMS_PER_PAGE) || 1;
  const paginatedFindings = findings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-5 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Temuan K3
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pelaporan kondisi berbahaya, tindakan tidak aman, dan usulan perbaikan
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/findings/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Temuan</span>
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nomor referensi (FND-2026-...) atau judul temuan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FindingStatus | 'ALL')}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">Semua Status</option>
              {FINDING_STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tingkat Risiko
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel | 'ALL')}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">Semua Risiko</option>
              {RISK_LEVEL_LIST.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Finding Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Kategori Temuan
            </label>
            <select
              value={findingCategory}
              onChange={(e) => setFindingCategory(e.target.value as FindingCategory | 'ALL')}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">Semua Kategori</option>
              {FINDING_CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Departemen
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DepartmentOption | 'ALL')}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">Semua Dept</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Ditemukan <strong className="text-slate-900">{findings.length}</strong> laporan
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>

      {/* Findings List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : findings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada temuan yang sesuai</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ditemukan laporan temuan K3 berdasarkan kata kunci atau kriteria filter yang dipilih.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedFindings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Finding Main Info */}
              <div
                onClick={() => navigate(`/findings/${item.id}`)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {item.referenceNo}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                  <RiskBadge level={item.riskLevel} size="sm" />
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {item.findingCategory}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {item.findingDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {item.reporterDepartment === 'Lain-lain'
                      ? `${item.reporterDepartment} (${item.otherDepartmentName})`
                      : item.reporterDepartment}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.operationalArea}
                  </span>
                  {item.evidences.length > 0 && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {item.evidences.length} Foto Bukti
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/findings/${item.id}`)}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-slate-100 transition"
                  title="Lihat Detail"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/findings/${item.id}/edit`)}
                  className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Edit Laporan"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTarget(item)}
                  className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition"
                  title="Arsipkan Laporan"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Arsipkan</h3>
              </div>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan laporan{' '}
              <strong className="text-slate-900">{archiveTarget.referenceNo}</strong>?
              Laporan ini tidak akan lagi ditampilkan pada daftar utama dan perhitungan KPI dashboard.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {isArchiving ? 'Mengarsipkan...' : 'Ya, Arsipkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
