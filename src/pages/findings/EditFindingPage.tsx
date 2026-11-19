import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { findingService } from '../../services/findingService.ts';
import { findingFormSchema, type FindingFormData } from '../../utils/validation.ts';
import type {
  FindingRecord,
  FindingEvidence,
  DepartmentOption,
  FindingCategory,
  HazardCategory,
  RiskLevel,
} from '../../types/finding.ts';
import {
  DEPARTMENT_LIST,
  FINDING_CATEGORY_OPTIONS,
  HAZARD_CATEGORY_OPTIONS,
  RISK_LEVEL_OPTIONS,
  OPERATIONAL_AREA_LIST,
} from '../../types/finding.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  ArrowLeft,
  Save,
  User,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  FileText,
  Check,
  Trash2,
  Camera,
  ZoomIn,
  X,
  Loader2,
} from 'lucide-react';

function toCategoryEnum(val?: string): FindingCategory {
  if (!val) return 'UNSAFE_CONDITION';
  const clean = val.replace(/[\s-]/g, '_').toUpperCase();
  if (clean.includes('ACTION')) return 'UNSAFE_ACTION';
  if (clean.includes('IMPROVEMENT') || clean.includes('OPPORTUNITY')) return 'IMPROVEMENT_OPPORTUNITY';
  return 'UNSAFE_CONDITION';
}

function toHazardEnum(val?: string): HazardCategory | '' {
  if (!val) return '';
  const clean = val.replace(/[\s-]/g, '_').toUpperCase();
  if (['PHYSICAL', 'CHEMICAL', 'BIOLOGICAL', 'ERGONOMIC', 'ENVIRONMENTAL'].includes(clean)) {
    return clean as HazardCategory;
  }
  return '';
}

