/**
 * SPLD SAFETY - Administrator Initial Account Creation Script
 * Run interactively with: npm run admin:create
 */

import readline from 'readline';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { isDatabaseConfigured } from '../config/database.js';
import { authModel } from '../models/authModel.js';

dotenv.config();

function askQuestion(query, rl) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function askHidden(query) {
  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return askQuestion(query, rl).finally(() => rl.close());
  }

  return new Promise((resolve) => {
    process.stdout.write(query);
    let password = '';
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function onData(ch) {
      ch = String(ch);
      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdin.setRawMode(false);
          process.stdout.write('\nOperasi dibatalkan.\n');
          process.exit(1);
          break;
        case '\u0008': // Backspace
        case '\x7f':
          if (password.length > 0) {
            password = password.slice(0, -1);
          }
          break;
        default:
          // Silent input: input is completely invisible on screen to prevent shoulder-surfing
          password += ch;
          break;
      }
    }

    stdin.on('data', onData);
  });
}

async function run() {
  console.log('======================================================');
  console.log('   SPLD SAFETY - SETUP AKUN ADMINISTRATOR PERTAMA     ');
  console.log('======================================================\n');

  if (!isDatabaseConfigured()) {
    console.error('❌ Error: DATABASE_URL belum dikonfigurasi pada file .env.');
    console.error('Silakan atur DATABASE_URL terlebih dahulu sebelum membuat akun Administrator.\n');
    process.exit(1);
  }

  // Check if any admin already exists
  const existingCount = await authModel.countAdmins();
  if (existingCount > 0) {
    console.warn('⚠️  PERINGATAN: Akun Administrator sudah terdaftar di database.');
    console.warn(`Jumlah akun terdaftar: ${existingCount}`);
    console.warn('Proses dibatalkan demi keamanan (SPLD SAFETY Single Administrator policy).\n');
    process.exit(0);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    // 1. Email input
    let email = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (!email) {
      const input = await askQuestion('Masukkan Email Administrator: ', rl);
      const clean = input.trim().toLowerCase();
      if (!clean || !emailRegex.test(clean)) {
        console.log('⚠️ Format email tidak valid. Masukkan email yang benar.');
      } else {
        email = clean;
      }
    }

    // 2. Full Name input
    let fullName = '';
    while (!fullName) {
      const input = await askQuestion('Masukkan Nama Lengkap: ', rl);
      if (!input.trim()) {
        console.log('⚠️ Nama lengkap tidak boleh kosong.');
      } else {
        fullName = input.trim();
      }
    }

    // 3. Position input (optional, default: Lead Safety Officer)
    const positionInput = await askQuestion('Masukkan Posisi/Jabatan (Default: Lead Safety Officer): ', rl);
    const position = positionInput.trim() || 'Lead Safety Officer';

    // 4. Phone input (optional)
    const phoneInput = await askQuestion('Masukkan Nomor Telepon: ', rl);
    const phone = phoneInput.trim() || null;

    rl.close();

    // 5. Password input (Secure & Masked)
    let password = '';
    while (!password) {
      const p1 = await askHidden('\nMasukkan Password (min. 12 karakter, input tidak ditampilkan): ');
      if (p1.length < 12) {
        console.log('⚠️ Password terlalu pendek! Minimal harus 12 karakter.');
        continue;
      }
      if (Buffer.byteLength(p1, 'utf8') > 72) {
        console.log('⚠️ Password terlalu panjang untuk bcrypt (maks. 72 byte).');
        continue;
      }

      const p2 = await askHidden('Konfirmasi Password (input tidak ditampilkan): ');
      if (p1 !== p2) {
        console.log('⚠️ Konfirmasi password tidak cocok! Silakan ulangi.');
        continue;
      }

      password = p1;
    }

    console.log('\nMemproses pembuatan akun administrator dan hashing password (bcrypt 12 rounds)...');
    const passwordHash = await bcrypt.hash(password, 12);

    const createdAdmin = await authModel.createAdmin({
      email,
      passwordHash,
      fullName,
      phone,
      position,
    });

    console.log('\n======================================================');
    console.log('✅ AKUN ADMINISTRATOR BERHASIL DIBUAT!');
    console.log('======================================================');
    console.log(`- ID        : ${createdAdmin.id}`);
    console.log(`- Email     : ${createdAdmin.email}`);
    console.log(`- Nama      : ${createdAdmin.full_name}`);
    console.log(`- Posisi    : ${createdAdmin.position}`);
    console.log(`- Status    : Aktif`);
    console.log(`- Waktu     : ${createdAdmin.created_at}`);
    console.log('======================================================\n');
    console.log('Anda sekarang dapat login ke SPLD SAFETY PWA menggunakan akun ini.\n');

    process.exit(0);
  } catch (err) {
    rl.close();
    console.error('\n❌ Gagal membuat akun administrator:', err.message);
    process.exit(1);
  }
}

run();
