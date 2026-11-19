import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  Cpu,
  Layers,
  CheckCircle,
  Heart,
  Code,
  Database,
  Server,
  Lock,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero Card (Solid Primary Red #9E2638, Strictly No Gradient) */}
      <div className="bg-[#9E2638] rounded-[6px] p-6 text-white shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[4px] bg-white/15">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
              SPLD SAFETY
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5">
              Service Parts Logistic Division &bull; Safety Management System
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-white/90 leading-relaxed pt-1">
          Aplikasi pelaporan dan manajemen keselamatan kerja (K3) berbasis Progressive Web Application (PWA).
          Dirancang untuk mempercepat alur pelaporan temuan unsafe condition, unsafe action, serta peluang
          perbaikan lingkungan kerja secara terstruktur dan real-time.
        </p>
      </div>

      {/* Academic / Project Context Banner */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#000000] uppercase tracking-wide">
          <Smartphone className="w-4 h-4 text-[#9E2638]" />
          <span>Konteks Proyek</span>
        </div>
        <p className="text-xs text-[#333333] leading-relaxed">
          Aplikasi ini dikembangkan sebagai <strong>Tugas Akhir Praktikum Pemrograman Perangkat Bergerak</strong>.
          Fokus utama aplikasi adalah pemanfaatan kapabilitas Progressive Web Application (PWA) modern:
          mobile-first responsiveness, performa cepat, zero-friction installability (Add to Home Screen),
          dan antarmuka pengguna yang adaptif terhadap berbagai ukuran layar gawai cerdas.
        </p>
      </div>

      {/* Main Features */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
          <CheckCircle className="w-4 h-4 text-[#16A34A]" />
          <span>Fitur Utama Aplikasi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
            <span className="font-bold text-[#000000] block">Universal K3 Dashboard</span>
            <p className="text-[#333333] leading-relaxed">
              Monitoring 5 KPI kunci, Monthly Finding Trend SVG chart, dan visualisasi distribusi risiko serta kategori temuan.
            </p>
          </div>

          <div className="p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
            <span className="font-bold text-[#000000] block">Pelaporan Cepat (Direct Finding)</span>
            <p className="text-[#333333] leading-relaxed">
              Formulir terstandar untuk melaporkan kondisi bahaya dengan klasifikasi divisi, kategori bahaya, dan detail lokasi operasional.
            </p>
          </div>

          <div className="p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
            <span className="font-bold text-[#000000] block">Dokumentasi Foto Bukti K3 (Private Storage)</span>
            <p className="text-[#333333] leading-relaxed">
              Dukungan dokumentasi hingga 3 foto (JPEG/PNG/WebP, maks. 5MB) dengan validasi konten, penyimpanan cloud privat terenkripsi, dan streaming aman khusus Administrator.
            </p>
          </div>

          <div className="p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] space-y-1">
            <span className="font-bold text-[#000000] block">Siklus Hidup Terstandar (3 Status)</span>
            <p className="text-[#333333] leading-relaxed">
              Alur pelacakan sederhana dan jelas: OPEN (Temuan Masuk) → IN PROGRESS (Penanganan) → CLOSED (Tindakan Selesai).
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#000000] uppercase tracking-wide border-b border-[#E5E7EB] pb-2">
          <Cpu className="w-4 h-4 text-[#2563EB]" />
          <span>Teknologi & Arsitektur</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-medium text-[#333333]">
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>React 19 & TypeScript</span>
          </div>
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Express.js REST API</span>
          </div>
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>PostgreSQL Database</span>
          </div>
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Private Evidence Storage</span>
          </div>
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Tailwind CSS</span>
          </div>
          <div className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-[#9333EA]" />
            <span>Vite PWA & Workbox</span>
          </div>
        </div>
      </div>

      {/* Developer Information */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#000000] uppercase tracking-wide">
          <Heart className="w-4 h-4 text-[#9E2638]" />
          <span>Informasi Pengembang</span>
        </div>
        <p className="text-xs text-[#333333] leading-relaxed">
          Aplikasi ini dikembangkan sebagai <strong>Tugas Akhir Praktikum Pemrograman Perangkat Bergerak</strong>, Sistem Manajemen Keselamatan Kerja (K3) Service Parts Logistic Division (SPLD).
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
