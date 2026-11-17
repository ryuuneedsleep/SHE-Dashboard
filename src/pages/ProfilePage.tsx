import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/useAuth.ts';
import { profileService } from '../services/profileService.ts';
import { profileFormSchema, type ProfileFormData } from '../utils/validation.ts';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  LogOut,
  ShieldCheck,
  Edit3,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, checkSession } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    values: {
      name: user?.fullName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '081234567890',
      position: user?.position || 'Safety Administrator',
      department: user?.department || 'QSHE & Jiritsuka',
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleOpenEdit = () => {
    reset({
      name: user?.fullName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || '',
      department: user?.department || 'QSHE & Jiritsuka',
    });
    setUpdateError(null);
    setIsEditing(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setUpdateError(null);

    try {
      await profileService.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
      });

      await checkSession();
      setIsEditing(false);
      setSuccessMessage('Profil Administrator berhasil diperbarui.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profil Administrator
          </h1>
          <p className="text-xs text-slate-500">
            Informasi akun dan status sesi aktif Administrator
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Verified Session Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Sesi Aktif Terverifikasi:</span> Anda terautentikasi sebagai Administrator sistem SPLD SAFETY via database Neon PostgreSQL.
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-red-600 to-rose-700 p-4 flex items-end justify-between">
          <div className="w-16 h-16 rounded-full bg-white text-red-600 border-4 border-white shadow-md flex items-center justify-center font-bold text-xl translate-y-8">
            <User className="w-8 h-8" />
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-red-600" />
            <span>Edit Profil</span>
          </button>
        </div>

        <div className="pt-10 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {user?.fullName || user?.name || 'Administrator'}
              </h2>
              <p className="text-xs text-slate-500">
                {user?.position || 'Safety Administrator'} • QSHE & Lead Safety
              </p>
            </div>
          </div>

          {/* View Details */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {user?.email || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Telepon</span>
                <span className="font-semibold text-slate-800 block">
                  {user?.phone || 'Belum diisi'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Jabatan</span>
                <span className="font-semibold text-slate-800 block">
                  {user?.position || 'Lead Safety Officer'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Departemen</span>
                <span className="font-semibold text-slate-800 block">
                  QSHE & Jiritsuka
                </span>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Sesi Administrator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-red-600" />
                <span>Edit Profil Administrator</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {updateError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="081234567890"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  {...register('position')}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.position && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.position.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Profil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
