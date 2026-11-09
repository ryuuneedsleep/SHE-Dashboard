import React, { useState } from 'react';
import type { AuthUser } from '../../types/auth';
import type { SafetyFindingRecord, FindingLifecycleStatus } from '../../types/safety';
import { safetyService } from '../../services/safetyService';
import { Button } from '../common/Button';
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';

interface FindingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedFinding: SafetyFindingRecord) => void;
  finding: SafetyFindingRecord;
  currentUser: AuthUser;
}

export const FindingReviewModal: React.FC<FindingReviewModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  finding,
  currentUser,
}) => {
  const isReporter = currentUser.noreg === finding.reportedByNoreg;
  const isApprover = currentUser.role === 'APPROVER';
  const hasAreaAccess =
    !isApprover || (currentUser.areaAccess || []).includes(finding.operationalAreaId);

  const [selectedTarget, setSelectedTarget] = useState<FindingLifecycleStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReview = async (target: FindingLifecycleStatus) => {
    setError(null);

    // 1. Universal Anti Self-Approval Check
    if (isReporter) {
      setError(
        'Proteksi Anti Self-Approval: Anda adalah pelapor temuan ini. Evaluasi atau persetujuan wajib dilakukan oleh petugas / admin lain.'
      );
      return;
    }

    // 2. Area Access Check
    if (isApprover && !hasAreaAccess) {
      setError('Anda tidak memiliki otorisasi Area Access untuk area operasional temuan ini.');
      return;
    }

    // 3. Rejection Reason Check
    if (target === 'Rejected' && !rejectionReason.trim()) {
      setError('Alasan penolakan wajib diisi untuk rekam jejak audit keselamatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = safetyService.reviewFinding(
        currentUser,
        finding.id,
        target,
        notes.trim() || undefined,
        target === 'Rejected' ? rejectionReason.trim() : undefined
      );

      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses review temuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Review & Otorisasi Status Temuan
              </h2>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                Ref: {finding.referenceNo} • Status Saat Ini: <strong>{finding.status}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Universal Anti Self-Approval Blocker Banner */}
          {isReporter ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Proteksi Anti Self-Approval Aktif</div>
                <p className="mt-1 leading-relaxed text-amber-800">
                  Anda tercatat sebagai pelapor temuan ini (<strong>{finding.reportedByName} / {finding.reportedByNoreg}</strong>).
                  Sesuai kebijakan tata kelola keselamatan SPLD, tidak ada pengguna (termasuk QSHE Admin) yang diperbolehkan menyetujui laporannya sendiri.
                  Silakan minta Approver terkait atau QSHE Admin lain untuk melakukan evaluasi.
                </p>
              </div>
            </div>
          ) : !hasAreaAccess ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Otorisasi Area Access Terbatas</div>
                <p className="mt-1 leading-relaxed text-red-800">
                  Temuan ini berlokasi di <strong>{finding.operationalAreaName}</strong>, yang berada di luar daftar area operasional yang ditugaskan kepada Anda.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="font-medium">{error}</div>
                </div>
              )}

              {/* Finding Snapshot */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1.5">
                <div className="font-bold text-gray-900">{finding.title}</div>
                <p className="text-gray-600 line-clamp-2 text-[11px]">{finding.description}</p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-500">
                  <span>Pelapor: <strong>{finding.reportedByName} ({finding.reportedByNoreg})</strong></span>
                  <span>•</span>
                  <span>Area: <strong>{finding.operationalAreaName}</strong></span>
                </div>
              </div>

              {/* Status Action Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Pilih Tindakan Status Berikutnya:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Transition from Submitted */}
                  {finding.status === 'Submitted' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Under Review')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'Under Review'
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>Mulai Evaluasi</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          Under Review
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Accepted')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'Accepted'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Terima Temuan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          Accepted
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Rejected')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between sm:col-span-2 ${
                          selectedTarget === 'Rejected'
                            ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                            : 'border-gray-200 hover:border-red-300 hover:bg-gray-50 text-red-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Tolak Laporan (Wajib Alasan)</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Rejected
                        </span>
                      </button>
                    </>
                  )}

                  {/* Transition from Under Review */}
                  {finding.status === 'Under Review' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Accepted')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'Accepted'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Terima Temuan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          Accepted
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Rejected')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'Rejected'
                            ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                            : 'border-gray-200 hover:border-red-300 hover:bg-gray-50 text-red-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Tolak Temuan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Rejected
                        </span>
                      </button>
                    </>
                  )}

                  {/* Transition from Accepted */}
                  {finding.status === 'Accepted' && (
                    <button
                      type="button"
                      onClick={() => setSelectedTarget('In Progress')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between sm:col-span-2 ${
                        selectedTarget === 'In Progress'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span>Mulai Pelaksanaan Tindakan Korektif</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        In Progress
                      </span>
                    </button>
                  )}

                  {/* Transition from In Progress */}
                  {finding.status === 'In Progress' && (
                    <button
                      type="button"
                      onClick={() => setSelectedTarget('Resolved')}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between sm:col-span-2 ${
                        selectedTarget === 'Resolved'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Tindakan Fisik di Lapangan Selesai</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Resolved
                      </span>
                    </button>
                  )}

                  {/* Transition from Resolved */}
                  {finding.status === 'Resolved' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedTarget('Closed')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'Closed'
                            ? 'border-gray-700 bg-gray-900 text-white font-bold'
                            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Verifikasi & Tutup Temuan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 font-semibold">
                          Closed
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTarget('In Progress')}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedTarget === 'In Progress'
                            ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50 text-amber-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          <span>Perlu Perbaikan Tambahan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          In Progress
                        </span>
                      </button>
                    </>
                  )}

                  {/* Closed & Rejected Terminal States */}
                  {(finding.status === 'Closed' || finding.status === 'Rejected') && (
                    <div className="sm:col-span-2 text-center text-gray-500 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      Temuan ini berada dalam status terminal (<strong>{finding.status}</strong>). Tidak ada tindakan review lanjutan yang diperlukan.
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Rejection Reason Input */}
              {selectedTarget === 'Rejected' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-red-50/50 border border-red-200 animate-in fade-in">
                  <label className="block text-xs font-bold text-red-800">
                    Alasan Penolakan Temuan <span className="text-red-500">* (Wajib)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Jelaskan alasan mengapa temuan ini ditolak (misal: bukan hazard, duplikat, area bukan wewenang SPLD)..."
                    className="w-full p-2 border border-red-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                    required
                  />
                  <p className="text-[10px] text-red-600">
                    Alasan ini akan tercatat dalam log jejak audit dan dapat dilihat oleh pelapor.
                  </p>
                </div>
              )}

              {/* Additional Review Notes */}
              {selectedTarget && selectedTarget !== 'Rejected' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Catatan Evaluasi / Instruksi Tindak Lanjut <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan arahan teknis atau catatan untuk pelaksana perbaikan..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Tutup
          </Button>

          {!isReporter && hasAreaAccess && selectedTarget && (
            <Button
              type="button"
              variant={selectedTarget === 'Rejected' ? 'danger' : 'primary'}
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleExecuteReview(selectedTarget)}
            >
              {isSubmitting ? 'Menyimpan...' : `Konfirmasi (${selectedTarget})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

