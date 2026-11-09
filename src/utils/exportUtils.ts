/**
 * SPLD SAFETY - Data Export Utilities
 * Exports user directories, safety finding reports, and audit logs to:
 * 1. Formatted Microsoft Excel Workbook (.xls) with Toyota corporate styling, colored headers,
 *    borders, and strict cell-by-cell separation (guaranteed NOT to clump into a single cell).
 * 2. UTF-8 BOM CSV (.csv) with explicit Excel delimiter specification (sep=,).
 */

import type { AuthUser, AuditLogEntry } from '../types/auth';
import type { SafetyFindingRecord } from '../types/dashboard';

/**
 * Escapes HTML characters for safe XML/HTML embedding in Excel
 */
function escapeHTML(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Triggers a browser download of an Excel formatted file (.xls)
 */
function downloadExcel(htmlContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to wrap table in Microsoft Excel XML envelope with CSS styles
 */
function createExcelWorkbookHTML(
  sheetName: string,
  titleBanner: string,
  subtitleBanner: string,
  tableHTML: string
): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${escapeHTML(sheetName)}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
     <x:Selected/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1F2937; }
  .company-title { font-size: 14pt; font-weight: bold; color: #EB0A1E; padding: 4px 0; }
  .doc-title { font-size: 12pt; font-weight: bold; color: #111827; padding: 2px 0; }
  .doc-meta { font-size: 9pt; color: #6B7280; font-style: italic; padding: 2px 0 10px 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th { background-color: #EB0A1E; color: #FFFFFF; font-weight: bold; text-align: center; border: 1px solid #991B1B; padding: 8px 12px; font-size: 10pt; }
  td { border: 1px solid #D1D5DB; padding: 6px 10px; font-size: 10pt; vertical-align: middle; }
  .zebra { background-color: #F9FAFB; }
  .text-cell { mso-number-format:"\\@"; }
  .center-cell { text-align: center; }
  .bold-cell { font-weight: bold; }
  .status-active, .status-closed, .status-resolved { color: #047857; font-weight: bold; }
  .status-open, .status-rejected, .status-overdue { color: #DC2626; font-weight: bold; }
  .status-progress, .status-review { color: #2563EB; font-weight: bold; }
  .risk-critical { background-color: #FEE2E2; color: #991B1B; font-weight: bold; text-align: center; }
  .risk-high { background-color: #FEF3C7; color: #92400E; font-weight: bold; text-align: center; }
  .risk-medium { background-color: #E0E7FF; color: #3730A3; text-align: center; }
  .risk-low { background-color: #D1FAE5; color: #065F46; text-align: center; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="8" class="company-title">PT TOYOTA-ASTRA MOTOR &bull; SERVICE PARTS LOGISTIC DIVISION (SPLD)</td>
    </tr>
    <tr>
      <td colspan="8" class="doc-title">${escapeHTML(titleBanner)}</td>
    </tr>
    <tr>
      <td colspan="8" class="doc-meta">${escapeHTML(subtitleBanner)}</td>
    </tr>
    <tr><td colspan="8" style="border:none; height:8px;"></td></tr>
  </table>
  ${tableHTML}
</body>
</html>`;
}

/**
 * 1. Export Safety Finding Reports to Formatted Excel (.xls)
 * Every data item is strictly placed into its own column with borders and styling.
 */
export function exportFindingsToExcel(
  findings: SafetyFindingRecord[],
  filenamePrefix: string = 'SPLD_Safety_Reports',
  customTitle: string = 'LAPORAN TEMUAN KESELAMATAN KERJA (SAFETY FINDINGS)'
): void {
  const exportDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const subtitle = `Waktu Ekspor: ${exportDate} | Total Data: ${findings.length} Temuan | Sumber: Sistem AoS SPLD`;

  const rowsHTML = findings
    .map((f, idx) => {
      const isZebra = idx % 2 === 1;
      const zebraClass = isZebra ? 'zebra' : '';

      let statusClass = 'center-cell';
      if (f.status === 'Closed' || f.status === 'Resolved') statusClass += ' status-closed';
      else if (f.status === 'Open') statusClass += ' status-open';
      else statusClass += ' status-progress';

      let riskClass: string;
      const rLower = (f.riskLevelName || '').toLowerCase();
      if (rLower.includes('critical') || rLower.includes('extreme')) riskClass = 'risk-critical';
      else if (rLower.includes('high')) riskClass = 'risk-high';
      else if (rLower.includes('medium')) riskClass = 'risk-medium';
      else riskClass = 'risk-low';

      return `
    <tr class="${zebraClass}">
      <td class="center-cell">${idx + 1}</td>
      <td class="text-cell center-cell bold-cell">${escapeHTML(f.referenceNo)}</td>
      <td>${escapeHTML(f.title)}</td>
      <td>${escapeHTML(f.description || '-')}</td>
      <td class="center-cell">${escapeHTML(f.categoryName)}</td>
      <td class="${riskClass}">${escapeHTML(f.riskLevelName)}</td>
      <td class="center-cell">${escapeHTML(f.departmentName)}</td>
      <td class="center-cell">${escapeHTML(f.sectionName)}</td>
      <td class="center-cell">${escapeHTML(f.operationalAreaName)}</td>
      <td>${escapeHTML(f.reportedByName)}</td>
      <td class="text-cell center-cell">${escapeHTML(f.reportedByNoreg)}</td>
      <td class="center-cell">${escapeHTML(new Date(f.reportedAt).toLocaleDateString('id-ID'))}</td>
      <td class="${statusClass}">${escapeHTML(f.status)}</td>
    </tr>`;
    })
    .join('');

  const tableHTML = `
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">No</th>
        <th style="width: 120px;">No. Referensi</th>
        <th style="width: 250px;">Judul / Temuan Bahaya</th>
        <th style="width: 280px;">Deskripsi Observasi</th>
        <th style="width: 140px;">Kategori Temuan</th>
        <th style="width: 110px;">Tingkat Risiko</th>
        <th style="width: 130px;">Departemen</th>
        <th style="width: 150px;">Seksi / Area</th>
        <th style="width: 160px;">Area Operasional</th>
        <th style="width: 150px;">Pelapor (Nama)</th>
        <th style="width: 100px;">Noreg Pelapor</th>
        <th style="width: 110px;">Tgl Lapor</th>
        <th style="width: 110px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>`;

  const fullContent = createExcelWorkbookHTML(
    'Safety Findings',
    customTitle,
    subtitle,
    tableHTML
  );

  const timestamp = new Date().toISOString().split('T')[0];
  downloadExcel(fullContent, `${filenamePrefix}_${timestamp}.xls`);
}

/**
 * 2. Export User Directory to Formatted Excel (.xls)
 * Formatted employee roster with column widths and clean borders.
 */
export function exportUsersToExcel(
  users: AuthUser[],
  filenamePrefix: string = 'SPLD_User_Directory'
): void {
  const exportDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const subtitle = `Waktu Ekspor: ${exportDate} | Total Karyawan: ${users.length} Personel Terdaftar | Dokumen Rahasia Perusahaan`;

  const rowsHTML = users
    .map((u, idx) => {
      const isZebra = idx % 2 === 1;
      const zebraClass = isZebra ? 'zebra' : '';

      let statusClass = 'center-cell';
      if (u.status === 'Active') statusClass += ' status-active';
      else if (u.status === 'Pending') statusClass += ' status-review';
      else statusClass += ' status-open';

      const areasList = (u.areaAccess || []).join('; ');

      return `
    <tr class="${zebraClass}">
      <td class="center-cell">${idx + 1}</td>
      <td class="text-cell center-cell">${escapeHTML(u.id)}</td>
      <td class="text-cell center-cell bold-cell">${escapeHTML(u.noreg)}</td>
      <td class="bold-cell">${escapeHTML(u.fullName)}</td>
      <td class="text-cell">${escapeHTML(u.email)}</td>
      <td class="center-cell">${escapeHTML(u.department)}</td>
      <td class="center-cell">${escapeHTML(u.section)}</td>
      <td class="center-cell">${escapeHTML(u.position)}</td>
      <td class="center-cell bold-cell">${escapeHTML(u.role)}</td>
      <td class="center-cell">${u.areaAccess?.length || 0} Area</td>
      <td>${escapeHTML(areasList || 'Tidak ada area')}</td>
      <td class="${statusClass}">${escapeHTML(u.status)}</td>
    </tr>`;
    })
    .join('');

  const tableHTML = `
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">No</th>
        <th style="width: 90px;">User ID</th>
        <th style="width: 100px;">Noreg (NPK)</th>
        <th style="width: 180px;">Nama Lengkap</th>
        <th style="width: 200px;">Email Perusahaan</th>
        <th style="width: 130px;">Departemen</th>
        <th style="width: 150px;">Seksi</th>
        <th style="width: 140px;">Jabatan / Posisi</th>
        <th style="width: 120px;">Hak Akses (Role)</th>
        <th style="width: 100px;">Jml Area</th>
        <th style="width: 220px;">Daftar Area Operasional (Area Access)</th>
        <th style="width: 100px;">Status Akun</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>`;

  const fullContent = createExcelWorkbookHTML(
    'User Directory',
    'DIREKTORI DATA PENGGUNA & HAK AKSES SISTEM (SPLD USER DIRECTORY)',
    subtitle,
    tableHTML
  );

  const timestamp = new Date().toISOString().split('T')[0];
  downloadExcel(fullContent, `${filenamePrefix}_${timestamp}.xls`);
}

/**
 * 3. Export Audit Logs to Formatted Excel (.xls)
 */
export function exportAuditLogsToExcel(
  logs: AuditLogEntry[],
  filenamePrefix: string = 'SPLD_Audit_Trail'
): void {
  const exportDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const subtitle = `Waktu Ekspor: ${exportDate} | Total Catatan: ${logs.length} Log Audit | Rekam Jejak Sistem Tidak Dapat Diubah`;

  const rowsHTML = logs
    .map((l, idx) => {
      const isZebra = idx % 2 === 1;
      const zebraClass = isZebra ? 'zebra' : '';

      return `
    <tr class="${zebraClass}">
      <td class="center-cell">${idx + 1}</td>
      <td class="text-cell center-cell">${escapeHTML(l.id)}</td>
      <td class="center-cell">${escapeHTML(new Date(l.timestamp).toLocaleString('id-ID'))}</td>
      <td>${escapeHTML(l.actorName)}</td>
      <td class="text-cell center-cell">${escapeHTML(l.actorNoreg)}</td>
      <td class="center-cell">${escapeHTML(l.actorRole)}</td>
      <td class="center-cell bold-cell">${escapeHTML(l.action)}</td>
      <td>${escapeHTML(l.targetUserName)}</td>
      <td class="text-cell center-cell">${escapeHTML(l.targetUserNoreg)}</td>
      <td>${escapeHTML(l.details)}</td>
      <td>${escapeHTML(Array.isArray(l.previousValue) ? l.previousValue.join('; ') : l.previousValue || '-')}</td>
      <td class="bold-cell">${escapeHTML(Array.isArray(l.newValue) ? l.newValue.join('; ') : l.newValue || '-')}</td>
    </tr>`;
    })
    .join('');

  const tableHTML = `
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">No</th>
        <th style="width: 90px;">Log ID</th>
        <th style="width: 140px;">Waktu Kejadian</th>
        <th style="width: 160px;">Nama Administrator</th>
        <th style="width: 100px;">Noreg Admin</th>
        <th style="width: 110px;">Peran Admin</th>
        <th style="width: 160px;">Tipe Aksi</th>
        <th style="width: 160px;">Target User / Entitas</th>
        <th style="width: 100px;">Noreg Target</th>
        <th style="width: 250px;">Detail Tindakan</th>
        <th style="width: 140px;">Nilai Sebelumnya</th>
        <th style="width: 140px;">Nilai Baru</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>`;

  const fullContent = createExcelWorkbookHTML(
    'Audit Trail',
    'LOG AUDIT ADMINISTRATIF & MUTASI KEWENANGAN (SPLD AUDIT TRAIL)',
    subtitle,
    tableHTML
  );

  const timestamp = new Date().toISOString().split('T')[0];
  downloadExcel(fullContent, `${filenamePrefix}_${timestamp}.xls`);
}

/**
 * Legacy CSV Exporter with explicit Excel separator specification (sep=,)
 * Prevents Excel from grouping columns into a single cell when opening .csv files.
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function downloadCSV(csvContent: string, filename: string): void {
  // Prepend sep=, to force Excel to parse commas into individual columns
  const content = 'sep=,\r\n' + csvContent;
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFindingsToCSV(
  findings: SafetyFindingRecord[],
  filenamePrefix: string = 'SPLD_Safety_Reports'
): void {
  const headers = [
    'No',
    'Reference No',
    'Title / Observation',
    'Description',
    'Category',
    'Risk Level',
    'Department',
    'Section',
    'Operational Area',
    'Reported By (Name)',
    'Reported By (Noreg)',
    'Reported Date',
    'Status',
  ];

  const rows = findings.map((f, index) => [
    index + 1,
    f.referenceNo,
    f.title,
    f.description || '',
    f.categoryName,
    f.riskLevelName,
    f.departmentName,
    f.sectionName,
    f.operationalAreaName,
    f.reportedByName,
    f.reportedByNoreg,
    new Date(f.reportedAt).toLocaleString('id-ID'),
    f.status,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\r\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `${filenamePrefix}_${timestamp}.csv`);
}

export function exportUsersToCSV(
  users: AuthUser[],
  filenamePrefix: string = 'SPLD_User_Directory'
): void {
  const headers = [
    'No',
    'User ID',
    'Employee Number (Noreg)',
    'Full Name',
    'Email Address',
    'Department',
    'Section',
    'Position / Jabatan',
    'Assigned Role',
    'Authorized Operational Areas Count',
    'Operational Area IDs',
    'Account Status',
  ];

  const rows = users.map((u, index) => [
    index + 1,
    u.id,
    u.noreg,
    u.fullName,
    u.email,
    u.department,
    u.section,
    u.position,
    u.role,
    u.areaAccess?.length || 0,
    (u.areaAccess || []).join('; '),
    u.status,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\r\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `${filenamePrefix}_${timestamp}.csv`);
}

export function exportAuditLogsToCSV(
  logs: AuditLogEntry[],
  filenamePrefix: string = 'SPLD_Audit_Trail'
): void {
  const headers = [
    'No',
    'Log ID',
    'Timestamp',
    'Actor Name',
    'Actor Noreg',
    'Actor Role',
    'Action Type',
    'Target User / Entity',
    'Target Noreg / Code',
    'Details',
    'Previous Value',
    'New Value',
  ];

  const rows = logs.map((l, index) => [
    index + 1,
    l.id,
    new Date(l.timestamp).toLocaleString('id-ID'),
    l.actorName,
    l.actorNoreg,
    l.actorRole,
    l.action,
    l.targetUserName,
    l.targetUserNoreg,
    l.details,
    Array.isArray(l.previousValue) ? l.previousValue.join('; ') : l.previousValue || '',
    Array.isArray(l.newValue) ? l.newValue.join('; ') : l.newValue || '',
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\r\n');

  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csvContent, `${filenamePrefix}_${timestamp}.csv`);
}
