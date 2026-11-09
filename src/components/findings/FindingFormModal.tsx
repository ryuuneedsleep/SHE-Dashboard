import React, { useState } from 'react';
import type { AuthUser } from '../../types/auth';
import type {
  FindingSource,
  FindingEvidence,
  SafetyFindingRecord,
  SafetyPatrolRecord,
} from '../../types/safety';
import { masterDataService } from '../../services/masterDataService';
import { safetyService } from '../../services/safetyService';
import { EvidenceUploadField } from './EvidenceUploadField';
import { Button } from '../common/Button';
import { InputField } from '../common/InputField';
import { SelectField } from '../common/SelectField';
import {
  X,
  Send,
  AlertTriangle,
  User,
  Shield,
  Layers,
  MapPin,
  ClipboardList,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

interface FindingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (finding: SafetyFindingRecord) => void;
  currentUser: AuthUser;
  source: FindingSource;
  patrol?: SafetyPatrolRecord | null;
  checklistItemId?: string | null;
  checklistItemLabel?: string | null;
}

export const FindingFormModal: React.FC<FindingFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  source,
  patrol,
  checklistItemId,
  checklistItemLabel,
}) => {
  // Master data sources
  const departments = masterDataService.getActiveDepartments();
  const allSections = masterDataService.getActiveSections();
  const operationalAreas = masterDataService.getActiveOperationalAreas();
  const findingCategories = masterDataService.getActiveFindingCategories();
  const hazardCategories = masterDataService.getActiveHazardCategories();
  const riskLevels = masterDataService.getActiveRiskLevels();
  const incidentTypes = masterDataService.getActiveIncidentTypes();

  // Form states
  const [title, setTitle] = useState(
    checklistItemLabel ? `[Temuan Patroli] ${checklistItemLabel}` : ''
  );
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(
    patrol?.departmentId || departments[0]?.id || ''
  );
  const [sectionId, setSectionId] = useState(
    patrol?.sectionId || allSections.find((s) => s.departmentId === departmentId)?.id || ''
  );
  const [operationalAreaId, setOperationalAreaId] = useState(
    patrol?.operationalAreaId || operationalAreas[0]?.id || ''
  );
  const [locationDetails, setLocationDetails] = useState('');

  const [categoryId, setCategoryId] = useState(findingCategories[0]?.id || '');
  const [hazardCategoryId, setHazardCategoryId] = useState(hazardCategories[0]?.id || '');
  const [riskLevelId, setRiskLevelId] = useState(riskLevels[0]?.id || '');
  const [incidentTypeId, setIncidentTypeId] = useState('');

  const [evidence, setEvidence] = useState<FindingEvidence | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter sections when department changes
  const filteredSections = allSections.filter((s) => s.departmentId === departmentId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Judul temuan wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi observasi bahaya wajib diisi.');
      return;
    }
    if (!departmentId) {
      setError('Pilih departemen terkait.');
      return;
    }
    if (!sectionId) {
      setError('Pilih seksi / area kerja.');
      return;
    }
    if (!operationalAreaId) {
      setError('Pilih area operasional kejadian.');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori temuan keselamatan.');
      return;
    }
    if (!riskLevelId) {
      setError('Tentukan tingkat risiko.');
      return;
    }

    setIsSubmitting(true);
    try {
      let created: SafetyFindingRecord;

      if (source === 'PATROL') {
        if (!patrol) {
          throw new Error('Data patroli asal tidak valid.');
        }
        created = safetyService.createPatrolFinding(currentUser, {
          title: title.trim(),
          description: description.trim(),
          departmentId,
          sectionId,
          operationalAreaId,
          locationDetails: locationDetails.trim() || undefined,
          categoryId,
          hazardCategoryId: hazardCategoryId || undefined,
          riskLevelId,
          incidentTypeId: incidentTypeId || undefined,
          evidence,
          patrolId: patrol.id,
          checklistItemId: checklistItemId || undefined,
        });
      } else {
        // DIRECT FINDING
        created = safetyService.createDirectFinding(currentUser, {
          title: title.trim(),
          description: description.trim(),
          departmentId,
          sectionId,
          operationalAreaId,
          locationDetails: locationDetails.trim() || undefined,
          categoryId,
          hazardCategoryId: hazardCategoryId || undefined,
          riskLevelId,
          incidentTypeId: incidentTypeId || undefined,
          evidence,
        });
      }

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim laporan temuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRisk = riskLevels.find((r) => r.id === riskLevelId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EB0A1E] text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {source === 'DIRECT' ? 'Formulir Pelaporan Temuan Langsung' : 'Catat Temuan dari Patroli'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    source === 'DIRECT'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Jalur: {source === 'DIRECT' ? 'Direct Finding' : 'Patrol Finding'}
                </span>
                {patrol && (
                  <span className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                    <LinkIcon className="w-3 h-3 text-amber-600" />
                    <span>Patrol #{patrol.referenceNo}</span>
                  </span>
                )}
              </div>
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

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Gagal Menyimpan Laporan</div>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Section 1: Reporter Information (Locked from Session) */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
            <div className="flex items-center justify-between text-gray-500 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#EB0A1E]" />
                <span>Identitas Pelapor (Terkunci Sesuai Akun Login)</span>
              </div>
              <span className="text-[10px] bg-gray-200/70 text-gray-700 px-1.5 py-0.5 rounded">
                Anti-Impersonation
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium text-gray-900">
              <div>
                <span className="text-gray-400 block text-[10px]">Nama Lengkap:</span>
                <span className="font-bold">{currentUser.fullName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Noreg (NPK):</span>
                <span className="font-mono font-bold">{currentUser.noreg}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Departemen:</span>
                <span>{currentUser.department}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Finding Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide border-b border-gray-100 pb-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Detail Temuan Bahaya</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Judul Temuan <span className="text-red-500">*</span>
              </label>
              <InputField
                label=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tumpahan oli di area picking, palet miring, kabel terkelupas..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Deskripsi Observasi Kondisi / Tindakan Tidak Aman <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara detail potensi bahaya, aktivitas terkait, dan dampaknya jika tidak ditindaklanjuti..."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
                required
              />
            </div>
          </div>

          {/* Section 3: Location (Master Data) */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide border-b border-gray-100 pb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Lokasi & Area Operasional (Master Data)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Departemen <span className="text-red-500">*</span>
                </label>
                <SelectField
                  label=""
                  value={departmentId}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    setDepartmentId(nextDept);
                    const matching = allSections.filter((s) => s.departmentId === nextDept);
                    setSectionId(matching[0]?.id || '');
                  }}
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Seksi / Area Kerja <span className="text-red-500">*</span>
                </label>
                <SelectField
                  label=""
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  options={
                    filteredSections.length
                      ? filteredSections.map((s) => ({ value: s.id, label: s.name }))
                      : [{ value: '', label: 'Tidak ada seksi terdaftar' }]
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Area Operasional (Area Access) <span className="text-red-500">*</span>
                </label>
                <SelectField
                  label=""
                  value={operationalAreaId}
                  onChange={(e) => setOperationalAreaId(e.target.value)}
                  options={operationalAreas.map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.location})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Detail Lokasi Spesifik <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <InputField
                  label=""
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  placeholder="Misal: Lorong B-04, Rak Level 2, Dock 08"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Classification & Risk (Master Data) */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide border-b border-gray-100 pb-1.5">
              <Shield className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Klasifikasi Bahaya & Tingkat Risiko</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kategori Temuan <span className="text-red-500">*</span>
                </label>
                <SelectField
                  label=""
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={findingCategories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kategori Bahaya (Hazard) <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <SelectField
                  label=""
                  value={hazardCategoryId}
                  onChange={(e) => setHazardCategoryId(e.target.value)}
                  options={[
                    { value: '', label: '-- Pilih Kategori Bahaya --' },
                    ...hazardCategories.map((h) => ({ value: h.id, label: h.name })),
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tingkat Risiko (Risk Level) <span className="text-red-500">*</span>
                </label>
                <SelectField
                  label=""
                  value={riskLevelId}
                  onChange={(e) => setRiskLevelId(e.target.value)}
                  options={riskLevels.map((r) => ({ value: r.id, label: r.name }))}
                />
                {selectedRisk && 'displayColor' in selectedRisk && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: selectedRisk.displayColor as string }}
                    />
                    <span>Prioritas Respon: <strong>{selectedRisk.name}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tipe Insiden / Near Miss <span className="text-gray-400 font-normal">(Jika ada dampak)</span>
                </label>
                <SelectField
                  label=""
                  value={incidentTypeId}
                  onChange={(e) => setIncidentTypeId(e.target.value)}
                  options={[
                    { value: '', label: '-- Tidak Terjadi Insiden Fisik --' },
                    ...incidentTypes.map((it) => ({ value: it.id, label: it.name })),
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Evidence Photo */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide border-b border-gray-100 pb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#EB0A1E]" />
              <span>Bukti Dokumentasi Visual</span>
            </h3>
            <EvidenceUploadField evidence={evidence} onChange={setEvidence} disabled={isSubmitting} />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Temuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
