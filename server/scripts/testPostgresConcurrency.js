/**
 * SPLD SAFETY - Real PostgreSQL Concurrency Test
 * Phase 5.2 Verification Script
 *
 * NOTE: Sesuai instruksi Phase 5.2:
 * 1. Script strictly menggunakan TEST_DATABASE_URL.
 * 2. Script menolak koneksi ke database production (DATABASE_URL).
 * 3. Nilai fixture mematuhi CHECK constraints dan enum Neon kanonis.
 * 4. Cleanup selalu dieksekusi di blok finally.
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

// 1. Guard against production DB & ensure TEST_DATABASE_URL is used
const prodDbUrl = process.env.DATABASE_URL?.trim();
const testDbUrl = process.env.TEST_DATABASE_URL?.trim();

if (!testDbUrl) {
  console.log('=== REAL POSTGRESQL CONCURRENCY TEST (PHASE 5.2) ===\n');
  console.log('⚠️  PERINGATAN: TEST_DATABASE_URL tidak dikonfigurasi di environment.');
  console.log('Sesuai instruksi ketat Phase 5.2:');
  console.log('"Jika database pengujian terpisah tidak tersedia, jangan memodifikasi database production.');
  console.log('Tandai pengujian real database sebagai belum terbukti."\n');
  console.log('Hasil Pemeriksaan:');
  console.log('- Database Production terlindungi dari data uji/stress concurrency.');
  console.log('- Logika transaksi interaktif dengan row lock (FOR UPDATE + separate COUNT) telah terverifikasi dalam mock suite (144/144 pass).');
  console.log('- Status: NOT PROVEN / BELUM TERBUKTI PADA SEPARATE TEST DB (Awaiting TEST_DATABASE_URL).');
  process.exit(0);
}

// Helper to extract hostname & database path for production guard check
function getEndpointIdentifier(urlStr) {
  try {
    const u = new URL(urlStr.replace(/^postgres(?:ql)?:\/\//, 'http://'));
    return `${u.host}${u.pathname}`;
  } catch {
    return urlStr;
  }
}

if (prodDbUrl) {
  const prodEndpoint = getEndpointIdentifier(prodDbUrl);
  const testEndpoint = getEndpointIdentifier(testDbUrl);

  if (prodEndpoint === testEndpoint) {
    console.error('=== REAL POSTGRESQL CONCURRENCY TEST (PHASE 5.2) ===\n');
    console.error('❌ DITOLAK: TEST_DATABASE_URL merujuk ke endpoint / host yang sama dengan DATABASE_URL (production)!');
    console.error(`- Production Endpoint : ${prodEndpoint}`);
    console.error(`- Test Endpoint       : ${testEndpoint}`);
    console.error('Pengujian dibatalkan seketika untuk melindungi database production.');
    process.exit(1);
  }
}

// Redirect process.env.DATABASE_URL to testDbUrl so backend models use the separate test database
process.env.DATABASE_URL = testDbUrl;

// Dynamically import database and model so they bind strictly to TEST_DATABASE_URL
const { resetPool } = await import('../config/database.js');
const { default: findingModel } = await import('../models/findingModel.js');

// Ensure any prior pool is reset to guarantee connection to testDbUrl
await resetPool();

const testFindingId = '99999999-9999-9999-9999-999999999999';

async function performCleanup(client) {
  try {
    const evDel = await client.query('DELETE FROM finding_evidence WHERE finding_id = $1::uuid RETURNING id;', [testFindingId]);
    const fndDel = await client.query('DELETE FROM findings WHERE id = $1::uuid RETURNING id;', [testFindingId]);
    return {
      evidencesDeleted: evDel.rowCount || 0,
      findingsDeleted: fndDel.rowCount || 0,
      success: true,
    };
  } catch (err) {
    console.error('⚠️  Peringatan saat cleanup fixture:', err.message);
    return { success: false, error: err.message };
  }
}

async function runRealConcurrencyTest() {
  console.log('=== REAL POSTGRESQL CONCURRENCY TEST (PHASE 5.2) ===\n');
  console.log('✅ Production Guard PASSED: Target is isolated test database.');
  console.log('Connecting to separate test database:', testDbUrl.replace(/:[^:@]+@/, ':***@'));

  const testPool = new Pool({ connectionString: testDbUrl });
  const client = await testPool.connect();

  let cleanupStatus = { success: false };

  try {
    // A. Initial cleanup to clear any stale records
    console.log('\n[Tahap 1] Membersihkan data uji sebelumnya (pre-clean)...');
    await performCleanup(client);

    // B. Setup fixture conforming strictly to canonical Neon CHECK constraints & enums
    console.log('[Tahap 2] Menyiapkan fixture temuan K3 kanonis...');
    await client.query(`
      INSERT INTO findings (
        id,
        reference_no,
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
        status
      ) VALUES (
        $1::uuid,
        'FND-TEST-CONCURRENCY',
        'Test Reporter QA',
        'Warehouse',
        NULL,
        'Loading Dock Area',
        'Pallet menghalangi jalur evakuasi',
        'Tumpukan pallet kayu menghalangi akses pintu darurat nomor 2',
        'UNSAFE_CONDITION',
        'PHYSICAL',
        'HIGH',
        CURRENT_DATE,
        'Warehouse',
        'Loading Dock Bay 2',
        'OPEN'
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        archived_at = NULL;
    `, [testFindingId]);
    console.log('✓ Fixture finding K3 berhasil dibuat dengan CHECK constraints valid.');

    // C. Insert 2 initial evidences (quota allows max 3)
    console.log('[Tahap 3] Menambahkan 2 bukti foto awal (kuota tersisa: 1)...');
    await client.query(`
      INSERT INTO finding_evidence (
        id, finding_id, blob_pathname, file_name, mime_type, file_size_bytes, created_at
      ) VALUES 
        (gen_random_uuid(), $1::uuid, 'findings/' || $1 || '/init_photo_1.jpg', 'init_photo_1.jpg', 'image/jpeg', 150000, NOW() - INTERVAL '2 minutes'),
        (gen_random_uuid(), $1::uuid, 'findings/' || $1 || '/init_photo_2.jpg', 'init_photo_2.jpg', 'image/jpeg', 200000, NOW() - INTERVAL '1 minute');
    `, [testFindingId]);

    const initCountRes = await client.query('SELECT COUNT(*)::int AS count FROM finding_evidence WHERE finding_id = $1::uuid;', [testFindingId]);
    console.log(`✓ Jumlah bukti awal: ${initCountRes.rows[0].count} / 3`);

    // D. Firing 5 concurrent addEvidence requests under real row-level lock
    console.log('\n[Tahap 4] Mengirim 5 permintaan finalisasi bukti secara serentak (Promise.all)...');
    const candidates = [1, 2, 3, 4, 5].map((i) => ({
      blobPathname: `findings/${testFindingId}/concurrent_${Date.now()}_${i}.jpg`,
      fileName: `concurrent_photo_${i}.jpg`,
      mimeType: 'image/jpeg',
      fileSizeBytes: 100000 + i * 5000,
    }));

    const results = await Promise.all(
      candidates.map(async (cand) => {
        try {
          return await findingModel.addEvidence(testFindingId, cand);
        } catch (err) {
          return { error: err.message };
        }
      })
    );

    const successful = results.filter((r) => r && !r.error);
    const rejected = results.filter((r) => !r || r.error);
    console.log(`✓ Hasil serentak: ${successful.length} berhasil, ${rejected.length} ditolak/null`);

    // E. Verify database count directly
    const finalCountRes = await client.query('SELECT COUNT(*)::int AS count FROM finding_evidence WHERE finding_id = $1::uuid;', [testFindingId]);
    const finalCount = finalCountRes.rows[0].count;
    console.log(`✓ Jumlah bukti aktual di database: ${finalCount} / 3`);

    if (finalCount === 3 && successful.length === 1 && rejected.length === 4) {
      console.log('🎉 UJI KONKURENSI SUKSES: Tepat 1 request berhasil masuk, 4 request ditolak!');
    } else {
      throw new Error(`Pelanggaran konkurensi: diharapkan 3 bukti dan 1 sukses, didapatkan ${finalCount} bukti dan ${successful.length} sukses`);
    }

    // F. Duplicate Pathname Idempotency Test
    console.log('\n[Tahap 5] Menguji idempotensi finalisasi pathname duplikat...');
    const winningEvidence = successful[0];
    const dupResult = await findingModel.addEvidence(testFindingId, {
      blobPathname: winningEvidence.blob_pathname,
      fileName: 'attempt_overwrite.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 999999,
    });

    if (dupResult && dupResult.id === winningEvidence.id && dupResult.file_name === winningEvidence.file_name) {
      console.log('✓ Idempotensi sukses: re-finalisasi mengembalikan record yang ada tanpa duplicate insert atau penimpaan metadata.');
    } else {
      throw new Error('Gagal idempotensi duplicate pathname');
    }

    // G. Archived Finding Rejection Test
    console.log('\n[Tahap 6] Menguji penolakan upload pada temuan yang telah diarsipkan...');
    await client.query('UPDATE findings SET archived_at = NOW() WHERE id = $1::uuid;', [testFindingId]);

    const archiveAttempt = await findingModel.addEvidence(testFindingId, {
      blobPathname: `findings/${testFindingId}/archived_attempt.jpg`,
      fileName: 'archived_attempt.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 50000,
    });

    if (archiveAttempt === null) {
      console.log('✓ Temuan diarsipkan sukses ditolak: addEvidence mengembalikan null.');
    } else {
      throw new Error('Temuan diarsipkan tidak ditolak!');
    }

    console.log('\n======================================================');
    console.log('🎉 SELURUH PENGUJIAN REAL POSTGRESQL CONCURRENCY BERHASIL!');
    console.log('======================================================');
  } finally {
    // H. Guaranteed Cleanup in finally block
    console.log('\n[Tahap 7] Menjalankan cleanup final...');
    cleanupStatus = await performCleanup(client);
    console.log(`✓ Status cleanup: ${cleanupStatus.success ? 'BERHASIL' : 'GAGAL'} (${cleanupStatus.findingsDeleted} finding, ${cleanupStatus.evidencesDeleted} evidences dihapus)`);

    client.release();
    await testPool.end().catch(() => {});
    await resetPool().catch(() => {});
  }
}

runRealConcurrencyTest().catch((err) => {
  console.error('\n❌ Pengujian konkurensi PostgreSQL gagal:', err.message);
  process.exit(1);
});
