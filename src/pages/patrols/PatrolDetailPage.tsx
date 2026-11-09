import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';
import type { PatrolChecklistItem, SafetyPatrolRecord } from '../../types/safety';
import { PatrolChecklistExecution } from '../../components/patrols/PatrolChecklistExecution';
import { FindingFormModal } from '../../components/findings/FindingFormModal';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  Users,
  AlertTriangle,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Ban,
} from 'lucide-react';

export const PatrolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [patrol, setPatrol] = useState<SafetyPatrolRecord | undefined>(() => {
    return id ? safetyService.getPatrolById(id) : undefined;
  });

  const [selectedChecklistItem, setSelectedChecklistItem] = useState<PatrolChecklistItem | null>(null);
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!currentUser) {
    navigate('/login', { replace: true });
    return null;
  }

  if (!patrol) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xs border border-gray-200 p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Agenda Patroli Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">
            Agenda inspeksi dengan ID <span className="font-mono">{id}</span> tidak ditemukan atau telah dihapus.
          </p>
          <Button variant="secondary" onClick={() => navigate('/patrols')} className="w-full">
            Kembali ke Daftar Patroli
          </Button>
        </div>
      </div>
    );
  }

  // Check Area Access for Approvers
  const isApprover = currentUser.role === 'APPROVER';
  const hasAreaAccess =
    !isApprover || (currentUser.areaAccess || []).includes(patrol.operationalAreaId);

  // Fetch all findings linked to this patrol
  const allFindings = safetyService.getAllFindings();
  const linkedFindings = allFindings.filter(
    (f) => f.patrolId === patrol.id || patrol.relatedFindingIds.includes(f.id)
  );

  const handlePatrolUpdated = (updated: SafetyPatrolRecord) => {
    setPatrol(updated);
  };

  const handleOpenFindingModal = (item: PatrolChecklistItem) => {
    setSelectedChecklistItem(item);
    setIsFindingModalOpen(true);
  };

  const handleFindingCreated = () => {
    // Refresh patrol and findings from service
    const refreshed = safetyService.getPatrolById(patrol.id);
    if (refreshed) {
      setPatrol({ ...refreshed });
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi.');
      return;
    }
    setCancelError(null);

    try {
      const cancelled = safetyService.cancelPatrol(currentUser, patrol.id, cancelReason);
      setPatrol(cancelled);
      setIsCancelModalOpen(false);
      setCancelReason('');
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Gagal membatalkan patroli.');
    }
  };

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (patrol.status) {
      case 'Planned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Planned</span>
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>Assigned</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>In Progress</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="w-3.5 h-3.5 text-gray-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const okCount = patrol.checklist.filter((c) => c.status === 'OK').length;
  const notOkCount = patrol.checklist.filter((c) => c.status === 'NOT_OK').length;
  const naCount = patrol.checklist.filter((c) => c.status === 'NA').length;
  const verifiedCount = okCount + notOkCount + naCount;
  const totalChecklist = patrol.checklist.length;
  const progressPercent = totalChecklist > 0 ? Math.round((verifiedCount / totalChecklist) * 100) : 0;

  const canCancel =
    (currentUser.role === 'QSHE_ADMIN' || (currentUser.role === 'APPROVER' && hasAreaAccess)) &&
    patrol.status !== 'Completed' &&
    patrol.status !== 'Cancelled';

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/patrols"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#EB0A1E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Safety Patrol</span>
          </Link>
        </div>

        {/* Warning if Approver lacks Area Access */}
        {!hasAreaAccess && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Akses Terbatas (Di Luar Cakupan Area):</div>
              <p className="mt-0.5">
                Patroli ini berlangsung di area <span className="font-semibold">{patrol.operationalAreaName}</span> yang tidak terdaftar dalam penugasan Area Access Anda. Halaman ini ditampilkan dalam mode baca saja (read-only).
              </p>
            </div>
          </div>
        )}

        {/* Main Header Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {patrol.referenceNo}
                </span>
                {renderStatusBadge()}
                <span className="text-xs bg-red-50 text-[#EB0A1E] font-semibold px-2 py-0.5 rounded-full border border-red-100">
                  {patrol.operationalAreaName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {patrol.patrolName}
              </h1>
              {patrol.description && (
                <p className="text-xs sm:text-sm text-gray-600 max-w-3xl">{patrol.description}</p>
              )}
            </div>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1.5 self-start"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Batalkan Patroli</span>
              </Button>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Tanggal Rencana</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 mt-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{patrol.plannedDate}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block font-medium">Departemen</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 mt-1">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span>{patrol.departmentName}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block font-medium">Patrol Leader</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 mt-1">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span className="truncate">{patrol.leaderName}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block font-medium">Tim Pelaksana</span>
              <div className="flex items-center gap-1.5 font-semibold text-gray-800 mt-1">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span>{patrol.assignedTeam.length} Personil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 spans): Interactive Checklist */}
          <div className="lg:col-span-2 space-y-6">
            <PatrolChecklistExecution
              patrol={patrol}
              currentUser={currentUser}
              onChecklistUpdated={handlePatrolUpdated}
              onRequestCreateFinding={handleOpenFindingModal}
            />
          </div>

          {/* Right Column (1 span): Inspection Stats & Linked Findings */}
          <div className="space-y-6">
            {/* Verification Progress Card */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center justify-between">
                <span>Kemajuan Inspeksi</span>
                <span className="font-mono text-xs text-[#EB0A1E] font-bold">{progressPercent}%</span>
              </h3>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#EB0A1E] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <div className="text-[10px] text-emerald-700 font-medium">OK</div>
                  <div className="text-base font-bold text-emerald-800">{okCount}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="text-[10px] text-red-700 font-medium">NOT OK</div>
                  <div className="text-base font-bold text-red-800">{notOkCount}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-[10px] text-gray-600 font-medium">N/A</div>
                  <div className="text-base font-bold text-gray-800">{naCount}</div>
                </div>
              </div>

              {patrol.conductedDate && (
                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
                  <span>Waktu Selesai:</span>
                  <span className="font-mono text-gray-700 font-medium">
                    {new Date(patrol.conductedDate).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Linked Findings Card */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#EB0A1E]" />
                  <span>Temuan Terkait Patroli</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#EB0A1E] font-bold">
                  {linkedFindings.length}
                </span>
              </div>

              {linkedFindings.length === 0 ? (
                <div className="text-center py-6 text-gray-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-600">Belum Ada Temuan Tercatat</p>
                  <p className="text-[11px] text-gray-400">
                    Item checklist yang ditandai NOT OK dapat langsung diajukan sebagai temuan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedFindings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/50 space-y-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/findings/${f.id}`}
                          className="font-mono text-xs font-bold text-[#EB0A1E] hover:underline flex items-center gap-1"
                        >
                          <span>{f.referenceNo}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold"
                          style={{ backgroundColor: f.riskDisplayColor || '#EF4444' }}
                        >
                          {f.riskLevelName}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-gray-900 line-clamp-1">{f.title}</div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200/60">
                        <span>Status: <strong className="text-gray-700">{f.status}</strong></span>
                        <span>{f.reportedByName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Observations (if completed) */}
            {patrol.generalObservations && (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-2">
                <h4 className="text-xs font-bold text-gray-700">Catatan & Observasi Umum</h4>
                <p className="text-xs text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {patrol.generalObservations}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Finding from Checklist Item */}
        {selectedChecklistItem && (
          <FindingFormModal
            isOpen={isFindingModalOpen}
            onClose={() => {
              setIsFindingModalOpen(false);
              setSelectedChecklistItem(null);
            }}
            onSuccess={() => {
              handleFindingCreated();
              setIsFindingModalOpen(false);
              setSelectedChecklistItem(null);
            }}
            currentUser={currentUser}
            source="PATROL"
            patrol={patrol}
            checklistItemId={selectedChecklistItem.id}
            checklistItemLabel={selectedChecklistItem.label}
          />
        )}

        {/* Modal: Cancel Patrol */}
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base border-b border-gray-100 pb-3">
                <Ban className="w-5 h-5" />
                <span>Konfirmasi Pembatalan Patroli</span>
              </div>

              <p className="text-xs text-gray-600">
                Apakah Anda yakin ingin membatalkan agenda patroli{' '}
                <strong className="text-gray-900 font-mono">{patrol.referenceNo}</strong>?
                Tindakan ini akan tercatat dalam audit log dan tidak dapat diubah kembali.
              </p>

              {cancelError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  {cancelError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Operasi gudang ditutup sementara untuk maintenance overhaul..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#EB0A1E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="secondary" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmCancel}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Batalkan Agenda
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
