/**
 * SPLD SAFETY - Finding Model
 * Data layer for K3 Safety Finding Management with Neon PostgreSQL
 */

import { sql } from '../config/database.js';

export const ALLOWED_SORT_COLUMNS = {
  finding_date: 'f.finding_date',
  created_at: 'f.created_at',
  risk_level: 'f.risk_level',
  status: 'f.status',
  reference_no: 'f.reference_no',
  title: 'f.title',
};

/**
 * Format date value to strict YYYY-MM-DD string without timezone day-shifting
 */
export function formatDateOnly(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).split('T')[0];
}

/**
 * Format raw database row into safe finding object with dual camelCase & snake_case support
 */
export function formatFindingRecord(row) {
  if (!row) return null;
  const findingDateStr = formatDateOnly(row.finding_date);
  const dueDateStr = formatDateOnly(row.due_date);

  return {
    id: row.id,
    referenceNo: row.reference_no,
    reference_no: row.reference_no,
    createdByAdminId: row.created_by_admin_id,
    created_by_admin_id: row.created_by_admin_id,
    reporterName: row.reporter_name,
    reporter_name: row.reporter_name,
    reporterDepartment: row.reporter_department,
    reporter_department: row.reporter_department,
    reporterOtherDepartment: row.reporter_other_department,
    otherDepartmentName: row.reporter_other_department,
    reporter_other_department: row.reporter_other_department,
    reporterSectionArea: row.reporter_section_area,
    reporterSection: row.reporter_section_area,
    reporter_section_area: row.reporter_section_area,
    title: row.title,
    description: row.description,
    findingCategory: row.finding_category,
    finding_category: row.finding_category,
    hazardCategory: row.hazard_category,
    hazard_category: row.hazard_category,
    riskLevel: row.risk_level,
    risk_level: row.risk_level,
    findingDate: findingDateStr,
    finding_date: findingDateStr,
    operationalArea: row.operational_area,
    operational_area: row.operational_area,
    locationDetail: row.location_detail,
    location_detail: row.location_detail,
    status: row.status,
    correctiveAction: row.corrective_action || null,
    corrective_action: row.corrective_action || null,
    dueDate: dueDateStr,
    due_date: dueDateStr,
    closedAt: row.closed_at,
    closed_at: row.closed_at,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    archivedAt: row.archived_at,
    archived_at: row.archived_at,
    evidences: [],
  };
}

