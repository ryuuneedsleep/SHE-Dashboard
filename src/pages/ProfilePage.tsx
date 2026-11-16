import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mockAuthService } from '../services/mock/mockAuthService.ts';
import { profileFormSchema, type ProfileFormData } from '../utils/validation.ts';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Edit3,
  LogOut,
  Save,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = mockAuthService.getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      position: currentUser?.position || '',
      department: currentUser?.department || '',
    },
  });

  const handleLogout = async () => {
    await mockAuthService.logout();
    navigate('/login');
  };

  const onSubmit = async (data: ProfileFormData) => {
    await mockAuthService.updateProfile(data);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
            Kelola data akun dan sesi administrator demo
          </p>
        </div>
      </div>

      {/* Demo Mode Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Demo Mode:</span> Perubahan profil hanya tersimpan sementara pada browser session dan belum dihubungkan ke database server.
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profil berhasil diperbarui dalam sesi demo!</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-red-600 to-rose-700 p-4 flex items-end">
          <div className="w-16 h-16 rounded-full bg-white text-red-600 border-4 border-white shadow-md flex items-center justify-center font-bold text-xl translate-y-8">
            <User className="w-8 h-8" />
          </div>
        </div>

        <div className="pt-10 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {currentUser?.name || 'Administrator Demo'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentUser?.position || 'Safety Administrator'} • {currentUser?.department || 'QSHE & Jiritsuka'}
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profil</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {currentUser?.email || 'admin@spld-safety.test'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Telepon</span>
                  <span className="font-semibold text-slate-800 block">
                    {currentUser?.phone || '0812-3456-7890'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Jabatan</span>
                  <span className="font-semibold text-slate-800 block">
                    {currentUser?.position || 'Safety Administrator'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Departemen</span>
                  <span className="font-semibold text-slate-800 block">
                    {currentUser?.department || 'QSHE & Jiritsuka'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                <input
                  type="text"
                  {...register('position')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.position && <p className="text-[11px] text-red-500 mt-1">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen</label>
                <input
                  type="text"
                  {...register('department')}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                {errors.department && <p className="text-[11px] text-red-500 mt-1">{errors.department.message}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          )}

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
    </div>
  );
};
