/**
 * SPLD SAFETY - Idempotent Demo Findings Seeder
 * Run explicitly with: npm run db:seed:findings
 *
 * NOTE: This script is OPTIONAL and ONLY runs when explicitly invoked.
 * It does not run automatically during build or start.
 * It is idempotent and skips records if reference_no already exists.
 */

import dotenv from 'dotenv';
import { sql, isDatabaseConfigured } from '../config/database.js';

dotenv.config();

const DEMO_SEED_DATA = [
  {
    reference_no: 'FND-2026-0001',
    title: 'Penumpukan Palet Kayu Melebihi Batas Maksimal',
    description: 'Palet kayu ditumpuk setinggi 3 meter di dekat jalur forklift lorong B2 tanpa pengaman penahan, berpotensi roboh saat dilalui kendaraan operasional.',
    finding_category: 'UNSAFE_CONDITION',
    hazard_category: 'PHYSICAL',
    risk_level: 'HIGH',
    finding_date: '2026-05-12',
    reporter_name: 'Budi Santoso',
    reporter_department: 'Warehouse',
    reporter_other_department: null,
    reporter_section_area: 'Inbound Storage Section',
    operational_area: 'Warehouse Area B',
    location_detail: 'Lorong B2 Rak Tingkat 3',
    corrective_action: 'Turunkan tumpukan palet maksimal 1.8 meter dan pasang tanda batas tinggi beban.',
    due_date: '2026-05-18',
    status: 'OPEN',
  },
  {
    reference_no: 'FND-2026-0002',
    title: 'Postur Janggal Pekerja Saat Pengangkatan Komponen Berat',
    description: 'Operator mengangkat boks material seberat 28 kg secara manual tanpa alat bantu angkut (lifting hoist) berulang kali selama pergantian shift.',
    finding_category: 'UNSAFE_ACTION',
    hazard_category: 'ERGONOMIC',
    risk_level: 'MEDIUM',
    finding_date: '2026-06-14',
    reporter_name: 'Siti Rahma',
    reporter_department: 'IM',
    reporter_other_department: null,
    reporter_section_area: 'Injection Molding Line 3',
    operational_area: 'Assembly Line 1',
    location_detail: 'Workstation Stamping 04',
    corrective_action: 'Gunakan vacuum lifter yang tersedia dan lakukan briefing ulang teknik manual handling ergonomis.',
    due_date: '2026-06-20',
    status: 'IN_PROGRESS',
  },
  {
    reference_no: 'FND-2026-0003',
    title: 'Pemasangan Barricade Otomatis pada Jalur Penyeberangan AGV',
    description: 'Usulan penambahan palang sensor interlock pada titik penyeberangan orang di dekat lintasan Automated Guided Vehicle untuk mencegah tabrakan.',
    finding_category: 'IMPROVEMENT_OPPORTUNITY',
    hazard_category: null,
    risk_level: 'LOW',
    finding_date: '2026-07-02',
    reporter_name: 'Ahmad Fauzi',
    reporter_department: 'SPPM',
    reporter_other_department: null,
    reporter_section_area: 'Material Handling Engineering',
    operational_area: 'Logistic Dock',
    location_detail: 'Crosswalk Jalur Utama AGV Pier 4',
    corrective_action: 'Koordinasikan dengan tim maintenance fasilitas untuk pembuatan prototype swing gate interlock.',
    due_date: '2026-07-30',
    status: 'CLOSED',
  },
  {
    reference_no: 'FND-2026-0004',
    title: 'Tumpahan Oli Hidrolik di Dekat Jalur Lalu Lintas Forklift',
    description: 'Ditemukan genangan oli hidrolik sekitar 1.5 meter persegi akibat selang bocor pada mesin press nomor 2, lantai sangat licin.',
    finding_category: 'UNSAFE_CONDITION',
    hazard_category: 'CHEMICAL',
    risk_level: 'CRITICAL',
    finding_date: '2026-08-10',
    reporter_name: 'Hendra Gunawan',
    reporter_department: 'SM',
    reporter_other_department: null,
    reporter_section_area: 'Sub-Assembly Stamping',
    operational_area: 'Press Shop',
    location_detail: 'Area Mesin Press 500 Ton Unit 2',
    corrective_action: 'Segera taburkan absorbent serbuk kayu, pasang police line K3, dan perbaiki fitting selang hidrolik bocor.',
    due_date: '2026-08-11',
    status: 'OPEN',
  },
  {
    reference_no: 'FND-2026-0005',
    title: 'Tidak Menggunakan Masker Respirator Saat Pencampuran Thinner',
    description: 'Teknisi melakukan mixing cat dan larutan thinner solvent organik tanpa mengenakan respirator kimia half-face.',
    finding_category: 'UNSAFE_ACTION',
    hazard_category: 'CHEMICAL',
    risk_level: 'HIGH',
    finding_date: '2026-09-05',
    reporter_name: 'Dewi Lestari',
    reporter_department: 'QSHE & Jiritsuka',
    reporter_other_department: null,
    reporter_section_area: 'Safety Audit Team',
    operational_area: 'Paint Shop',
    location_detail: 'Ruang Paint Kitchen Booth 2',
    corrective_action: 'Hentikan aktivitas sementara, instruksikan pemakaian respirator katrid organik, dan lakukan edukasi bahaya uap VOC.',
    due_date: '2026-09-07',
    status: 'CLOSED',
  },
  {
    reference_no: 'FND-2026-0006',
    title: 'Genangan Air Terbuka Berlumut Menjadi Sarang Jentik Nyamuk',
    description: 'Bak penampungan drainase pendingin sekunder tidak tertutup rapat dan air menggenang lebih dari satu minggu.',
    finding_category: 'UNSAFE_CONDITION',
    hazard_category: 'BIOLOGICAL',
    risk_level: 'LOW',
    finding_date: '2026-09-18',
    reporter_name: 'Rudi Hartono',
    reporter_department: 'Lain-lain',
    reporter_other_department: 'Facility General Affairs',
    reporter_section_area: 'Building Maintenance Section',
    operational_area: 'Facility & Utilities',
    location_detail: 'Belakang Gedung Kompresor Sentral',
    corrective_action: 'Kuras bak drainase, taburkan larvasida abate, dan buatkan penutup ram kawat tahan karat.',
    due_date: '2026-09-25',
    status: 'OPEN',
  },
];

