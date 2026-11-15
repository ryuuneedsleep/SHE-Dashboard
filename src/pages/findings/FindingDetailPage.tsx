import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockFindingService } from '../../services/mock/mockFindingService.ts';
import type { FindingRecord } from '../../types/finding.ts';
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
} from 'lucide-react';

export const FindingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [finding, setFinding] = useState<FindingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchFinding = async () => {
      setIsLoading(true);
      try {
        const item = await mockFindingService.getFindingById(id);
        setFinding(item);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinding();
  }, [id]);

  const handleConfirmArchive = async () => {
    if (!finding) return;
    setIsArchiving(true);
    try {
      await mockFindingService.archiveFinding(finding.id);
      navigate('/findings');
    } catch {
      // ignore
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse pb-20">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-xl" />
        <div className="h-40 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3 pb-20">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Laporan dengan ID &quot;{id}&quot; tidak ditemukan dalam dataset sistem.
        </p>
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Temuan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Temuan K3</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/findings/${finding.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Laporan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arsipkan</span>
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
              {finding.referenceNo}
            </span>
            <StatusBadge status={finding.status} size="md" />
            <RiskBadge level={finding.riskLevel} size="md" />
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {finding.findingDate}
          </span>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {finding.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
            {finding.description}
          </p>
        </div>
      </div>

      {/* Grid: Finding Classification & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Classification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>Klasifikasi Bahaya & Risiko</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Kategori Temuan:</span>
              <span className="font-semibold text-slate-800">{finding.findingCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kategori Bahaya:</span>
              <span className="font-semibold text-slate-800">{finding.hazardCategory || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tingkat Risiko:</span>
              <RiskBadge level={finding.riskLevel} size="sm" />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>Lokasi Temuan</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Area Operasional:</span>
              <span className="font-semibold text-slate-800">{finding.operationalArea}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Detail Lokasi:</span>
              <span className="font-medium text-slate-800 bg-slate-50 p-2 rounded-lg block">
                {finding.locationDetail}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reporter Information (No NPK/Noreg) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
          <User className="w-3.5 h-3.5 text-red-600" />
          <span>Informasi Pelapor</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Nama Pelapor:</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{finding.reporterName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Departemen:</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {finding.reporterDepartment === 'Lain-lain'
                ? `${finding.reporterDepartment} (${finding.otherDepartmentName})`
                : finding.reporterDepartment}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Section / Area Pelapor:</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{finding.reporterSection}</span>
          </div>
        </div>
      </div>

      {/* Corrective Action Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tindakan Perbaikan (Corrective Action)</span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Rencana / Catatan Tindakan Perbaikan:</span>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-slate-800 leading-relaxed font-medium">
              {finding.correctiveAction || 'Belum ada catatan tindakan perbaikan.'}
            </div>
          </div>
          {finding.dueDate && (
            <div className="flex items-center gap-2 pt-1 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Target Selesai (Due Date): <strong>{finding.dueDate}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Gallery (up to 3 photos) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Dokumentasi Foto Bukti ({finding.evidences.length}/3)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Klik foto untuk perbesar</span>
        </div>

        {finding.evidences.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            Tidak ada foto bukti yang dilampirkan pada laporan ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {finding.evidences.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setZoomedImage(ev.url)}
                className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-xs"
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
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ZoomIn className="w-6 h-6" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2 text-white">
                  <p className="text-[10px] font-medium truncate">{ev.fileName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed Evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Arsipkan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan laporan{' '}
              <strong className="text-slate-900">{finding.referenceNo}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
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
