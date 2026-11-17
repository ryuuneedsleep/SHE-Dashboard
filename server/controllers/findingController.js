/**
 * SPLD SAFETY - Finding Controller
 * Handles REST API endpoints for K3 Safety Finding Management
 */

import { findingModel } from '../models/findingModel.js';
import {
  blobService,
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_SIZE_BYTES,
} from '../services/blobService.js';
import { Readable } from 'node:stream';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_DEPARTMENTS = new Set([
  'Warehouse',
  'IM',
  'SPPM',
  'SM',
  'QSHE & Jiritsuka',
  'Lain-lain',
]);

const CATEGORY_MAP = {
  'unsafe condition': 'UNSAFE_CONDITION',
  'unsafe_condition': 'UNSAFE_CONDITION',
  'unsafe action': 'UNSAFE_ACTION',
  'unsafe_action': 'UNSAFE_ACTION',
  'improvement opportunity': 'IMPROVEMENT_OPPORTUNITY',
  'improvement_opportunity': 'IMPROVEMENT_OPPORTUNITY',
};

const HAZARD_MAP = {
  'physical': 'PHYSICAL',
  'chemical': 'CHEMICAL',
  'biological': 'BIOLOGICAL',
  'ergonomic': 'ERGONOMIC',
  'environmental': 'ENVIRONMENTAL',
};

const RISK_MAP = {
  'low': 'LOW',
  'medium': 'MEDIUM',
  'high': 'HIGH',
  'critical': 'CRITICAL',
};

function normalizeCategory(val) {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  return CATEGORY_MAP[clean] || null;
}

function normalizeHazard(val) {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  return HAZARD_MAP[clean] || null;
}

function normalizeRisk(val) {
  if (!val || typeof val !== 'string') return null;
  const clean = val.trim().toLowerCase();
  return RISK_MAP[clean] || null;
}

