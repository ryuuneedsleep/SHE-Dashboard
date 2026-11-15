import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mockFindingService } from '../../services/mock/mockFindingService.ts';
import { findingFormSchema, type FindingFormData } from '../../utils/validation.ts';
import type { FindingEvidence, DepartmentOption, FindingCategory, HazardCategory, RiskLevel } from '../../types/finding.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_LIST,
  HAZARD_CATEGORY_LIST,
  RISK_LEVEL_LIST,
  OPERATIONAL_AREA_LIST,
} from '../../types/finding.ts';
import { EvidenceUploadField } from '../../components/findings/EvidenceUploadField.tsx';
import {
  ArrowLeft,
  Save,
  User,
  AlertTriangle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const CreateFindingPage: React.FC = () => {
  const navigate = useNavigate();
  const [evidences, setEvidences] = useState<FindingEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingFormSchema),
    defaultValues: {
      findingDate: todayStr,
      reporterName: '',
      reporterDepartment: 'Warehouse',
      otherDepartmentName: '',
      reporterSection: '',
      title: '',
      description: '',
      findingCategory: 'Unsafe Condition',
      hazardCategory: 'Physical',
      riskLevel: 'Medium',
      operationalArea: 'Warehouse Area A',
      locationDetail: '',
      correctiveAction: '',
      dueDate: '',
    },
  });

  const selectedDepartment = useWatch({ control, name: 'reporterDepartment' });

  const onSubmit = async (data: FindingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await mockFindingService.createFinding({
        title: data.title,
        description: data.description,
        findingCategory: data.findingCategory as FindingCategory,
        hazardCategory: (data.hazardCategory as HazardCategory) || undefined,
        riskLevel: data.riskLevel as RiskLevel,
        findingDate: data.findingDate,
        reporterName: data.reporterName,
        reporterDepartment: data.reporterDepartment as DepartmentOption,
        otherDepartmentName: data.otherDepartmentName || undefined,
        reporterSection: data.reporterSection,
        operationalArea: data.operationalArea,
        locationDetail: data.locationDetail,
        correctiveAction: data.correctiveAction || undefined,
        dueDate: data.dueDate || undefined,
        evidences,
      });

      navigate(`/findings/${created.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/findings')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Buat Laporan Temuan K3
            </h1>
            <p className="text-xs text-slate-500">
              Formulir pelaporan bahaya keselamatan kerja (Status awal otomatis OPEN)
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Reporter Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-red-600" />
            <span>1. Informasi Pelapor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reporter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelapor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('reporterName')}
                placeholder="Nama lengkap pelapor"
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.reporterName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.reporterName.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen Pelapor <span className="text-red-500">*</span>
              </label>
              <select
                {...register('reporterDepartment')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {DEPARTMENT_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.reporterDepartment && (
                <p className="text-[11px] text-red-500 mt-1">{errors.reporterDepartment.message}</p>
              )}
            </div>

            {/* Other Department Name (if Lain-lain) */}
            {selectedDepartment === 'Lain-lain' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Departemen / Instansi Lain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('otherDepartmentName')}
                  placeholder="Sebutkan nama divisi / departemen / vendor..."
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.otherDepartmentName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.otherDepartmentName.message}</p>
                )}
              </div>
            )}

            {/* Reporter Section / Area */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section / Area Pelapor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('reporterSection')}
                placeholder="Contoh: Inbound Storage Section, Line 3 Unit"
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.reporterSection && (
                <p className="text-[11px] text-red-500 mt-1">{errors.reporterSection.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Finding Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>2. Informasi Temuan</span>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Temuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="Ringkasan temuan bahaya..."
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Temuan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Jelaskan kondisi atau tindakan tidak aman secara spesifik..."
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Finding Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Temuan <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('findingCategory')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {FINDING_CATEGORY_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.findingCategory && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.findingCategory.message}</p>
                )}
              </div>

              {/* Hazard Category (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Bahaya (Opsional)
                </label>
                <select
                  {...register('hazardCategory')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="">Pilih Kategori Bahaya</option>
                  {HAZARD_CATEGORY_LIST.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Risiko <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('riskLevel')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {RISK_LEVEL_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.riskLevel && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.riskLevel.message}</p>
                )}
              </div>

              {/* Finding Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Temuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('findingDate')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.findingDate && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.findingDate.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>3. Lokasi Temuan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Operational Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Area Operasional <span className="text-red-500">*</span>
              </label>
              <select
                {...register('operationalArea')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {OPERATIONAL_AREA_LIST.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.operationalArea && (
                <p className="text-[11px] text-red-500 mt-1">{errors.operationalArea.message}</p>
              )}
            </div>

            {/* Location Detail */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detail Lokasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('locationDetail')}
                placeholder="Contoh: Lorong B2 Rak 3, Stasiun Las 02"
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.locationDetail && (
                <p className="text-[11px] text-red-500 mt-1">{errors.locationDetail.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Corrective Action (Optional) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>4. Rencana Tindakan Perbaikan (Opsional)</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rencana Tindakan Perbaikan
              </label>
              <textarea
                rows={2}
                {...register('correctiveAction')}
                placeholder="Tindakan yang perlu dilakukan untuk menghilangkan bahaya..."
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Selesai (Due Date)
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Evidence Upload (Max 3 Photos) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <EvidenceUploadField
            evidences={evidences}
            onChange={setEvidences}
            maxFiles={3}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/findings')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition hover:shadow flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Laporan Temuan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
