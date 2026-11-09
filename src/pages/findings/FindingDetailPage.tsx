import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';
import type { FindingLifecycleStatus } from '../../types/safety';
import { FindingReviewModal } from '../../components/findings/FindingReviewModal';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  User,
  Layers,
  XCircle,
  CheckSquare,
  ShieldAlert,
  Link as LinkIcon,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';

export const FindingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [finding, setFinding] = useState(() => (id ? safetyService.getFindingById(id) : undefined));
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isZoomImageOpen, setIsZoomImageOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-xs">
        <p>Sesi login berakhir. Harap login kembali.</p>
        <Link to="/login" className="text-red-600 underline font-bold mt-2 inline-block">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-[#EB0A1E] flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Temuan Keselamatan Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500 max-w-sm">
          Nomor referensi atau ID temuan <strong>{id}</strong> tidak terdaftar dalam sistem SPLD SAFETY.
        </p>
        <Link to="/findings">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Daftar Temuan
          </Button>
        </Link>
      </div>
    );
  }

  // Access Control Scoping Check
  const isReporter = currentUser.noreg === finding.reportedByNoreg;
  const isApprover = currentUser.role === 'APPROVER';
  const hasAreaAccess =
    !isApprover || (currentUser.areaAccess || []).includes(finding.operationalAreaId);

  // Members can ONLY view their own reports
  if (currentUser.role === 'MEMBER' && !isReporter) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi (Unauthorized)</h2>
        <p className="text-xs text-gray-500 max-w-sm">
          Sebagai Member, Anda hanya diizinkan untuk melihat laporan temuan keselamatan yang Anda laporkan sendiri.
        </p>
        <Link to="/my-findings">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Ke Laporan Saya
          </Button>
        </Link>
      </div>
    );
  }

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Review Action Gated by Universal Anti Self-Approval */}
          {currentUser.role !== 'MEMBER' && currentUser.role !== 'MANAGEMENT' && (
            <div>
              {isReporter ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Proteksi Anti Self-Approval: Pelapor tidak dapat mereview temuan sendiri</span>
                </div>
              ) : hasAreaAccess ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(true)}
                  leftIcon={<CheckSquare className="w-4 h-4" />}
                >
                  Review & Otorisasi Status
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Area Access Terbatas</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Finding Overview Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                  {finding.referenceNo}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    finding.source === 'DIRECT'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Jalur: {finding.source === 'DIRECT' ? 'Direct Finding' : 'Patrol Finding'}
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: finding.riskDisplayColor || '#EF4444' }}
                >
                  {finding.riskLevelName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                {finding.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-2xs ${getStatusBadge(
                  finding.status
                )}`}
              >
                Status: {finding.status}
              </span>
            </div>
          </div>

          {/* Rejection Alert Banner if Rejected */}
          {finding.status === 'Rejected' && finding.rejectionReason && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-900 flex items-start gap-3 text-xs">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-red-950">Laporan Ditolak oleh Reviewer</div>
                <p className="mt-1 leading-relaxed text-red-900 font-medium">
                  Alasan Penolakan: &ldquo;{finding.rejectionReason}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-6 text-xs">
            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                Deskripsi Observasi Bahaya
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap">
                {finding.description}
              </p>
            </div>

            {/* Originating Patrol Link if PATROL source */}
            {finding.source === 'PATROL' && finding.patrolId && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-amber-950">Berasal dari Safety Patrol Terjadwal:</span>
                    <span className="ml-1.5 font-mono font-bold text-gray-900">{finding.patrolRefNo}</span>
                  </div>
                </div>
                <Link
                  to={`/patrols/${finding.patrolId}`}
                  className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-900 hover:underline"
                >
                  <span>Buka Patroli</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Master Data Classification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Kategori Temuan
                </span>
                <span className="font-bold text-gray-900 text-xs block">{finding.categoryName}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Kategori Bahaya (Hazard)
                </span>
                <span className="font-bold text-gray-900 text-xs block">
                  {finding.hazardCategoryName || '-'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Area Operasional
                </span>
                <span className="font-bold text-gray-900 text-xs block">
                  {finding.operationalAreaName}
                </span>
                {finding.locationDetails && (
                  <span className="text-[10px] text-gray-500 block truncate" title={finding.locationDetails}>
                    {finding.locationDetails}
                  </span>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                  Departemen & Seksi
                </span>
                <span className="font-bold text-gray-900 text-xs block">
                  {finding.departmentName}
                </span>
                <span className="text-[10px] text-gray-500 block">{finding.sectionName}</span>
              </div>
            </div>

            {/* Photo Evidence Section */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>Dokumentasi Foto Bukti Temuan</span>
              </h3>

              {finding.evidence ? (
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center gap-4">
                  <div
                    className="relative w-48 h-36 rounded-lg overflow-hidden border border-gray-300 bg-black cursor-pointer group flex-shrink-0"
                    onClick={() => setIsZoomImageOpen(true)}
                  >
                    <img
                      src={finding.evidence.previewUrl}
                      alt={finding.evidence.fileName}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                      <ZoomIn className="w-4 h-4" />
                      <span>Perbesar</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-gray-900">{finding.evidence.fileName}</p>
                    <p className="text-gray-500 text-[11px]">
                      Format: {finding.evidence.fileType} • Diunggah pada:{' '}
                      {new Date(finding.evidence.uploadedAt).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-gray-400 italic">
                      Klik pada gambar untuk melihat tampilan penuh resolusi tinggi.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 italic text-center">
                  Tidak ada lampiran foto bukti pada laporan ini.
                </div>
              )}
            </div>

            {/* Reporter Information Box */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>Informasi Pelapor</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-400 text-[10px] block">Nama Pelapor:</span>
                  <span className="font-bold text-gray-900 text-xs">{finding.reportedByName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Noreg (NPK):</span>
                  <span className="font-mono font-bold text-gray-900 text-xs">{finding.reportedByNoreg}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Waktu Submit:</span>
                  <span className="text-gray-700 text-xs">
                    {new Date(finding.reportedAt).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Review Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>Rekam Jejak Audit & Riwayat Review</span>
              </h3>

              <div className="relative border-l-2 border-gray-200 ml-3 space-y-4 py-1">
                {finding.reviewHistory.map((rev) => (
                  <div key={rev.id} className="relative pl-5 text-xs">
                    <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#EB0A1E] border-2 border-white ring-2 ring-red-100" />
                    <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                      <span>Status berubah ke &ldquo;{rev.newStatus}&rdquo;</span>
                      <span className="text-gray-400 text-[10px] font-normal">
                        ({new Date(rev.timestamp).toLocaleString('id-ID')})
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      Aktor: <strong>{rev.actorName}</strong> ({rev.actorNoreg} • {rev.actorRole})
                    </div>
                    {rev.notes && (
                      <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                        Catatan: {rev.notes}
                      </p>
                    )}
                    {rev.rejectionReason && (
                      <p className="mt-1 text-red-700 bg-red-50 p-2 rounded border border-red-200 font-medium">
                        Alasan Penolakan: {rev.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <FindingReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={(updated) => setFinding(updated)}
        finding={finding}
        currentUser={currentUser}
      />

      {/* Full Photo Zoom Modal */}
      {isZoomImageOpen && finding.evidence && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsZoomImageOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img
              src={finding.evidence.previewUrl}
              alt={finding.evidence.fileName}
              className="max-w-full max-h-[85vh] rounded-lg object-contain mx-auto"
            />
            <p className="text-white text-center text-xs mt-2 font-mono">
              {finding.evidence.fileName} • Klik di mana saja untuk menutup
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