export const findingController = {
  /**
   * GET /api/v1/findings
   * Fetch paginated list of findings with search and filters
   */
  async getFindings(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        risk_level,
        riskLevel,
        finding_category,
        findingCategory,
        hazard_category,
        hazardCategory,
        department,
        operational_area,
        operationalArea,
        from_date,
        startDate,
        to_date,
        endDate,
        sort_by,
        sort_dir,
      } = req.query;

      const normCat = normalizeCategory(finding_category || findingCategory);
      const normRisk = normalizeRisk(risk_level || riskLevel);
      const normHazard = normalizeHazard(hazard_category || hazardCategory);

      const result = await findingModel.getFindings({
        page,
        limit,
        search,
        status: status?.toUpperCase(),
        risk_level: normRisk || (risk_level?.toUpperCase()),
        finding_category: normCat || (finding_category?.toUpperCase()),
        hazard_category: normHazard || (hazard_category?.toUpperCase()),
        department,
        operational_area: operational_area || operationalArea,
        from_date: from_date || startDate,
        to_date: to_date || endDate,
        sort_by,
        sort_dir,
      });

      return res.status(200).json({
        success: true,
        message: 'Daftar temuan K3 berhasil diambil.',
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/findings/:id
   * Fetch single finding detail by UUID
   */
  async getFindingById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const finding = await findingModel.getFindingById(id);

      if (!finding) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Detail temuan K3 berhasil diambil.',
        data: finding,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/findings
   * Create a new finding report
   */
  async createFinding(req, res, next) {
    try {
      const body = req.body || {};

      const reporter_name = body.reporter_name || body.reporterName;
      const reporter_department = body.reporter_department || body.reporterDepartment;
      const reporter_other_department = body.reporter_other_department || body.otherDepartmentName;
      const reporter_section_area = body.reporter_section_area || body.reporterSection || body.reporterSectionArea;
      const title = body.title;
      const description = body.description;
      const rawCategory = body.finding_category || body.findingCategory;
      const rawHazard = body.hazard_category || body.hazardCategory;
      const rawRisk = body.risk_level || body.riskLevel;
      const finding_date = body.finding_date || body.findingDate;
      const operational_area = body.operational_area || body.operationalArea;
      const location_detail = body.location_detail || body.locationDetail;
      const corrective_action = body.corrective_action || body.correctiveAction;
      const due_date = body.due_date || body.dueDate;

      // Validate required text fields
      if (
        !reporter_name?.trim() ||
        !reporter_department?.trim() ||
        !reporter_section_area?.trim() ||
        !title?.trim() ||
        !description?.trim() ||
        !finding_date ||
        !operational_area?.trim() ||
        !location_detail?.trim()
      ) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Semua field wajib harus diisi dengan lengkap.',
        });
      }

      // Department validation
      if (!VALID_DEPARTMENTS.has(reporter_department.trim())) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_DEPARTMENT',
          message: `Departemen "${reporter_department}" tidak valid.`,
        });
      }

      if (reporter_department.trim() === 'Lain-lain' && !reporter_other_department?.trim()) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_OTHER_DEPARTMENT',
          message: 'Keterangan nama departemen wajib diisi jika memilih "Lain-lain".',
        });
      }

      // Category validation
      const finding_category = normalizeCategory(rawCategory);
      if (!finding_category) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_CATEGORY',
          message: 'Kategori temuan tidak valid.',
        });
      }

      // Risk level validation
      const risk_level = normalizeRisk(rawRisk);
      if (!risk_level) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_RISK_LEVEL',
          message: 'Tingkat risiko tidak valid.',
        });
      }

      // Hazard category (optional)
      let hazard_category = null;
      if (rawHazard && rawHazard !== 'ALL') {
        hazard_category = normalizeHazard(rawHazard);
        if (!hazard_category) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_HAZARD_CATEGORY',
            message: 'Kategori bahaya tidak valid.',
          });
        }
      }

      const adminId = req.user.id;

      const createdFinding = await findingModel.createFinding(
        {
          reporter_name,
          reporter_department,
          reporter_other_department,
          reporter_section_area,
          title,
          description,
          finding_category,
          hazard_category,
          risk_level,
          finding_date,
          operational_area,
          location_detail,
          corrective_action,
          due_date,
        },
        adminId
      );

      return res.status(201).json({
        success: true,
        message: 'Laporan temuan K3 berhasil dibuat.',
        data: createdFinding,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/v1/findings/:id
   * Update finding details (status cannot be changed through this endpoint)
   */
  async updateFinding(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const existing = await findingModel.getFindingById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
        });
      }

      const body = req.body || {};

      const reporter_name = body.reporter_name || body.reporterName || existing.reporterName;
      const reporter_department = body.reporter_department || body.reporterDepartment || existing.reporterDepartment;
      const reporter_section_area =
        body.reporter_section_area || body.reporterSection || body.reporterSectionArea || existing.reporterSectionArea;
      const title = body.title || existing.title;
      const description = body.description || existing.description;
      const rawCategory = body.finding_category || body.findingCategory || existing.findingCategory;
      const rawHazard =
        body.hazard_category !== undefined
          ? body.hazard_category
          : body.hazardCategory !== undefined
            ? body.hazardCategory
            : existing.hazardCategory;
      const rawRisk = body.risk_level || body.riskLevel || existing.riskLevel;
      const finding_date = body.finding_date || body.findingDate || existing.findingDate;
      const operational_area = body.operational_area || body.operationalArea || existing.operationalArea;
      const location_detail = body.location_detail || body.locationDetail || existing.locationDetail;

      // Department validation
      if (!VALID_DEPARTMENTS.has(reporter_department.trim())) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_DEPARTMENT',
          message: `Departemen "${reporter_department}" tidak valid.`,
        });
      }

      let reporter_other_department = null;
      if (reporter_department.trim() === 'Lain-lain') {
        reporter_other_department =
          body.reporter_other_department !== undefined
            ? body.reporter_other_department
            : body.otherDepartmentName !== undefined
              ? body.otherDepartmentName
              : existing.reporterOtherDepartment;

        if (!reporter_other_department?.trim()) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_OTHER_DEPARTMENT',
            message: 'Keterangan nama departemen wajib diisi jika memilih "Lain-lain".',
          });
        }
        reporter_other_department = reporter_other_department.trim();
      } else {
        reporter_other_department = null;
      }

      const finding_category = normalizeCategory(rawCategory);
      if (!finding_category) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_CATEGORY',
          message: 'Kategori temuan tidak valid.',
        });
      }

      const risk_level = normalizeRisk(rawRisk);
      if (!risk_level) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_RISK_LEVEL',
          message: 'Tingkat risiko tidak valid.',
        });
      }

      let hazard_category = null;
      if (rawHazard && rawHazard !== 'ALL' && String(rawHazard).trim() !== '') {
        hazard_category = normalizeHazard(rawHazard);
        if (!hazard_category) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_HAZARD_CATEGORY',
            message: 'Kategori bahaya tidak valid.',
          });
        }
      }

      let corrective_action = null;
      if (body.corrective_action !== undefined) {
        corrective_action = body.corrective_action ? String(body.corrective_action).trim() : null;
      } else if (body.correctiveAction !== undefined) {
        corrective_action = body.correctiveAction ? String(body.correctiveAction).trim() : null;
      } else {
        corrective_action = existing.correctiveAction || null;
      }

      let due_date = null;
      if (body.due_date !== undefined) {
        due_date = body.due_date && String(body.due_date).trim() ? String(body.due_date).trim() : null;
      } else if (body.dueDate !== undefined) {
        due_date = body.dueDate && String(body.dueDate).trim() ? String(body.dueDate).trim() : null;
      } else {
        due_date = existing.dueDate || null;
      }

      const updated = await findingModel.updateFinding(id, {
        reporter_name,
        reporter_department,
        reporter_other_department,
        reporter_section_area,
        title,
        description,
        finding_category,
        hazard_category,
        risk_level,
        finding_date,
        operational_area,
        location_detail,
        corrective_action,
        due_date,
      });

      return res.status(200).json({
        success: true,
        message: 'Temuan K3 berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/v1/findings/:id/status
   * Transition finding status with strict lifecycle checks: OPEN -> IN_PROGRESS -> CLOSED
   */
  async updateFindingStatus(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const { status: targetStatus, note } = req.body || {};

      if (!targetStatus || typeof targetStatus !== 'string') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_STATUS',
          message: 'Status tujuan harus ditentukan (IN_PROGRESS atau CLOSED).',
        });
      }

      const newStatus = targetStatus.trim().toUpperCase();

      if (!['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(newStatus)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_STATUS',
          message: `Status "${targetStatus}" tidak dikenal.`,
        });
      }

      const existing = await findingModel.getFindingById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
        });
      }

      const currentStatus = existing.status;

      // Validate lifecycle state machine
      if (currentStatus === 'CLOSED') {
        return res.status(400).json({
          success: false,
          code: 'TERMINAL_STATUS',
          message: 'Temuan yang sudah berstatus CLOSED bersifat final dan tidak dapat diubah lagi.',
        });
      }

      if (currentStatus === 'OPEN' && newStatus === 'CLOSED') {
        return res.status(400).json({
          success: false,
          code: 'ILLEGAL_TRANSITION',
          message: 'Temuan berstatus OPEN tidak dapat langsung ditutup. Ubah status menjadi IN_PROGRESS terlebih dahulu.',
        });
      }

      if (currentStatus === 'IN_PROGRESS' && newStatus === 'OPEN') {
        return res.status(400).json({
          success: false,
          code: 'ILLEGAL_TRANSITION',
          message: 'Status temuan tidak dapat dikembalikan dari IN_PROGRESS ke OPEN.',
        });
      }

      if (currentStatus === newStatus) {
        return res.status(400).json({
          success: false,
          code: 'SAME_STATUS',
          message: `Status temuan sudah "${currentStatus}".`,
        });
      }

      const adminId = req.user.id;

      const updated = await findingModel.updateStatus({
        id,
        currentStatus,
        newStatus,
        note: note || `Status diubah dari ${currentStatus} menjadi ${newStatus}.`,
        adminId,
      });

      if (!updated) {
        const recheck = await findingModel.getFindingById(id);
        if (!recheck) {
          return res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
          });
        }

        return res.status(409).json({
          success: false,
          code: 'STATUS_CONFLICT',
          message: `Konflik pembaruan status: status temuan saat ini adalah "${recheck.status}". Permintaan transisi tidak dapat diproses.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Status temuan berhasil diubah menjadi ${newStatus}.`,
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/findings/:id
   * Soft archive finding
   */
  async archiveFinding(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const archived = await findingModel.archiveFinding(id);

      if (!archived) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau sudah pernah diarsipkan sebelumnya.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Temuan K3 berhasil diarsipkan.',
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/findings/:id/evidence/upload-presign
   * Generate signed upload token / presigned URL for direct client upload to Vercel Blob
   */
  async uploadPresign(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Autentikasi Administrator diperlukan.',
        });
      }

      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const existing = await findingModel.getFindingById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
        });
      }

      if (existing.isArchived || existing.archived_at) {
        return res.status(400).json({
          success: false,
          code: 'ARCHIVED_FINDING',
          message: 'Tidak dapat mengunggah bukti ke temuan yang telah diarsipkan.',
        });
      }

      const currentCount = await findingModel.countEvidences(id);
      if (currentCount >= 3) {
        return res.status(400).json({
          success: false,
          code: 'MAX_EVIDENCE_REACHED',
          message: 'Batas maksimum 3 foto per temuan telah tercapai.',
        });
      }

      const presignResponse = await blobService.handlePresignRequest(req, id);
      return res.status(200).json(presignResponse);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/findings/:id/evidence/confirm
   * Verify uploaded blob in storage and record metadata in Neon PostgreSQL
   */
  async confirmEvidence(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Autentikasi Administrator diperlukan.',
        });
      }

      const { id } = req.params;

      if (!id || !UUID_REGEX.test(id)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan tidak valid.',
        });
      }

      const existing = await findingModel.getFindingById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Temuan K3 tidak ditemukan atau telah diarsipkan.',
        });
      }

      if (existing.isArchived || existing.archived_at) {
        return res.status(400).json({
          success: false,
          code: 'ARCHIVED_FINDING',
          message: 'Tidak dapat mengunggah bukti ke temuan yang telah diarsipkan.',
        });
      }

      const { pathname, fileName } = req.body || {};
      const expectedPrefix = `findings/${id}/`;

      if (!pathname || typeof pathname !== 'string' || !pathname.startsWith(expectedPrefix) || pathname.includes('..')) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PATHNAME',
          message: 'Prefix pathname foto tidak valid untuk temuan ini.',
        });
      }

      const currentCount = await findingModel.countEvidences(id);
      if (currentCount >= 3) {
        await blobService.deleteBlob(pathname).catch(() => {});
        return res.status(400).json({
          success: false,
          code: 'MAX_EVIDENCE_REACHED',
          message: 'Batas maksimum 3 foto per temuan telah tercapai.',
        });
      }

      // Verify physical blob existence and properties in Vercel Blob private storage
      let blobDetails;
      try {
        blobDetails = await blobService.verifyBlob(pathname);
      } catch (err) {
        return res.status(404).json({
          success: false,
          code: 'BLOB_NOT_FOUND',
          message: 'Berkas foto tidak ditemukan di storage atau belum selesai diunggah.',
        });
      }

      if (!blobDetails || !blobDetails.size) {
        return res.status(404).json({
          success: false,
          code: 'BLOB_NOT_FOUND',
          message: 'Berkas foto tidak ditemukan di storage.',
        });
      }

      // Enforce file size limit (max 5 MB)
      if (blobDetails.size > MAX_EVIDENCE_SIZE_BYTES) {
        await blobService.deleteBlob(pathname).catch(() => {});
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'Ukuran file terlalu besar. Batas maksimum per foto adalah 5 MB.',
        });
      }

      // Enforce MIME type
      if (!ALLOWED_EVIDENCE_MIME_TYPES.includes(blobDetails.contentType)) {
        await blobService.deleteBlob(pathname).catch(() => {});
        return res.status(400).json({
          success: false,
          code: 'INVALID_MIME_TYPE',
          message: 'Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.',
        });
      }

      // Enforce binary magic byte signature (reject spoofed MIME extensions)
      let detectedMime = null;
      try {
        detectedMime = await blobService.verifyBlobSignature(pathname);
      } catch (sigErr) {
        // Stream read failed
      }

      if (!detectedMime || !ALLOWED_EVIDENCE_MIME_TYPES.includes(detectedMime)) {
        await blobService.deleteBlob(pathname).catch(() => {});
        return res.status(400).json({
          success: false,
          code: 'INVALID_FILE_SIGNATURE',
          message: 'Signature berkas tidak valid atau tidak cocok dengan format gambar yang diizinkan (JPEG, PNG, WebP).',
        });
      }

      const safeFileName = (fileName || pathname.split('/').pop() || 'evidence.jpg')
        .replace(/[^\w\s.-]/gi, '_')
        .substring(0, 255);

      let evidence;
      try {
        evidence = await findingModel.addEvidence(id, {
          blobPathname: pathname,
          fileName: safeFileName,
          mimeType: blobDetails.contentType,
          fileSizeBytes: blobDetails.size,
        });
      } catch (addErr) {
        if (addErr.code === 'PATHNAME_CONFLICT') {
          return res.status(409).json({
            success: false,
            code: 'PATHNAME_CONFLICT',
            message: 'Berkas foto ini sudah terdaftar pada temuan lain.',
          });
        }
        throw addErr;
      }

      if (!evidence) {
        // Concurrency limit reached or finding archived: clean up newly uploaded orphan blob
        await blobService.deleteBlob(pathname).catch(() => {});
        return res.status(400).json({
          success: false,
          code: 'MAX_EVIDENCE_REACHED',
          message: 'Batas maksimum 3 foto per temuan telah tercapai.',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Bukti foto berhasil disimpan.',
        data: {
          id: evidence.id,
          findingId: evidence.finding_id,
          blobPathname: evidence.blob_pathname,
          fileName: evidence.file_name,
          fileSize: evidence.file_size_bytes,
          fileType: evidence.mime_type,
          url: `/api/v1/findings/${id}/evidence/${evidence.id}/content`,
          uploadedAt: evidence.created_at,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/findings/:id/evidence/:evidenceId/content
   * Stream private blob content to authenticated Administrator
   */
  async getEvidenceContent(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Autentikasi Administrator diperlukan.',
        });
      }

      const { id, evidenceId } = req.params;

      if (!id || !UUID_REGEX.test(id) || !evidenceId || !UUID_REGEX.test(evidenceId)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan atau bukti tidak valid.',
        });
      }

      const evidence = await findingModel.getEvidenceById(id, evidenceId);
      if (!evidence) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Bukti foto tidak ditemukan.',
        });
      }

      let blobResult;
      try {
        blobResult = await blobService.getBlobStream(evidence.blob_pathname);
      } catch (err) {
        return res.status(404).json({
          success: false,
          code: 'BLOB_NOT_FOUND',
          message: 'Berkas foto tidak ditemukan di storage.',
        });
      }

      if (!blobResult) {
        return res.status(404).json({
          success: false,
          code: 'BLOB_NOT_FOUND',
          message: 'Berkas foto tidak ditemukan di storage.',
        });
      }

      res.setHeader('Content-Type', evidence.mime_type);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      const safeName = evidence.file_name.replace(/"/g, '');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

      if (blobResult.stream) {
        Readable.fromWeb(blobResult.stream).pipe(res);
      } else if (blobResult.body && typeof blobResult.body.pipe === 'function') {
        blobResult.body.pipe(res);
      } else if (Buffer.isBuffer(blobResult.body) || typeof blobResult.body === 'string') {
        res.send(blobResult.body);
      } else {
        return res.status(500).json({
          success: false,
          code: 'STREAM_ERROR',
          message: 'Gagal membaca stream berkas foto.',
        });
      }
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/findings/:id/evidence/:evidenceId
   * Delete evidence blob from storage and metadata from Neon
   */
  async deleteEvidence(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Autentikasi Administrator diperlukan.',
        });
      }

      const { id, evidenceId } = req.params;

      if (!id || !UUID_REGEX.test(id) || !evidenceId || !UUID_REGEX.test(evidenceId)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ID',
          message: 'Format ID temuan atau bukti tidak valid.',
        });
      }

      const evidence = await findingModel.getEvidenceById(id, evidenceId);
      if (!evidence) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Bukti foto tidak ditemukan pada temuan ini.',
        });
      }

      // Delete from Vercel Blob private storage
      try {
        await blobService.deleteBlob(evidence.blob_pathname);
      } catch (blobErr) {
        // If blob is already not found or 404, it is already gone from storage, so safe to proceed.
        // If it's an unexpected outage / network failure, abort to keep metadata safe for retry.
        const isNotFound =
          blobErr?.status === 404 ||
          blobErr?.code === 'not_found' ||
          blobErr?.name === 'BlobNotFoundError' ||
          blobErr?.message?.toLowerCase().includes('not found');

        if (!isNotFound) {
          return res.status(502).json({
            success: false,
            code: 'STORAGE_DELETE_FAILED',
            message: 'Gagal menghapus berkas foto dari cloud storage. Silakan coba lagi.',
          });
        }
      }

      const deleted = await findingModel.deleteEvidence(id, evidenceId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          code: 'NOT_FOUND',
          message: 'Bukti foto tidak ditemukan pada temuan ini.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Bukti foto berhasil dihapus.',
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default findingController;
