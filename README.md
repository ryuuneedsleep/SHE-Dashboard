# SPLD SAFETY PWA
### Safety Management System — Service Parts Logistic Division
**Tugas Akhir Praktikum Pemrograman Perangkat Bergerak**  
**Versi:** `v2.0.0 (Release Candidate)` • **Runtime:** Node.js 26.x (Active LTS)

---

## 1. Ringkasan Proyek

**SPLD SAFETY PWA** adalah aplikasi sistem manajemen dan pelaporan keselamatan kerja (K3 / *Safety Management System*) berbasis *Progressive Web Application* (PWA). Aplikasi ini dirancang untuk operasional *Service Parts Logistic Division*, memfasilitasi pelaporan temuan kondisi bahaya (*Unsafe Condition*), tindakan bahaya (*Unsafe Action*), dan peluang perbaikan lingkungan kerja (*Improvement Opportunity*) secara terstruktur, terpusat, dan *real-time*.

Aplikasi ini dibangun menggunakan arsitektur modern *decoupled client-server*:
- **Frontend PWA**: React 19, TypeScript, Tailwind CSS, dan Vite 8 dengan integrasi VitePWA (Workbox).
- **Backend REST API**: Node.js 26.x dan Express.js 5 terpadu dengan arsitektur Vercel Serverless Functions (`api/[...path].js`).
- **Database**: Serverless PostgreSQL (Neon PostgreSQL) dengan koneksi pooled transaksi ACID.
- **Evidence Storage**: Vercel Blob Private Storage dengan enkripsi dan *authenticated streaming*.

---

## 2. Fitur Utama

### 📊 Universal K3 Dashboard
- **5 KPI Utama**: Pemantauan instan untuk Total Temuan Aktif, Open, In Progress, Closed, dan Temuan Risiko Tinggi (*High/Critical*).
- **Grafik Tren Bulanan**: Visualisasi interaktif tren temuan per bulan berbasis visual SVG tanpa dependensi *charting library* eksternal yang berat.
- **Distribusi Risiko & Kategori**: Breakdown proporsi risiko (*Low, Medium, High, Critical*) dan kategori bahaya dalam format kartu analitik.
- **Pencarian & Multi-Filter**: Filter temuan berdasarkan departemen, area kerja operasional, dan rentang tanggal pelaporan.

### 📝 Pelaporan Temuan K3 (Direct Finding)
- **Formulir Validasi Ketat**: Divalidasi secara komprehensif menggunakan *React Hook Form* dan skema *Zod* baik di sisi *client* maupun *server*.
- **Taksonomi Departemen**: Warehouse, Quality Control, Maintenance, Admin/Office, Security, dan Lain-lain (dengan penamaan khusus).
- **Klasifikasi Risiko & Bahaya**: Evaluasi tingkat keparahan risiko dan tipe bahaya yang terstandarisasi.
- **Penomoran Otomatis**: Generator nomor referensi terstruktur (contoh: `FND-2026-0001`).

### 🔄 Siklus Hidup Temuan Terstandar (Status Lifecycle)
- **Alur Status Linier**: `OPEN` (Temuan Masuk) $\rightarrow$ `IN_PROGRESS` (Dalam Penanganan) $\rightarrow$ `CLOSED` (Tindakan Perbaikan Selesai).
- **Integritas Transisi**: Validasi ketat menolak lompatan status ilegal (seperti `OPEN` langsung ke `CLOSED`) atau regresi status dari `CLOSED`.
- **Audit Jejak Riwayat**: Tabel audit `finding_status_history` mencatat setiap perubahan status, waktu, dan administrator yang melakukan tindakan.
- **Arsip Aman (Soft Delete)**: Fitur pengarsipan temuan tanpa menghapus data secara permanen, menjaga integritas riwayat pelaporan.

### 📷 Penyimpanan Bukti Foto Terenkripsi (Private Evidence Storage)
- **Maksimal 3 Foto per Temuan**: Dibatasi secara ketat dan atomik di level transaksi basis data.
- **Validasi Binary Magic Bytes**: Memeriksa tanda tangan berkas asli (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `52 49 46 46 ... 57 45 42 50`) untuk mencegah *MIME type spoofing*.
- **Pencegahan Concurrency Race Condition**: Mekanisme *row-level locking* PostgreSQL (`SELECT ... FOR UPDATE`) mencegah lebih dari 3 foto terunggah saat terjadi *request* bersamaan.
- **Authenticated Streaming Content**: Berkas foto di Vercel Blob berstatus **PRIVATE** dan hanya dapat diakses melalui endpoint streaming terautentikasi (`GET /api/v1/findings/:id/evidences/:evidenceId/content`) dengan header keamanan:
  - `Cache-Control: private, no-store, max-age=0`
  - `X-Content-Type-Options: nosniff`