export const findingModel = {
  /**
   * Generate next sequential reference number using PostgreSQL sequence finding_ref_seq
   * Format: FND-YYYY-XXXX (e.g. FND-2026-0001)
   */
  async generateReferenceNumber() {
    const currentYear = new Date().getFullYear();
    const rows = await sql.query("SELECT nextval('finding_ref_seq')::int AS seq;");
    const seq = rows[0]?.seq || 1;
    const padded = String(seq).padStart(4, '0');
    return `FND-${currentYear}-${padded}`;
  },

  /**
   * Create a new Finding record with initial OPEN status history atomically
   */
  async createFinding(findingData, adminId) {
    const referenceNo = await this.generateReferenceNumber();

    const normalizedDepartment = findingData.reporter_department?.trim();
    const otherDept =
      normalizedDepartment === 'Lain-lain'
        ? (findingData.reporter_other_department || findingData.otherDepartmentName || '').trim() || null
        : null;

    // Insert finding and initial status history in CTE for single-roundtrip atomicity
    const rows = await sql.query(
      `WITH new_finding AS (
         INSERT INTO findings (
           reference_no,
           created_by_admin_id,
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
           status,
           corrective_action,
           due_date
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'OPEN', $15, $16
         )
         RETURNING *
       ),
       initial_history AS (
         INSERT INTO finding_status_history (
           finding_id,
           old_status,
           new_status,
           note,
           changed_by_admin_id
         )
         SELECT id, NULL, 'OPEN', 'Laporan temuan baru dibuat.', $2
         FROM new_finding
         RETURNING id
       )
       SELECT * FROM new_finding;`,
      [
        referenceNo,
        adminId,
        findingData.reporter_name.trim(),
        normalizedDepartment,
        otherDept,
        (findingData.reporter_section_area || findingData.reporterSection || '').trim(),
        findingData.title.trim(),
        findingData.description.trim(),
        findingData.finding_category,
        findingData.hazard_category || null,
        findingData.risk_level,
        findingData.finding_date,
        findingData.operational_area.trim(),
        findingData.location_detail.trim(),
        findingData.corrective_action?.trim() || null,
        findingData.due_date || null,
      ]
    );

    return formatFindingRecord(rows[0]);
  },

  /**
   * Fetch findings with server-side pagination, parameterized filtering and search
   */
  async getFindings({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    risk_level = '',
    finding_category = '',
    hazard_category = '',
    department = '',
    operational_area = '',
    from_date = '',
    to_date = '',
    sort_by = 'finding_date',
    sort_dir = 'DESC',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['f.archived_at IS NULL'];
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(
        `(LOWER(f.reference_no) LIKE $${pIdx} OR LOWER(f.title) LIKE $${pIdx} OR LOWER(f.reporter_name) LIKE $${pIdx})`
      );
    }

    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`(f.status = $${params.length} OR UPPER(f.status) = UPPER($${params.length}))`);
    }

    if (risk_level && risk_level !== 'ALL') {
      params.push(risk_level);
      conditions.push(`(f.risk_level = $${params.length} OR UPPER(f.risk_level) = UPPER($${params.length}))`);
    }

    if (finding_category && finding_category !== 'ALL') {
      params.push(finding_category);
      conditions.push(`(f.finding_category = $${params.length} OR UPPER(f.finding_category) = UPPER($${params.length}))`);
    }

    if (hazard_category && hazard_category !== 'ALL') {
      params.push(hazard_category);
      conditions.push(`(f.hazard_category = $${params.length} OR UPPER(f.hazard_category) = UPPER($${params.length}))`);
    }

    if (department && department !== 'ALL') {
      params.push(department);
      conditions.push(`f.reporter_department = $${params.length}`);
    }

    if (operational_area && operational_area !== 'ALL') {
      params.push(operational_area);
      conditions.push(`f.operational_area = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`f.finding_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`f.finding_date <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sorting against strict allowlist
    const sortColumn = ALLOWED_SORT_COLUMNS[sort_by] || 'f.finding_date';
    const sortDirection = sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Total count query
    const countSql = `SELECT COUNT(*)::int AS total FROM findings f ${whereClause};`;
    const countResult = await sql.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Items query
    const itemParams = [...params, limitNum, offset];
    const itemsSql = `
      SELECT f.*
      FROM findings f
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}, f.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const itemsResult = await sql.query(itemsSql, itemParams);
    const items = itemsResult.map(formatFindingRecord);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get single finding detail by UUID along with status history and evidence list
   */
  async getFindingById(id) {
    if (!id) return null;

    const findingRows = await sql.query(
      `SELECT * FROM findings WHERE id = $1 AND archived_at IS NULL LIMIT 1;`,
      [id]
    );

    if (findingRows.length === 0) {
      return null;
    }

    const finding = formatFindingRecord(findingRows[0]);

    // Fetch chronological status history
    const historyRows = await sql.query(
      `SELECT 
         h.id,
         h.finding_id,
         h.old_status,
         h.new_status,
         h.note,
         h.changed_by_admin_id,
         h.created_at,
         u.full_name AS changed_by_name,
         u.email AS changed_by_email
       FROM finding_status_history h
       LEFT JOIN admin_users u ON u.id = h.changed_by_admin_id
       WHERE h.finding_id = $1
       ORDER BY h.created_at ASC;`,
      [id]
    );

    // Fetch evidence metadata (if any)
    const evidenceRows = await sql.query(
      `SELECT id, finding_id, blob_pathname, file_name, mime_type, file_size_bytes, created_at
       FROM finding_evidence
       WHERE finding_id = $1
       ORDER BY created_at ASC;`,
      [id]
    );

    finding.statusHistory = historyRows.map((h) => ({
      id: h.id,
      findingId: h.finding_id,
      oldStatus: h.old_status,
      newStatus: h.new_status,
      note: h.note,
      changedByAdminId: h.changed_by_admin_id,
      changedByName: h.changed_by_name || 'Administrator',
      createdAt: h.created_at,
    }));

    finding.evidences = evidenceRows.map((e) => ({
      id: e.id,
      findingId: e.finding_id,
      blobPathname: e.blob_pathname,
      fileName: e.file_name,
      fileSize: e.file_size_bytes,
      fileType: e.mime_type,
      uploadedAt: e.created_at,
    }));

    return finding;
  },

  /**
   * Update finding details (status cannot be changed here)
   */
  async updateFinding(id, updateData) {
    const normalizedDepartment = updateData.reporter_department?.trim();
    const otherDept =
      normalizedDepartment === 'Lain-lain'
        ? (updateData.reporter_other_department || updateData.otherDepartmentName || '').trim() || null
        : null;

    const formattedFindingDate = updateData.finding_date ? updateData.finding_date.split('T')[0] : null;
    const formattedDueDate =
      updateData.due_date && String(updateData.due_date).trim()
        ? String(updateData.due_date).split('T')[0]
        : null;

    const rows = await sql.query(
      `UPDATE findings
       SET reporter_name = $2::varchar,
           reporter_department = $3::varchar,
           reporter_other_department = $4::varchar,
           reporter_section_area = $5::varchar,
           title = $6::varchar,
           description = $7::text,
           finding_category = $8::varchar,
           hazard_category = $9::varchar,
           risk_level = $10::varchar,
           finding_date = $11::date,
           operational_area = $12::varchar,
           location_detail = $13::text,
           corrective_action = $14::text,
           due_date = $15::date,
           updated_at = NOW()
       WHERE id = $1::uuid AND archived_at IS NULL
       RETURNING *;`,
      [
        id,                                                  // $1::uuid
        updateData.reporter_name.trim(),                     // $2::varchar
        normalizedDepartment,                                // $3::varchar
        otherDept,                                           // $4::varchar
        (updateData.reporter_section_area || updateData.reporterSection || '').trim(), // $5::varchar
        updateData.title.trim(),                             // $6::varchar
        updateData.description.trim(),                       // $7::text
        updateData.finding_category,                         // $8::varchar
        updateData.hazard_category || null,                  // $9::varchar
        updateData.risk_level,                               // $10::varchar
        formattedFindingDate,                                // $11::date
        updateData.operational_area.trim(),                  // $12::varchar
        updateData.location_detail.trim(),                   // $13::text
        updateData.corrective_action?.trim() || null,        // $14::text
        formattedDueDate,                                    // $15::date
      ]
    );

    return rows.length > 0 ? formatFindingRecord(rows[0]) : null;
  },

  /**
   * Transition finding status atomically with status history log
   * Allowed transitions: OPEN -> IN_PROGRESS, IN_PROGRESS -> CLOSED
   */
  async updateStatus({ id, currentStatus, newStatus, note = null, adminId }) {
    const rows = await sql.query(
      `WITH updated AS (
         UPDATE findings
         SET status = $2::varchar,
             closed_at = CASE WHEN $2::varchar = 'CLOSED'::varchar THEN NOW() ELSE closed_at END,
             updated_at = NOW()
         WHERE id = $1::uuid 
           AND status = $3::varchar 
           AND archived_at IS NULL
         RETURNING *
       ),
       inserted_history AS (
         INSERT INTO finding_status_history (
           finding_id,
           old_status,
           new_status,
           note,
           changed_by_admin_id
         )
         SELECT id, $3::varchar, $2::varchar, $4::text, $5::uuid
         FROM updated
         RETURNING id
       )
       SELECT updated.*, inserted_history.id AS history_id
       FROM updated
       JOIN inserted_history ON TRUE;`,
      [id, newStatus, currentStatus, note?.trim() || null, adminId]
    );

    return rows.length > 0 ? formatFindingRecord(rows[0]) : null;
  },

  /**
   * Soft delete (archive) finding
   */
  async archiveFinding(id) {
    const rows = await sql.query(
      `UPDATE findings
       SET archived_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND archived_at IS NULL
       RETURNING id;`,
      [id]
    );

    return rows.length > 0;
  },
};

export default findingModel;