async function seed() {
  console.log('=== SPLD SAFETY - DEMO FINDINGS SEEDING ===\n');

  if (!isDatabaseConfigured()) {
    console.error('❌ Error: DATABASE_URL belum dikonfigurasi di file .env.');
    process.exit(1);
  }

  // Find admin user for created_by_admin_id
  const adminRows = await sql.query('SELECT id FROM admin_users LIMIT 1;');
  const adminId = adminRows[0]?.id || null;

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of DEMO_SEED_DATA) {
    const existing = await sql.query(
      'SELECT id FROM findings WHERE reference_no = $1 LIMIT 1;',
      [item.reference_no]
    );

    if (existing.length > 0) {
      console.log(`⏩ Lewati ${item.reference_no} (sudah ada)`);
      skippedCount++;
      continue;
    }

    await sql.query(
      `WITH ins_finding AS (
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
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
         )
         RETURNING id, reference_no, status
       ),
       ins_history AS (
         INSERT INTO finding_status_history (
           finding_id,
           old_status,
           new_status,
           note,
           changed_by_admin_id
         )
         SELECT id, NULL, status, 'Data inisial demo dimasukkan secara manual.', $2
         FROM ins_finding
         RETURNING id
       )
       SELECT * FROM ins_finding;`,
      [
        item.reference_no,
        adminId,
        item.reporter_name,
        item.reporter_department,
        item.reporter_other_department,
        item.reporter_section_area,
        item.title,
        item.description,
        item.finding_category,
        item.hazard_category,
        item.risk_level,
        item.finding_date,
        item.operational_area,
        item.location_detail,
        item.status,
        item.corrective_action,
        item.due_date,
      ]
    );

    console.log(`✅ Berhasil menyisipkan ${item.reference_no}: ${item.title}`);
    insertedCount++;
  }

  console.log(`\n======================================================`);
  console.log(`Ringkasan: ${insertedCount} disisipkan, ${skippedCount} dilewati.`);
  console.log(`======================================================\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Gagal menjalankan seeding:', err.message);
  process.exit(1);
});