### 🔒 Autentikasi & Keamanan Administrator
- **Password Hashing**: Menggunakan bcrypt dengan 12 *salt rounds*.
- **Session Management**: Session aman berbasis cookie HttpOnly, SameSite, dan Secure (pada mode produksi) tersimpan di PostgreSQL via `connect-pg-simple`.
- **Brute Force Protection**: Pembatasan percobaan login untuk mengamankan kredensial administrator.
- **Sanitasi Error Produksi**: Penanganan error terpusat (`errorMiddleware`) yang menyaring pesan exception internal 500 di lingkungan *production*, melindungi struktur skema dan kredensial server.
- **Security Headers & CORS**: Menggunakan *Helmet* dan pembatasan origin CORS/CSRF yang dapat dikonfigurasi.

### 📱 Progressive Web App (PWA)
- **Mobile-First Experience**: Antarmuka adaptif dan ergonomis pada gawai *smartphone*, tablet, maupun desktop.
- **Zero-Friction Installation**: Dapat di-instal ke layar utama gawai (*Add to Home Screen*) melalui Web App Manifest standar.
- **Workbox Caching**: Service Worker meng-cache aset statis untuk pemuatan instan, dengan rute `/api/*` yang secara eksplisit menggunakan strategi `NetworkOnly` guna menjamin kebaruan data.

---

## 3. Teknologi & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Komponen berbasis fungsi dan type safety |
| **Build Tool & Bundler** | Vite 8 | Kompilasi ultra-cepat dan HMR |
| **Styling** | Tailwind CSS v4 | Antarmuka responsif dan modern |
| **PWA Engine** | Vite-Plugin-PWA + Workbox | Registrasi Service Worker dan offline asset caching |
| **Form & Validasi** | React Hook Form + Zod | Validasi skema deklaratif sisi klien dan peladen |
| **Ikonografi** | Lucide React | Ikon antarmuka K3 yang konsisten |
| **Backend Runtime** | Node.js 26.x (Active LTS) | Platform eksekusi JavaScript performa tinggi |
| **Backend Framework** | Express.js 5 | REST API framework dengan middleware modular |
| **Serverless Deployment** | Vercel Serverless Functions | Catch-all handler `api/[...path].js` |
| **Basis Data** | Neon PostgreSQL (v18.7) | Database relasional serverless dengan koneksi pooled |
| **Penyimpanan Media** | Vercel Blob Private Storage | Cloud storage privat untuk bukti foto temuan |
| **Keamanan** | bcrypt, Helmet, express-session | Enkripsi, perlindungan header, dan manajemen sesi |

---

## 4. Prasyarat Sistem

Sebelum menjalankan proyek, pastikan lingkungan komputer telah terpasang:
- **Node.js**: Versi `26.x` (disarankan menggunakan versi Active LTS).
- **npm**: Versi `11.x` (bawaan dari Node.js 26).
- **PostgreSQL Database**: Akun Neon PostgreSQL (atau PostgreSQL 15+ lokal/cloud).
- **Vercel Blob Token**: Diperlukan untuk unggah foto bukti di mode *live*.

---

## 5. Konfigurasi Variabel Lingkungan

Salin file contoh konfigurasi `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Sesuaikan isi berkas `.env` dengan kredensial Anda:

```ini
# Database Neon PostgreSQL (Gunakan pooled connection string)
DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.c-2.neon.tech/[dbname]?sslmode=require

# Port Backend Standalone
API_PORT=3001

# Lingkungan Runtime (development / production / test)
NODE_ENV=development

# Allowed CORS Origins (pisahkan koma)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Vercel Blob Storage Token (Opsional untuk pengujian Blob lokal)
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxx

# Database Pengujian Concurrency Terisolasi (Opsional)
# TEST_DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.c-2.neon.tech/test_db?sslmode=require
```

> [!WARNING]
> Jangan pernah mencantumkan atau mengunggah berkas `.env` yang berisi kredensial nyata ke *version control* (Git).

---

## 6. Instalasi & Setup Basis Data

1. **Pasang Dependensi**:
   ```bash
   npm install
   ```

2. **Periksa Koneksi Basis Data**:
   ```bash
   npm run db:check
   ```

3. **Jalankan Migrasi Skema Basis Data**:
   Pastikan skema awal dan migrasi telah diterapkan ke database Neon:
   - Skema Inti: `server/database/schema.sql`
   - Migrasi 001: `server/database/migrations/001_phase_2_1_schema_alignment.sql`
   - Migrasi 002: `server/database/migrations/002_schema_contract_alignment.sql`

4. **Inisialisasi Akun Administrator Awal**:
   Jalankan script pembuatan akun administrator:
   ```bash
   npm run admin:create
   ```

---

## 7. Menjalankan Aplikasi di Lingkungan Lokal

Aplikasi dapat dijalankan dalam beberapa mode:

### Mode Pengembangan (Development)
Jalankan kedua perintah berikut pada dua terminal terpisah:

**Terminal 1 — Backend Express API**:
```bash
npm run dev:api
# API berjalan di http://localhost:3001
```

**Terminal 2 — Frontend Vite PWA**:
```bash
npm run dev
# PWA Frontend berjalan di http://localhost:5173 (dengan reverse proxy /api ke 3001)
```

### Mode Produksi (Production Build & Test)
Untuk menguji hasil kompilasi produksi:

```bash
# 1. Jalankan Type Check & Vite Build
npm run build

