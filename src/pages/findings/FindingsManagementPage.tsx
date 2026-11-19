import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { findingService } from '../../services/findingService.ts';
import type {
  FindingRecord,
  FindingFilters,
  FindingStatus,
  RiskLevel,
  FindingCategory,
  HazardCategory,
  DepartmentOption,
} from '../../types/finding.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_LIST,
  HAZARD_CATEGORY_LIST,
  RISK_LEVEL_LIST,
  FINDING_STATUS_LIST,
  OPERATIONAL_AREA_LIST,
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FindingStatus | 'ALL'>('ALL');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'ALL'>('ALL');
  const [findingCategory, setFindingCategory] = useState<FindingCategory | 'ALL'>('ALL');
  const [hazardCategory, setHazardCategory] = useState<HazardCategory | 'ALL'>('ALL');
  const [department, setDepartment] = useState<DepartmentOption | 'ALL'>('ALL');
  const [operationalArea, setOperationalArea] = useState<string | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = useState<FindingRecord | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchFindings = useCallback(async () => {
    try {
      const filters: FindingFilters = {
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        riskLevel: riskLevel !== 'ALL' ? riskLevel : undefined,
        findingCategory: findingCategory !== 'ALL' ? findingCategory : undefined,
        hazardCategory: hazardCategory !== 'ALL' ? hazardCategory : undefined,
        department: department !== 'ALL' ? department : undefined,
        operationalArea: operationalArea !== 'ALL' ? operationalArea : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const result = await findingService.getFindings(filters, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      setFindings(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);
    } catch {
      setFindings([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    status,
    riskLevel,
    findingCategory,
    hazardCategory,
    department,
    operationalArea,
    startDate,
    endDate,
    currentPage,
  ]);

  useEffect(() => {
    let active = true;

    const filters: FindingFilters = {
      search: search.trim() || undefined,
      status: status !== 'ALL' ? status : undefined,
      riskLevel: riskLevel !== 'ALL' ? riskLevel : undefined,
      findingCategory: findingCategory !== 'ALL' ? findingCategory : undefined,
      hazardCategory: hazardCategory !== 'ALL' ? hazardCategory : undefined,
      department: department !== 'ALL' ? department : undefined,
      operationalArea: operationalArea !== 'ALL' ? operationalArea : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    findingService
      .getFindings(filters, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })
      .then((result) => {
        if (!active) return;
        setFindings(result.items);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFindings([]);
        setTotalPages(1);
        setTotalCount(0);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    search,
    status,
    riskLevel,
    findingCategory,
    hazardCategory,
    department,
    operationalArea,
    startDate,
    endDate,
    currentPage,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setRiskLevel('ALL');
    setFindingCategory('ALL');
    setHazardCategory('ALL');
    setDepartment('ALL');
    setOperationalArea('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await findingService.archiveFinding(archiveTarget.id);
      setArchiveTarget(null);
      await fetchFindings();
    } catch {
      // ignore
    } finally {
      setIsArchiving(false);
    }
  };

  const paginatedFindings = findings;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#000000] tracking-tight">
            Temuan K3
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Daftar dan kelola temuan K3 terpadu
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/findings/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E2638] hover:bg-[#7F1F2E] text-white rounded-[4px] text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan</span>
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nomor referensi (FND-2026-...) atau judul temuan..."
            className="w-full pl-9 pr-3 py-2 text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 pt-1">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FindingStatus | 'ALL')}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
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
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Tingkat Risiko
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel | 'ALL')}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
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
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Kategori Temuan
            </label>
            <select
              value={findingCategory}
              onChange={(e) => setFindingCategory(e.target.value as FindingCategory | 'ALL')}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            >
              <option value="ALL">Semua Kategori</option>
              {FINDING_CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Hazard Category */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Kategori Bahaya
            </label>
            <select
              value={hazardCategory}
              onChange={(e) => setHazardCategory(e.target.value as HazardCategory | 'ALL')}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            >
              <option value="ALL">Semua Bahaya</option>
              {HAZARD_CATEGORY_LIST.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Departemen
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DepartmentOption | 'ALL')}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            >
              <option value="ALL">Semua Dept</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Operational Area */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Area Operasional
            </label>
            <select
              value={operationalArea}
              onChange={(e) => setOperationalArea(e.target.value)}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            >
              <option value="ALL">Semua Area</option>
              {OPERATIONAL_AREA_LIST.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
          <span className="text-[#666666] font-medium">
            Ditemukan <strong className="text-[#000000]">{totalCount}</strong> laporan
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[#666666] hover:text-[#9E2638] flex items-center gap-1 transition-colors cursor-pointer"
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
            <div key={i} className="h-28 bg-[#E5E7EB] rounded-[6px] animate-pulse" />
          ))}
        </div>
      ) : findings.length === 0 ? (
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] text-[#666666] mx-auto flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#000000]">Tidak ada temuan yang sesuai</h3>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            Tidak ditemukan laporan temuan K3 berdasarkan kata kunci atau kriteria filter yang dipilih.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-[4px] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] text-[#333333] text-xs font-semibold cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedFindings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-4 hover:bg-[#F7F8FA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Finding Main Info */}
              <div
                onClick={() => navigate(`/findings/${item.id}`)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#9E2638] bg-[#F8EDEF] px-2 py-0.5 rounded-[4px] border border-[#F8EDEF]">
                    {item.referenceNo}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                  <RiskBadge level={item.riskLevel} size="sm" />
                  <span className="text-[11px] font-medium text-[#333333] bg-[#F7F8FA] border border-[#E5E7EB] px-2 py-0.5 rounded-[4px]">
                    {item.findingCategory}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#000000] group-hover:text-[#9E2638] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#666666] line-clamp-2 mt-1">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-[#666666]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#666666]" />
                    {item.findingDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#666666]" />
                    {item.reporterDepartment === 'Lain-lain'
                      ? `${item.reporterDepartment} (${item.otherDepartmentName})`
                      : item.reporterDepartment}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#666666]" />
                    {item.operationalArea}
                  </span>
                  {item.evidences.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded-[4px]">
                      {item.evidences.length} Foto Bukti
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E7EB] shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/findings/${item.id}`)}
                  className="p-2 rounded-[4px] border border-[#E5E7EB] text-[#666666] hover:text-[#9E2638] hover:bg-[#F8EDEF] transition-colors cursor-pointer"
                  title="Lihat Detail"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/findings/${item.id}/edit`)}
                  className="p-2 rounded-[4px] border border-[#E5E7EB] text-[#666666] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                  title="Edit Laporan"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTarget(item)}
                  className="p-2 rounded-[4px] border border-[#E5E7EB] text-[#666666] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
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
              <span className="text-xs text-[#666666]">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] disabled:opacity-40 text-[#333333] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#9E2638] text-white'
                        : 'border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] text-[#333333]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] disabled:opacity-40 text-[#333333] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-sm w-full p-6 space-y-4 shadow-md border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#000000]">Konfirmasi Arsipkan</h3>
              </div>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="text-[#666666] hover:text-[#000000] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#333333] leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan laporan{' '}
              <strong className="text-[#000000]">{archiveTarget.referenceNo}</strong>?
              Laporan ini tidak akan lagi ditampilkan pada daftar utama dan perhitungan KPI dashboard.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#333333] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-[4px] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
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

export default FindingsManagementPage;
