import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { findingService } from '../../services/findingService.ts';
import type { FindingRecord, FindingStatus } from '../../types/finding.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { RiskBadge } from '../../components/common/RiskBadge.tsx';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  MapPin,
  CheckCircle2,
  Edit3,
  Archive,
  ZoomIn,
  X,
  FileText,
  User,
  Shield,
  Clock,
  History,
  ArrowRightCircle,
} from 'lucide-react';

function formatCategoryLabel(cat?: string): string {
  if (!cat) return '-';
  if (cat === 'UNSAFE_CONDITION' || cat === 'Unsafe Condition') return 'Unsafe Condition';
  if (cat === 'UNSAFE_ACTION' || cat === 'Unsafe Action') return 'Unsafe Action';
  if (cat === 'IMPROVEMENT_OPPORTUNITY' || cat === 'Improvement Opportunity') return 'Improvement Opportunity';
  return cat.replace(/_/g, ' ');
}

function formatHazardLabel(haz?: string | null): string {
  if (!haz) return '-';
  const map: Record<string, string> = {
    PHYSICAL: 'Physical',
    CHEMICAL: 'Chemical',
    BIOLOGICAL: 'Biological',
    ERGONOMIC: 'Ergonomic',
    ENVIRONMENTAL: 'Environmental',
  };
  return map[haz] || haz;
}

