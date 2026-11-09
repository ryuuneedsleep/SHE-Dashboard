import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { safetyService } from '../../services/safetyService';
import type { FindingLifecycleStatus } from '../../types/safety';
import { FindingFormModal } from '../../components/findings/FindingFormModal';
import { Button } from '../../components/common/Button';
import {
  FileText,
  PlusCircle,
  Search,
  Clock,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const MyFindingsPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FindingLifecycleStatus>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Fetch exclusively personal reports
  const myFindings = refreshKey >= 0 ? safetyService.getMyFindings(currentUser) : [];

  // Compute personal metrics
  const totalSubmitted = myFindings.length;
  const openCount = myFindings.filter(
    (f) => f.status === 'Submitted' || f.status === 'Under Review' || f.status === 'Accepted'
  ).length;
  const inProgressCount = myFindings.filter((f) => f.status === 'In Progress').length;
  const completedCount = myFindings.filter((f) => f.status === 'Resolved' || f.status === 'Closed').length;

  const filteredFindings = myFindings.filter((f) => {
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.referenceNo.toLowerCase().includes(q) ||
      f.operationalAreaName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: FindingLifecycleStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accepted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Laporan Temuan Keselamatan Saya
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                Personal Submissions
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Pantau status penanganan dan hasil verifikasi temuan bahaya yang telah Anda laporkan.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Laporkan Temuan Baru
          </Button>
        </div>

        {/* 4 Personal Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Terkirim</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalSubmitted}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Menunggu / Evaluasi</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{openCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Dalam Tindak Lanjut</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{inProgressCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Selesai / Terverifikasi</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, nomor ref, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-500 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | FindingLifecycleStatus)}
              className="py-2 px-3 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            >
              <option value="ALL">Semua Status</option>
              <option value="Submitted">Submitted (Baru)</option>
              <option value="Under Review">Under Review (Evaluasi)</option>
              <option value="Accepted">Accepted (Diterima)</option>
              <option value="In Progress">In Progress (Tindak Lanjut)</option>
              <option value="Resolved">Resolved (Selesai)</option>
              <option value="Closed">Closed (Ditutup)</option>
              <option value="Rejected">Rejected (Ditolak)</option>
            </select>
          </div>
        </div>

        {/* Findings List Table Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-900 text-xs">
            Riwayat Laporan Temuan Saya ({filteredFindings.length} Laporan)
          </div>

          {filteredFindings.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-800">Belum ada laporan temuan</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Jika Anda melihat kondisi atau tindakan tidak aman saat bekerja, laporkan segera demi keselamatan bersama.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No. Ref</th>
                    <th className="py-3 px-3">Judul Temuan</th>
                    <th className="py-3 px-3">Jalur</th>
                    <th className="py-3 px-3">Area Operasional</th>
                    <th className="py-3 px-3">Tingkat Risiko</th>
                    <th className="py-3 px-3">Tanggal Lapor</th>
                    <th className="py-3 px-3">Status Terkini</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredFindings.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <Link to={`/findings/${f.id}`} className="hover:text-[#EB0A1E] hover:underline">
                          {f.referenceNo}
                        </Link>
                      </td>
                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-semibold text-gray-900 truncate" title={f.title}>
                          {f.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate" title={f.description}>
                          {f.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            f.source === 'DIRECT'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {f.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                        {f.operationalAreaName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: f.riskDisplayColor || '#EF4444' }}
                        >
                          {f.riskLevelName}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-gray-500 text-[11px]">
                        {new Date(f.reportedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            f.status
                          )}`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Link to={`/findings/${f.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Eye className="w-3.5 h-3.5 text-gray-600 mr-1" />
                            <span>Lihat Progres</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Direct Finding Creation Modal */}
      <FindingFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        currentUser={currentUser}
        source="DIRECT"
      />
    </div>
  );
};
