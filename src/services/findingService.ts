/**
 * SPLD SAFETY - Production Finding Service
 * REST API client for Finding Management with Neon PostgreSQL backend
 */

import type {
  FindingRecord,
  FindingEvidence,
  CreateFindingInput,
  UpdateFindingInput,
  FindingFilters,
  FindingStatus,
} from '../types/finding.ts';
import { uploadPresigned } from '@vercel/blob/client';

export interface PaginatedFindingsResponse {
  items: FindingRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const findingService = {
  /**
   * Fetch paginated and filtered findings list
   */
  async getFindings(
    filters?: FindingFilters,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedFindingsResponse> {
    const params = new URLSearchParams();

    if (pagination?.page) params.set('page', String(pagination.page));
    if (pagination?.limit) params.set('limit', String(pagination.limit));

    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.riskLevel && filters.riskLevel !== 'ALL') params.set('risk_level', filters.riskLevel);
    if (filters?.findingCategory && filters.findingCategory !== 'ALL')
      params.set('finding_category', filters.findingCategory);
    if (filters?.hazardCategory && filters.hazardCategory !== 'ALL')
      params.set('hazard_category', filters.hazardCategory);
    if (filters?.department && filters.department !== 'ALL') params.set('department', filters.department);
    if (filters?.operationalArea && filters.operationalArea !== 'ALL')
      params.set('operational_area', filters.operationalArea);
    if (filters?.startDate) params.set('from_date', filters.startDate);
    if (filters?.endDate) params.set('to_date', filters.endDate);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/v1/findings${queryStr}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal memuat daftar temuan K3.');
    }

    return {
      items: payload.data || [],
      pagination: payload.pagination || {
        page: 1,
        limit: 10,
        total: payload.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch single finding details by ID
   */
  async getFindingById(id: string): Promise<FindingRecord | null> {
    const res = await fetch(`/api/v1/findings/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    if (res.status === 404) return null;

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal memuat detail temuan K3.');
    }

    return payload.data;
  },

  /**
   * Create new finding report
   */
  async createFinding(input: CreateFindingInput): Promise<FindingRecord> {
    const res = await fetch('/api/v1/findings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        reporter_name: input.reporterName,
        reporter_department: input.reporterDepartment,
        reporter_other_department:
          input.reporterDepartment === 'Lain-lain' ? (input.otherDepartmentName || null) : null,
        reporter_section_area: input.reporterSection,
        title: input.title,
        description: input.description,
        finding_category: input.findingCategory,
        hazard_category: input.hazardCategory || null,
        risk_level: input.riskLevel,
        finding_date: input.findingDate,
        operational_area: input.operationalArea,
        location_detail: input.locationDetail,
        corrective_action: input.correctiveAction || null,
        due_date: input.dueDate ? input.dueDate : null,
      }),
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal membuat laporan temuan K3.');
    }

    return payload.data;
  },

  /**
   * Update finding details (status cannot be changed here)
   */
  async updateFinding(id: string, input: UpdateFindingInput): Promise<FindingRecord> {
    const res = await fetch(`/api/v1/findings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        reporter_name: input.reporterName,
        reporter_department: input.reporterDepartment,
        reporter_other_department:
          input.reporterDepartment === 'Lain-lain' ? (input.otherDepartmentName || null) : null,
        reporter_section_area: input.reporterSection,
        title: input.title,
        description: input.description,
        finding_category: input.findingCategory,
        hazard_category: input.hazardCategory || null,
        risk_level: input.riskLevel,
        finding_date: input.findingDate,
        operational_area: input.operationalArea,
        location_detail: input.locationDetail,
        corrective_action: input.correctiveAction || null,
        due_date: input.dueDate ? input.dueDate : null,
      }),
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal memperbarui temuan K3.');
    }

    return payload.data;
  },

  /**
   * Transition finding status (OPEN -> IN_PROGRESS -> CLOSED)
   */
  async updateStatus(id: string, status: FindingStatus, note?: string): Promise<FindingRecord> {
    const res = await fetch(`/api/v1/findings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status, note }),
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal memperbarui status temuan.');
    }

    return payload.data;
  },

  /**
   * Soft archive finding
   */
  async archiveFinding(id: string): Promise<boolean> {
    const res = await fetch(`/api/v1/findings/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal mengarsipkan temuan K3.');
    }

    return true;
  },

  /**
   * Upload single evidence photo directly to Vercel Blob Private and confirm metadata in Neon
   */
  async uploadEvidence(
    findingId: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<FindingEvidence> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const pathname = `findings/${findingId}/${Date.now()}-${randomSuffix}-${safeName}`;

    // 1. Direct client upload to Vercel Blob Private Storage via presigned control plane
    const blobResult = await uploadPresigned(pathname, file, {
      access: 'private',
      handleUploadUrl: `/api/v1/findings/${findingId}/evidence/upload-presign`,
      clientPayload: JSON.stringify({ findingId, fileName: file.name }),
      onUploadProgress: (progress) => {
        if (onProgress && progress.percentage !== undefined) {
          onProgress(Math.round(progress.percentage));
        }
      },
    });

    // 2. Finalize metadata in Neon PostgreSQL database
    const confirmRes = await fetch(`/api/v1/findings/${findingId}/evidence/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        pathname: blobResult.pathname,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }),
    });

    const payload = await confirmRes.json();
    if (!confirmRes.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal mengonfirmasi metadata bukti foto.');
    }

    return payload.data;
  },

  /**
   * Delete evidence photo from storage and database
   */
  async deleteEvidence(findingId: string, evidenceId: string): Promise<boolean> {
    const res = await fetch(`/api/v1/findings/${findingId}/evidence/${evidenceId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    const payload = await res.json();
    if (!res.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal menghapus bukti foto.');
    }

    return true;
  },
};

export default findingService;