# 2. Jalankan Backend Standalone
npm run start:api
```

---

## 8. Pengujian & Kualitas Kode

Proyek ini dilengkapi dengan rangkaian pengujian otomatis (*automated test suite*) yang mencakup 147 skenario pengujian unit, integrasi, dan keamanan.

### Menjalankan Automated Test Suite
```bash
npm test
```
*Mengeksekusi 147 pengujian pada 13 seksi verifikasi arsitektural.*

### Linting Kode
```bash
npm run lint
```
*Memeriksa konsistensi kode menggunakan ESLint dan TypeScript Rules.*

### Pengujian Khusus Concurrency (PostgreSQL Row-Level Locking)
Untuk memverifikasi keandalan batas 3 foto pada kondisi *high-concurrency*:
```bash
npm run test:concurrency:live
```
*(Membutuhkan variabel `TEST_DATABASE_URL` yang terpisah dari database utama).*

### Pengujian Khusus Vercel Blob Storage
Untuk memverifikasi operasi *upload*, *streaming*, dan *delete* nyata pada Vercel Blob:
```bash
npm run test:blob:live
```
*(Membutuhkan variabel `BLOB_READ_WRITE_TOKEN`).*

---

## 9. Struktur Proyek

```text
Program/
├── api/
│   └── [...path].js               # Vercel Serverless Function (Catch-all handler)
├── public/
│   ├── favicon.svg                # Favicon utama aplikasi
│   ├── pwa-192x192.svg            # Ikon PWA 192px
│   └── pwa-512x512.svg            # Ikon PWA 512px
├── server/
│   ├── config/                    # Konfigurasi database pool
│   ├── controllers/               # Controller (Auth, Finding, Dashboard, Health)
│   ├── database/
│   │   ├── migrations/            # SQL migration scripts (001, 002)
│   │   └── schema.sql             # Skema basis data kanonis
│   ├── middleware/                # Error handling, Auth, Security, Origin
│   ├── models/                    # Data Access Objects & Row-Level Lock Logic
│   ├── routes/                    # Express route definitions
│   ├── scripts/                   # Utilitas administratif & automated test runner
│   ├── services/                  # Business logic & Vercel Blob Service
│   ├── app.js                     # Inisialisasi Express Application
│   └── index.js                   # Server entrypoint untuk mode standalone
├── src/
│   ├── assets/                    # Direktori aset grafis lokal
│   ├── components/                # Komponen UI (Navbar, Forms, Cards, Badges)
│   ├── context/                   # React Context (Auth State)
│   ├── pages/                     # Halaman aplikasi (Dashboard, Finding, Login, About)
│   ├── services/                  # Client-side API Services (Fetch & Upload)
│   ├── types/                     # TypeScript Interfaces & Enums
│   ├── App.tsx                    # Layout utama & Router
│   └── main.tsx                   # Frontend entry point
├── test/
│   └── test-verification.ts       # Suite 147 automated verification tests
├── vercel.json                    # Konfigurasi routing Vercel Serverless & SPA
├── vite.config.ts                 # Konfigurasi Vite, Tailwind, dan Workbox PWA
└── package.json                   # Dependensi & script eksekusi npm
```

---

## 10. Deployment ke Platform Vercel

Aplikasi ini dikonfigurasi secara *native* untuk platform Vercel:

1. **Impor Repositori**: Hubungkan repositori GitHub/GitLab ke Vercel.
2. **Framework Preset**: Pilih **Vite**.
3. **Environment Variables**: Daftarkan variabel berikut pada pengaturan proyek Vercel:
   - `DATABASE_URL`: Connection string Neon PostgreSQL (pooled).
   - `NODE_ENV`: `production`.
   - `ALLOWED_ORIGINS`: URL domain Vercel Anda (misal: `https://spld-safety.vercel.app`).
4. **Vercel Blob Private Store**:
   - Buka tab **Storage** di dashboard Vercel.
   - Buat store baru berjenis **Blob** dengan akses **Private**.
   - Hubungkan (*Connect*) Blob Store tersebut ke proyek SPLD SAFETY. Vercel akan otomatis menyuntikkan `BLOB_READ_WRITE_TOKEN`.
5. **Deploy**: Jalankan deployment. Vercel akan mengompilasi Frontend SPA dan mengekspos endpoint API melalui serverless handler `api/[...path].js`.

---

## 11. Informasi Pengembang & Akademik

Proyek ini disusun sebagai pemenuhan **Tugas Akhir Praktikum Pemrograman Perangkat Bergerak**.  
Sistem ini mengimplementasikan standar industri keselamatan kerja (K3) dengan prinsip rekayasa perangkat lunak modern: *clean architecture*, *defensive programming*, *strict typing*, dan kepatuhan penuh terhadap prinsip ACID pada transaksi basis data.
