import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mockFindingService } from '../../services/mock/mockFindingService.ts';
import { findingFormSchema, type FindingFormData } from '../../utils/validation.ts';
import type {
  FindingRecord,
  FindingEvidence,
  DepartmentOption,
  FindingCategory,
  HazardCategory,
  RiskLevel,
  FindingStatus,
} from '../../types/finding.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_LIST,
  HAZARD_CATEGORY_LIST,
  RISK_LEVEL_LIST,
  OPERATIONAL_AREA_LIST,
  FINDING_STATUS_LIST,
} from '../../types/finding.ts';
import { EvidenceUploadField } from '../../components/findings/EvidenceUploadField.tsx';
import {
  ArrowLeft,
  Save,
  User,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export const EditFindingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [finding, setFinding] = useState<FindingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evidences, setEvidences] = useState<FindingEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingFormSchema),
  });

  const selectedDepartment = useWatch({ control, name: 'reporterDepartment' });
  const currentStatus = useWatch({ control, name: 'status' });

  useEffect(() => {
    if (!id) return;
    const fetchFinding = async () => {
      setIsLoading(true);
      try {
        const item = await mockFindingService.getFindingById(id);
        if (item) {
          setFinding(item);
          setEvidences(item.evidences || []);
          reset({
            reporterName: item.reporterName,
            reporterDepartment: item.reporterDepartment,
            otherDepartmentName: item.otherDepartmentName || '',
            reporterSection: item.reporterSection,
            title: item.title,
            description: item.description,
            findingCategory: item.findingCategory,
            hazardCategory: item.hazardCategory || '',
            riskLevel: item.riskLevel,
            findingDate: item.findingDate,
            operationalArea: item.operationalArea,
            locationDetail: item.locationDetail,
            correctiveAction: item.correctiveAction || '',
            dueDate: item.dueDate || '',
            status: item.status,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinding();
  }, [id, reset]);

  const onSubmit = async (data: FindingFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await mockFindingService.updateFinding(id, {
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
        status: (data.status as FindingStatus) || finding?.status || 'OPEN',
        evidences,
      });

      navigate(`/findings/${id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal memperbarui laporan temuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse pb-20">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-xl" />
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
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/findings/${finding.id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Edit Laporan Temuan K3
              </h1>
              <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {finding.referenceNo}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Perbarui rincian laporan atau ubah status tindak lanjut (OPEN, IN PROGRESS, CLOSED)
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
        {/* Status Lifecycle Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <Activity className="w-4 h-4 text-red-600" />
            <span>Status Tindak Lanjut Temuan</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Laporan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {FINDING_STATUS_LIST.map((st) => (
                <label
                  key={st}
                  className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    currentStatus === st
                      ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    value={st}
                    {...register('status')}
                    className="sr-only"
                  />
                  <span>{st.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            {errors.status && (
              <p className="text-[11px] text-red-500 mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Section 1: Reporter Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-red-600" />
            <span>1. Informasi Pelapor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelapor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('reporterName')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.reporterName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.reporterName.message}</p>
              )}
            </div>

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
            </div>

            {selectedDepartment === 'Lain-lain' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Departemen / Instansi Lain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('otherDepartmentName')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.otherDepartmentName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.otherDepartmentName.message}</p>
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section / Area Pelapor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('reporterSection')}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Temuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Temuan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Temuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('findingDate')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detail Lokasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('locationDetail')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.locationDetail && (
                <p className="text-[11px] text-red-500 mt-1">{errors.locationDetail.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Corrective Action */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>4. Rencana Tindakan Perbaikan</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rencana Tindakan Perbaikan
              </label>
              <textarea
                rows={2}
                {...register('correctiveAction')}
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

        {/* Section 5: Evidence Upload */}
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
            onClick={() => navigate(`/findings/${finding.id}`)}
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
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
