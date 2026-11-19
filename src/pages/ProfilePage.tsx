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
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#000000] tracking-tight">
            Profil Administrator
          </h1>
          <p className="text-xs text-[#666666]">
            Informasi akun dan status sesi aktif Administrator
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[4px] p-3 flex items-center gap-2 text-xs text-[#15803D]">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-[6px] border border-[#E5E7EB] shadow-xs overflow-hidden">
        {/* Banner (Solid Primary Red #9E2638, No Gradient) */}
        <div className="h-24 bg-[#9E2638] p-4 flex items-end justify-between">
          <div className="w-16 h-16 rounded-[4px] bg-white text-[#9E2638] border-2 border-[#E5E7EB] shadow-xs flex items-center justify-center font-bold text-xl translate-y-8">
            <User className="w-8 h-8" />
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F7F8FA] text-[#333333] border border-[#E5E7EB] rounded-[4px] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#9E2638]" />
            <span>Edit Profil</span>
          </button>
        </div>

        <div className="pt-10 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#000000]">
                {user?.fullName || user?.name || 'Administrator'}
              </h2>
              <p className="text-xs text-[#666666]">
                {user?.position || 'Safety Administrator'} &bull; QSHE & Lead Safety
              </p>
            </div>
          </div>

          {/* View Details */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB] text-xs">
            <div className="flex items-center gap-3 p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <Mail className="w-4 h-4 text-[#666666] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#666666] block uppercase font-semibold">Email</span>
                <span className="font-medium text-[#000000] truncate block">
                  {user?.email || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <Phone className="w-4 h-4 text-[#666666] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#666666] block uppercase font-semibold">Telepon</span>
                <span className="font-medium text-[#000000] block">
                  {user?.phone || 'Belum diisi'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <Briefcase className="w-4 h-4 text-[#666666] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#666666] block uppercase font-semibold">Jabatan</span>
                <span className="font-medium text-[#000000] block">
                  {user?.position || 'Lead Safety Officer'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB]">
              <Building2 className="w-4 h-4 text-[#666666] shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#666666] block uppercase font-semibold">Departemen</span>
                <span className="font-medium text-[#000000] block">
                  QSHE & Jiritsuka
                </span>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] rounded-[4px] text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Sesi Administrator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-md border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-sm text-[#000000]">Edit Profil Administrator</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[#666666] hover:text-[#000000] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.name && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.email && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.phone && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  {...register('position')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.position && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1">
                  Departemen
                </label>
                <input
                  type="text"
                  {...register('department')}
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] py-2 px-3 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
                />
                {errors.department && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{errors.department.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] text-xs font-semibold text-[#333333] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-[4px] bg-[#9E2638] hover:bg-[#7F1F2E] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
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