export const FindingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [finding, setFinding] = useState<FindingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<FindingStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchFinding = useCallback(async () => {
    if (!id) return;
    try {
      const item = await findingService.getFindingById(id);
      setFinding(item);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    findingService
      .getFindingById(id)
      .then((item) => {
        if (active) setFinding(item);
      })
      .catch(() => {
        if (active) setFinding(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleConfirmArchive = async () => {
    if (!finding) return;
    setIsArchiving(true);
    try {
      await findingService.archiveFinding(finding.id);
      navigate('/findings');
    } catch {
      // ignore
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmStatusTransition = async () => {
    if (!finding || !targetStatus) return;
    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      await findingService.updateStatus(finding.id, targetStatus, statusNote.trim() || undefined);
      setTargetStatus(null);
      setStatusNote('');
      await fetchFinding();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Gagal mengubah status temuan.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-[#E5E7EB] rounded-[4px] w-1/3" />
        <div className="h-64 bg-[#E5E7EB] rounded-[6px]" />
        <div className="h-40 bg-[#E5E7EB] rounded-[6px]" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <div className="w-12 h-12 rounded-[4px] bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center border border-[#FECACA]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#000000]">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-[#666666]">
          Laporan dengan ID &quot;{id}&quot; tidak ditemukan dalam dataset sistem.
        </p>
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-[4px] text-xs font-semibold text-[#333333] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Temuan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#000000] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Temuan K3</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/findings/${finding.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#333333] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-[4px] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Laporan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#333333] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[4px] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arsipkan</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#9E2638] bg-[#F8EDEF] px-2.5 py-1 rounded-[4px] border border-[#F8EDEF]">
              {finding.referenceNo}
            </span>
            <StatusBadge status={finding.status} size="md" />
            <RiskBadge level={finding.riskLevel} size="md" />
          </div>
          <span className="text-xs text-[#666666] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {finding.findingDate}
          </span>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#000000] tracking-tight">
            {finding.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#333333] mt-2 leading-relaxed whitespace-pre-line">
            {finding.description}
          </p>
        </div>

        {/* Status Lifecycle Transition Action */}
        <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8FA] p-3 rounded-[4px] border border-[#E5E7EB]">
          <div className="text-xs">
            <span className="font-bold text-[#000000] block">Status Alur K3:</span>
            {finding.status === 'OPEN' && (
              <span className="text-[#666666]">Laporan baru dibuat dan belum ditangani.</span>
            )}
            {finding.status === 'IN_PROGRESS' && (
              <span className="text-[#666666]">Tindakan perbaikan sedang dalam proses penanganan.</span>
            )}
            {finding.status === 'CLOSED' && (
              <span className="text-[#15803D] font-medium">Temuan telah ditutup dan tindakan perbaikan selesai diverifikasi.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {finding.status === 'OPEN' && (
              <button
                type="button"
                onClick={() => setTargetStatus('IN_PROGRESS')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[4px] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                <span>Mulai Penanganan (IN_PROGRESS)</span>
              </button>
            )}

            {finding.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => setTargetStatus('CLOSED')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[4px] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan Temuan (CLOSED)</span>
              </button>
            )}

            {finding.status === 'CLOSED' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Status Terminal Selesai</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Finding Classification & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Classification */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <Shield className="w-3.5 h-3.5 text-[#9E2638]" />
            <span>Klasifikasi Bahaya & Risiko</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Kategori Temuan:</span>
              <span className="font-semibold text-[#000000]">{formatCategoryLabel(finding.findingCategory)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Kategori Bahaya:</span>
              <span className="font-semibold text-[#000000]">{formatHazardLabel(finding.hazardCategory)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Tingkat Risiko:</span>
              <RiskBadge level={finding.riskLevel} size="sm" />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <MapPin className="w-3.5 h-3.5 text-[#9E2638]" />
            <span>Lokasi Temuan</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Area Operasional:</span>
              <span className="font-semibold text-[#000000]">{finding.operationalArea}</span>
            </div>
            <div>
              <span className="text-[#666666] block mb-1">Detail Lokasi:</span>
              <span className="font-medium text-[#000000] bg-[#F7F8FA] border border-[#E5E7EB] p-2.5 rounded-[4px] block">
                {finding.locationDetail}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reporter Information (No NPK/Noreg) */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
          <User className="w-3.5 h-3.5 text-[#9E2638]" />
          <span>Informasi Pelapor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[#666666] block text-[11px]">Nama Pelapor:</span>
            <span className="font-bold text-[#000000] mt-0.5 block">{finding.reporterName}</span>
          </div>
          <div>
            <span className="text-[#666666] block text-[11px]">Departemen:</span>
            <span className="font-semibold text-[#000000] mt-0.5 block">
              {finding.reporterDepartment === 'Lain-lain'
                ? `${finding.reporterDepartment} (${finding.otherDepartmentName})`
                : finding.reporterDepartment}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block text-[11px]">Section / Area Pelapor:</span>
            <span className="font-semibold text-[#000000] mt-0.5 block">{finding.reporterSection}</span>
          </div>
        </div>
      </div>

      {/* Corrective Action Section */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Tindakan Perbaikan (Corrective Action)</span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[#666666] block mb-1">Rencana / Catatan Tindakan Perbaikan:</span>
            <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] p-3 text-[#000000] leading-relaxed font-normal">
              {finding.correctiveAction || 'Belum ada catatan tindakan perbaikan.'}
            </div>
          </div>
          {finding.dueDate && (
            <div className="flex items-center gap-2 pt-1 text-[#666666]">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>
                Target Selesai (Due Date): <strong className="text-[#000000]">{finding.dueDate}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Gallery (up to 3 photos) */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 text-[#9E2638]" />
            <span>Dokumentasi Foto Bukti ({finding.evidences.length}/3)</span>
          </div>
          <span className="text-[11px] text-[#666666] font-medium">Klik foto untuk perbesar</span>
        </div>

        {finding.evidences.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#666666] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
            Tidak ada foto bukti yang dilampirkan pada laporan ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {finding.evidences.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setZoomedImage(ev.url)}
                className="group relative aspect-video rounded-[4px] overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] cursor-pointer shadow-xs"
              >
                <img
                  src={ev.url}
                  alt={ev.fileName}
                  className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ZoomIn className="w-6 h-6" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-white">
                  <p className="text-[10px] font-medium truncate">{ev.fileName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Status History Timeline */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide">
            <History className="w-3.5 h-3.5 text-[#9E2638]" />
            <span>Riwayat Transisi Status ({finding.statusHistory?.length || 0})</span>
          </div>
          <span className="text-[11px] text-[#666666] font-medium">Urutan Kronologis</span>
        </div>

        {(!finding.statusHistory || finding.statusHistory.length === 0) ? (
          <div className="p-4 text-center text-xs text-[#666666] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px]">
            Belum ada catatan riwayat status.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5E7EB]">
            {finding.statusHistory.map((item, idx) => (
              <div key={item.id || idx} className="relative text-xs">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-[2px] border-2 border-white bg-[#9E2638] shadow-xs flex items-center justify-center" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#000000]">
                    {item.oldStatus ? `${item.oldStatus} ➔ ${item.newStatus}` : `Status Awal: ${item.newStatus}`}
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    {new Date(item.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-[#333333] mt-0.5">
                  {item.note || 'Tidak ada catatan tambahan.'}
                </p>
                <p className="text-[10px] text-[#666666] mt-0.5">
                  Oleh: {item.changedByName || 'Administrator'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {targetStatus && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-sm w-full p-6 space-y-4 shadow-md border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#000000] font-bold text-sm">
                <ArrowRightCircle className="w-5 h-5 text-[#9E2638]" />
                <span>Ubah Status Temuan</span>
              </div>
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="text-[#666666] hover:text-[#000000] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#333333] leading-relaxed">
                Anda akan mengubah status laporan{' '}
                <strong className="text-[#000000]">{finding.referenceNo}</strong> dari{' '}
                <strong className="text-[#000000]">{finding.status}</strong> menjadi{' '}
                <strong className="text-[#9E2638]">{targetStatus}</strong>.
              </p>

              {statusError && (
                <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-[11px]">
                  {statusError}
                </div>
              )}

              <div>
                <label className="block text-[#333333] font-semibold mb-1">
                  Catatan Transisi (Opsional):
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Tambahkan catatan tindakan atau verifikasi perbaikan..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-[4px] border border-[#E5E7EB] bg-white text-[#000000] focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#333333] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-[4px] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusTransition}
                disabled={isUpdatingStatus}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#9E2638] hover:bg-[#7F1F2E] rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingStatus ? 'Memperbarui...' : 'Konfirmasi Ubah Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-[6px] border border-white/10">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-[4px] bg-black/70 text-white hover:bg-black transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-[6px]"
            />
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-sm w-full p-6 space-y-4 shadow-md border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-[#000000]">Konfirmasi Arsipkan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-[#666666] hover:text-[#000000] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#333333] leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan laporan{' '}
              <strong className="text-[#000000]">{finding.referenceNo}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
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

export default FindingDetailPage;