function toRiskEnum(val?: string): RiskLevel {
  if (!val) return 'LOW';
  const clean = val.replace(/[\s-]/g, '_').toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(clean)) {
    return clean as RiskLevel;
  }
  return 'LOW';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const EditFindingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [finding, setFinding] = useState<FindingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Evidence management state
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceUploadStatus, setEvidenceUploadStatus] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceSuccess, setEvidenceSuccess] = useState<string | null>(null);
  const [evidenceToDelete, setEvidenceToDelete] = useState<FindingEvidence | null>(null);
  const [isDeletingEvidence, setIsDeletingEvidence] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const evidenceFileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleEvidenceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidenceError(null);
    setEvidenceSuccess(null);
    const files = e.target.files;
    if (!files || files.length === 0 || !finding) return;

    const file = files[0];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setEvidenceError('Format file tidak didukung. Harap pilih gambar dengan format JPG, PNG, atau WEBP.');
      if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setEvidenceError(`Ukuran file terlalu besar (${formatBytes(file.size)}). Batas maksimum per foto adalah 5 MB.`);
      if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = '';
      return;
    }

    if (finding.evidences && finding.evidences.length >= 3) {
      setEvidenceError('Laporan sudah memiliki batas maksimum 3 foto bukti.');
      if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = '';
      return;
    }

    setIsUploadingEvidence(true);
    setEvidenceUploadStatus('Mengunggah foto bukti ke penyimpanan aman...');

    try {
      const updatedEvidence = await findingService.uploadEvidence(finding.id, file);

      setFinding((prev) => {
        if (!prev) return prev;
        const currentList = prev.evidences || [];
        return {
          ...prev,
          evidences: [...currentList, updatedEvidence],
        };
      });

      setEvidenceSuccess('Foto bukti berhasil diunggah.');
      setTimeout(() => setEvidenceSuccess(null), 3000);
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : 'Gagal mengunggah foto bukti.');
    } finally {
      setIsUploadingEvidence(false);
      setEvidenceUploadStatus(null);
      if (evidenceFileInputRef.current) evidenceFileInputRef.current.value = '';
    }
  };

  const handleConfirmDeleteEvidence = async () => {
    if (!evidenceToDelete || !finding) return;
    setIsDeletingEvidence(true);
    setEvidenceError(null);
    setEvidenceSuccess(null);

    try {
      await findingService.deleteEvidence(finding.id, evidenceToDelete.id);

      setFinding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          evidences: (prev.evidences || []).filter((ev) => ev.id !== evidenceToDelete.id),
        };
      });

      setEvidenceToDelete(null);
      setEvidenceSuccess('Foto bukti berhasil dihapus.');
      setTimeout(() => setEvidenceSuccess(null), 3000);
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : 'Gagal menghapus foto bukti.');
    } finally {
      setIsDeletingEvidence(false);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingFormSchema),
    defaultValues: {
      reporterName: '',
      reporterDepartment: 'Warehouse',
      otherDepartmentName: '',
      reporterSection: '',
      title: '',
      description: '',
      findingCategory: 'Unsafe Condition',
      hazardCategory: 'Physical',
      riskLevel: 'Medium',
      findingDate: '',
      operationalArea: '',
      locationDetail: '',
      correctiveAction: '',
      dueDate: '',
    },
  });

  const selectedDepartment = useWatch({ control, name: 'reporterDepartment' });

  useEffect(() => {
    if (!id) return;
    let active = true;

    const fetchFinding = async () => {
      try {
        const item = await findingService.getFindingById(id);
        if (!active) return;
        if (item) {
          setFinding(item);
          reset({
            reporterName: item.reporterName || '',
            reporterDepartment: (item.reporterDepartment as DepartmentOption) || 'Warehouse',
            otherDepartmentName: item.otherDepartmentName || '',
            reporterSection: item.reporterSection || '',
            title: item.title || '',
            description: item.description || '',
            findingCategory: toCategoryEnum(item.findingCategory),
            hazardCategory: toHazardEnum(item.hazardCategory),
            riskLevel: toRiskEnum(item.riskLevel),
            findingDate: item.findingDate ? item.findingDate.split('T')[0] : '',
            operationalArea: item.operationalArea || '',
            locationDetail: item.locationDetail || '',
            correctiveAction: item.correctiveAction || '',
            dueDate: item.dueDate ? item.dueDate.split('T')[0] : '',
          });
        }
      } catch (err) {
        if (active) {
          setSubmitError(err instanceof Error ? err.message : 'Gagal mengambil data temuan.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchFinding();

    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data: FindingFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const otherDept =
        data.reporterDepartment === 'Lain-lain'
          ? data.otherDepartmentName?.trim() || null
          : null;

      await findingService.updateFinding(id, {
        title: data.title.trim(),
        description: data.description.trim(),
        findingCategory: data.findingCategory as FindingCategory,
        hazardCategory: (data.hazardCategory as HazardCategory) || undefined,
        riskLevel: data.riskLevel as RiskLevel,
        findingDate: data.findingDate,
        reporterName: data.reporterName.trim(),
        reporterDepartment: data.reporterDepartment as DepartmentOption,
        otherDepartmentName: otherDept || undefined,
        reporterSection: data.reporterSection.trim(),
        operationalArea: data.operationalArea,
        locationDetail: data.locationDetail.trim(),
        correctiveAction: data.correctiveAction?.trim() || undefined,
        dueDate: data.dueDate?.trim() || undefined,
      });

      // Verify persistence from Neon database
      const refreshed = await findingService.getFindingById(id);
      if (refreshed) {
        setFinding(refreshed);
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate(`/findings/${id}`);
      }, 700);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal memperbarui laporan temuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/findings/${finding.id}`)}
            className="p-1.5 rounded-[4px] border border-[#E5E7EB] bg-white text-[#666666] hover:text-[#000000] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#000000] tracking-tight">
                Edit Laporan Temuan K3
              </h1>
              <span className="font-mono text-xs font-bold text-[#9E2638] bg-[#F8EDEF] px-2 py-0.5 rounded-[4px] border border-[#F8EDEF]">
                {finding.referenceNo}
              </span>
            </div>
            <p className="text-xs text-[#666666]">
              Perbarui rincian laporan kondisi berbahaya, tindakan tidak aman, atau usulan perbaikan
            </p>
          </div>
        </div>

        {/* Read-Only Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-[#666666] font-medium">Status:</span>
          <StatusBadge status={finding.status} size="sm" />
        </div>
      </div>

      {/* Read-only Status Notice */}
      <div className="p-3 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[4px] text-[11px] text-[#666666] flex items-center justify-between">
        <span>
          Status laporan saat ini: <strong className="text-[#000000]">{finding.status}</strong>. Status dikelola secara aman melalui tombol <strong>Ubah Status</strong> pada halaman Detail Temuan.
        </span>
      </div>

      {submitError && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{submitError}</span>
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] text-[#15803D] text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-[#16A34A]" />
          <span>Perubahan temuan berhasil disimpan. Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Reporter Information */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <User className="w-4 h-4 text-[#9E2638]" />
            <span>1. Informasi Pelapor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Nama Pelapor <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                {...register('reporterName')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
              {errors.reporterName && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.reporterName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Departemen Pelapor <span className="text-[#DC2626]">*</span>
              </label>
              <select
                {...register('reporterDepartment')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
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
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Nama Departemen / Instansi Lain <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Sebutkan nama departemen atau instansi luar..."
                  {...register('otherDepartmentName')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.otherDepartmentName && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.otherDepartmentName.message}</p>
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Section / Area Pelapor <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                {...register('reporterSection')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
              {errors.reporterSection && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.reporterSection.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Finding Information */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <AlertTriangle className="w-4 h-4 text-[#9E2638]" />
            <span>2. Informasi Temuan</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Judul Temuan <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
              {errors.title && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Deskripsi Temuan <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
              {errors.description && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Kategori Temuan <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  {...register('findingCategory')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                >
                  {FINDING_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.findingCategory && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.findingCategory.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Kategori Bahaya (Opsional)
                </label>
                <select
                  {...register('hazardCategory')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                >
                  <option value="">Pilih Kategori Bahaya</option>
                  {HAZARD_CATEGORY_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Tingkat Risiko <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  {...register('riskLevel')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                >
                  {RISK_LEVEL_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.riskLevel && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.riskLevel.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Tanggal Temuan <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  {...register('findingDate')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.findingDate && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.findingDate.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <MapPin className="w-4 h-4 text-[#9E2638]" />
            <span>3. Lokasi Temuan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Area Operasional <span className="text-[#DC2626]">*</span>
              </label>
              <select
                {...register('operationalArea')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              >
                {OPERATIONAL_AREA_LIST.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.operationalArea && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.operationalArea.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Detail Lokasi <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                {...register('locationDetail')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
              {errors.locationDetail && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.locationDetail.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Corrective Action */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>4. Rencana Tindakan Perbaikan</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Rencana Tindakan Perbaikan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Rencana tindakan perbaikan atau instruksi pengendalian bahaya..."
                {...register('correctiveAction')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1">
                Target Selesai / Due Date (Opsional)
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Evidence Documentation & Management */}
        <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
            <FileText className="w-4 h-4 text-[#9E2638]" />
            <span>5. Dokumentasi Foto Bukti ({finding.evidences?.length || 0}/3)</span>
          </div>

          {/* Hidden File Input for Direct Add */}
          <input
            ref={evidenceFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleEvidenceFileSelected}
            className="hidden"
            disabled={isUploadingEvidence || isSubmitting}
          />

          {evidenceError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{evidenceError}</span>
            </div>
          )}

          {evidenceSuccess && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] text-[#15803D] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{evidenceSuccess}</span>
            </div>
          )}

          {isUploadingEvidence && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] text-[#1D4ED8] text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#2563EB]" />
              <span>{evidenceUploadStatus || 'Mengunggah foto bukti...'}</span>
            </div>
          )}

          {/* Gallery & Add Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {finding.evidences?.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="group relative bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-xs hover:border-[#D1D5DB] transition-colors"
              >
                <div className="relative aspect-video w-full bg-[#F7F8FA] overflow-hidden">
                  <img
                    src={ev.url}
                    alt={ev.fileName}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />

                  {/* Actions overlay */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomedImage(ev.url)}
                      className="p-1 rounded-[4px] bg-white text-[#333333] hover:text-[#2563EB] hover:bg-[#EFF6FF] border border-[#E5E7EB] shadow-xs transition-colors cursor-pointer"
                      title="Perbesar foto"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvidenceToDelete(ev)}
                      disabled={isDeletingEvidence}
                      className="p-1 rounded-[4px] bg-white text-[#333333] hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-[#E5E7EB] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 text-xs">
                  <p className="font-semibold text-[#000000] truncate" title={ev.fileName}>
                    {ev.fileName}
                  </p>
                  <p className="text-[10px] text-[#666666] mt-0.5">
                    {formatBytes(ev.fileSize || 0)} &bull; {ev.fileType || 'Image'}
                  </p>
                </div>
              </div>
            ))}

            {/* Add Photo Button (if < 3) */}
            {(!finding.evidences || finding.evidences.length < 3) && (
              <button
                type="button"
                onClick={() => evidenceFileInputRef.current?.click()}
                disabled={isUploadingEvidence || isSubmitting}
                className="min-h-[140px] border-2 border-dashed border-[#E5E7EB] hover:border-[#9E2638] bg-white hover:bg-[#F8EDEF]/30 rounded-[6px] p-4 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer group disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] group-hover:border-[#9E2638] group-hover:bg-[#F8EDEF] flex items-center justify-center text-[#666666] group-hover:text-[#9E2638] transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#333333] group-hover:text-[#9E2638]">
                  Tambah Foto Bukti
                </span>
                <span className="text-[10px] text-[#666666] text-center">
                  Maks. 5 MB (JPG, PNG, WEBP)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/findings/${finding.id}`)}
            className="px-4 py-2.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] text-[#333333] text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-[4px] bg-[#9E2638] hover:bg-[#7F1F2E] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>

      {/* Delete Evidence Confirmation Modal */}
      {evidenceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-sm w-full p-6 space-y-4 shadow-md border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-[#000000] font-bold text-sm">
                <Trash2 className="w-4 h-4 text-[#DC2626]" />
                <span>Hapus Foto Bukti</span>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceToDelete(null)}
                className="text-[#666666] hover:text-[#000000] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#333333] leading-relaxed">
                Apakah Anda yakin ingin menghapus foto bukti{' '}
                <strong className="text-[#000000]">{evidenceToDelete.fileName}</strong>?
              </p>
              <p className="text-[#991B1B] text-[11px] font-medium bg-[#FEF2F2] p-2 rounded-[4px] border border-[#FECACA]">
                Peringatan: Foto bukti akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEvidenceToDelete(null)}
                disabled={isDeletingEvidence}
                className="px-3 py-1.5 text-xs font-semibold text-[#333333] bg-white border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-[4px] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvidence}
                disabled={isDeletingEvidence}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingEvidence ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Foto</span>
                )}
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
    </div>
  );
};

export default EditFindingPage;
