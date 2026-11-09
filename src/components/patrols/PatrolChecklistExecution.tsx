import React, { useState } from 'react';
import type { AuthUser } from '../../types/auth';
import type { SafetyPatrolRecord, PatrolChecklistItem, ChecklistItemStatus } from '../../types/safety';
import { safetyService } from '../../services/safetyService';
import { Button } from '../common/Button';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatrolChecklistExecutionProps {
  patrol: SafetyPatrolRecord;
  currentUser: AuthUser;
  onChecklistUpdated: (updatedPatrol: SafetyPatrolRecord) => void;
  onRequestCreateFinding: (checklistItem: PatrolChecklistItem) => void;
}

export const PatrolChecklistExecution: React.FC<PatrolChecklistExecutionProps> = ({
  patrol,
  currentUser,
  onChecklistUpdated,
  onRequestCreateFinding,
}) => {
  const isReadOnly = patrol.status === 'Completed' || patrol.status === 'Cancelled';
  const isApprover = currentUser.role === 'APPROVER';
  const hasAreaAccess =
    !isApprover || (currentUser.areaAccess || []).includes(patrol.operationalAreaId);

  const [observations, setObservations] = useState(patrol.generalObservations || '');
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleUpdateStatus = (item: PatrolChecklistItem, newStatus: ChecklistItemStatus) => {
    if (isReadOnly || !hasAreaAccess) return;
    setError(null);

    try {
      const updated = safetyService.updatePatrolChecklist(
        currentUser,
        patrol.id,
        item.id,
        newStatus,
        item.notes
      );
      onChecklistUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status checklist.');
    }
  };

  const handleCompletePatrol = () => {
    setError(null);
    if (!hasAreaAccess) {
      setError('Anda tidak memiliki otorisasi Area Access untuk menyelesaikan patroli ini.');
      return;
    }

    const uncheckedMandatory = patrol.checklist.filter(
      (c) => c.isMandatory && c.status === 'UNCHECKED'
    );
    if (uncheckedMandatory.length > 0) {
      setError(
        `Tidak dapat menyelesaikan patroli: Masih ada ${uncheckedMandatory.length} item checklist wajib yang belum diverifikasi.`
      );
      return;
    }

    setIsCompleting(true);
    try {
      const updated = safetyService.completePatrol(currentUser, patrol.id, observations);
      onChecklistUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyelesaikan patroli.');
    } finally {
      setIsCompleting(false);
    }
  };

  const uncheckedMandatoryCount = patrol.checklist.filter(
    (c) => c.isMandatory && c.status === 'UNCHECKED'
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>Checklist Inspeksi Keselamatan</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-normal">
              {patrol.checklist.filter((c) => c.status !== 'UNCHECKED').length}/{patrol.checklist.length} Terverifikasi
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Periksa setiap titik observasi. Tandai OK jika sesuai standar, atau NOT OK jika ditemukan bahaya.
          </p>
        </div>

        {!isReadOnly && hasAreaAccess && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCompletePatrol}
            disabled={isCompleting || uncheckedMandatoryCount > 0}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            {isCompleting ? 'Menyimpan...' : 'Selesaikan Patroli'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      {/* Checklist Items List */}
      <div className="space-y-3">
        {patrol.checklist.map((item, idx) => {
          const isNotOk = item.status === 'NOT_OK';
          const hasLinkedFinding = Boolean(item.relatedFindingId);

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isNotOk
                  ? 'border-red-300 bg-red-50/40'
                  : item.status === 'OK'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : item.status === 'NA'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Item Label & Meta */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-gray-400">#{idx + 1}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {item.category}
                    </span>
                    {item.isMandatory && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#EB0A1E]">
                        Wajib
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 leading-relaxed">
                    {item.label}
                  </p>
                </div>

                {/* Status Toggle Buttons */}
                {!isReadOnly && hasAreaAccess ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item, 'OK')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'OK'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item, 'NOT_OK')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                        item.status === 'NOT_OK'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>NOT OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item, 'NA')}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                        item.status === 'NA'
                          ? 'bg-gray-700 text-white border-gray-700 shadow-xs'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>N/A</span>
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${
                      item.status === 'OK'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.status === 'NOT_OK'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.status === 'NA'
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>

              {/* Action when NOT_OK: Create or View Linked Finding */}
              {isNotOk && (
                <div className="mt-3 pt-2.5 border-t border-red-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-red-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Ditemukan ketidaksesuaian standar keselamatan pada titik ini.</span>
                  </div>

                  {hasLinkedFinding ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-300">
                        {item.relatedFindingRefNo}
                      </span>
                      <Link
                        to={`/findings/${item.relatedFindingId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        <span>Lihat Temuan</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : !isReadOnly && hasAreaAccess ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRequestCreateFinding(item)}
                      leftIcon={<PlusCircle className="w-3 h-3" />}
                      className="text-xs h-7 px-2.5"
                    >
                      Buat Temuan dari Item Ini
                    </Button>
                  ) : (
                    <span className="text-[11px] text-gray-500 italic">Belum ada temuan tertaut</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion & Observations Section */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <label className="block text-xs font-semibold text-gray-700">
          Catatan & Kesimpulan Observasi Patroli
        </label>
        <textarea
          rows={3}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={isReadOnly || !hasAreaAccess}
          placeholder="Ringkasan temuan patroli, area kritis yang membutuhkan perhatian, dan rekomendasi perbaikan..."
          className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {!isReadOnly && uncheckedMandatoryCount > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Perhatian: Masih ada <strong>{uncheckedMandatoryCount} item wajib</strong> yang belum diperiksa (UNCHECKED). Selesaikan pemeriksaan sebelum menutup patroli.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
