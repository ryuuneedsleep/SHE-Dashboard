import React, { useState } from 'react';
import type { AuthUser } from '../../types/auth';
import type { SafetyPatrolRecord } from '../../types/safety';
import { masterDataService } from '../../services/masterDataService';
import { safetyService } from '../../services/safetyService';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { SelectField } from '../common/SelectField';
import { X, MapPin, Footprints, AlertCircle, Save } from 'lucide-react';

interface PatrolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patrol: SafetyPatrolRecord) => void;
  currentUser: AuthUser;
}

export const PatrolFormModal: React.FC<PatrolFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const departments = masterDataService.getActiveDepartments();
  const allSections = masterDataService.getActiveSections();
  const operationalAreas = masterDataService.getActiveOperationalAreas();
  const allUsers = authService.getAllUsers().filter((u) => u.status === 'Active');

  // Filter operational areas if current user is APPROVER
  const availableAreas =
    currentUser.role === 'APPROVER'
      ? operationalAreas.filter((a) => (currentUser.areaAccess || []).includes(a.id))
      : operationalAreas;

  const [patrolName, setPatrolName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [sectionId, setSectionId] = useState(allSections[0]?.id || '');
  const [operationalAreaId, setOperationalAreaId] = useState(availableAreas[0]?.id || '');

  const [leaderNoreg, setLeaderNoreg] = useState(currentUser.noreg);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patrolName.trim()) {
      setError('Nama / agenda patroli wajib diisi.');
      return;
    }
    if (!plannedDate) {
      setError('Tanggal jadwal patroli wajib ditentukan.');
      return;
    }
    if (!departmentId || !operationalAreaId) {
      setError('Departemen dan Area Operasional wajib dipilih.');
      return;
    }

    const leader = allUsers.find((u) => u.noreg === leaderNoreg) || currentUser;

    setIsSubmitting(true);
    try {
      const created = safetyService.createPatrol(currentUser, {
        patrolName: patrolName.trim(),
        description: description.trim() || undefined,
        plannedDate,
        departmentId,
        sectionId: sectionId || undefined,
        operationalAreaId,
        leaderNoreg: leader.noreg,
        leaderName: leader.fullName,
      });

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat jadwal patroli.');
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
            <div className="w-8 h-8 rounded-lg bg-[#EB0A1E] text-white flex items-center justify-center font-bold">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Jadwalkan Safety Patrol Baru
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Rencanakan inspeksi keselamatan berkala pada area operasional SPLD
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama / Agenda Patroli <span className="text-red-500">*</span>
            </label>
            <InputField
              label=""
              value={patrolName}
              onChange={(e) => setPatrolName(e.target.value)}
              placeholder="Contoh: Weekly Receiving Dock Safety Audit W45"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tanggal Rencana Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Patrol Leader / Penanggung Jawab <span className="text-red-500">*</span>
              </label>
              <SelectField
                label=""
                value={leaderNoreg}
                onChange={(e) => setLeaderNoreg(e.target.value)}
                options={allUsers.map((u) => ({
                  value: u.noreg,
                  label: `${u.fullName} (${u.role})`,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Departemen <span className="text-red-500">*</span>
              </label>
              <SelectField
                label=""
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  const matching = allSections.filter((s) => s.departmentId === e.target.value);
                  setSectionId(matching[0]?.id || '');
                }}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Seksi <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <SelectField
                label=""
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                options={[
                  { value: '', label: '-- Semua Seksi --' },
                  ...allSections
                    .filter((s) => s.departmentId === departmentId)
                    .map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Area Operasional <span className="text-red-500">*</span>
            </label>
            <SelectField
              label=""
              value={operationalAreaId}
              onChange={(e) => setOperationalAreaId(e.target.value)}
              options={availableAreas.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.location})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan / Arahan Khusus <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruksi khusus untuk tim patroli (fokus 5S, jalur forklift, proteksi kebakaran)..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-[11px] flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span>
              Patroli ini akan otomatis dilengkapi dengan <strong>Checklist Standar 5S & TPS Safety SPLD</strong> (Jalur Pedestrian, APAR/P3K, Sabuk Pengaman Forklift, dan Kestabilan Palet).
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Patroli'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
