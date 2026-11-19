import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../utils/validation.ts';
import { useAuth } from '../context/useAuth.ts';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({
        email: values.email,
        password: values.password,
      });

      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Login gagal. Periksa kembali email dan password Anda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px] mx-auto space-y-6">
        {/* Brand & Title (Clean Typography) */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-black text-[#000000] tracking-tight">
            SPLD <span className="text-[#9E2638]">SAFETY</span>
          </h1>
          <p className="text-xs text-[#666666] font-medium tracking-wide">
            Safety Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-[#E5E7EB] rounded-[6px] space-y-5">
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[4px] text-[#991B1B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Email Administrator
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@spld-safety.test"
                  autoComplete="email"
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638] transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full text-xs text-[#000000] rounded-[4px] border border-[#E5E7EB] pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638] transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-[#DC2626] mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#9E2638] hover:bg-[#7F1F2E] text-white rounded-[4px] text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Memverifikasi Sesi...' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
