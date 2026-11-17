/**
 * SPLD SAFETY - Finding Controller
 * Handles REST API endpoints for K3 Safety Finding Management
 */

import { findingModel } from '../models/findingModel.js';

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
};

export default findingController;
