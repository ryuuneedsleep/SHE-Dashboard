import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../utils/validation';
import { authService } from '../services/authService';
import { InputField } from '../components/common/InputField';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  Mail,
  Lock,
  AlertCircle,
  Clock,
  XCircle,
  AlertTriangle,
  UserX,
  ArrowRight,
} from 'lucide-react';
import type { LoginResult } from '../types/auth';
import { DEMO_ACCOUNTS } from '../data/demoAccounts';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<LoginResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setLoginFeedback(null);

    try {
      const result = await authService.login(values.email, values.password);

      if (result.success && result.status === 'Active') {
        // Successful login for Active user -> navigate to dashboard
        const from = (location.state as { from?: string })?.from || '/dashboard';
        navigate(from, { replace: true });
        return;
      }

      // Handle non-active or failure conditions
      setLoginFeedback(result);
    } catch {
      setLoginFeedback({
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'An unexpected system error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setLoginFeedback(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <BrandLogo size="lg" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Sign In to Your Safety Account
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Enter your division credentials to access operational safety tools
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-gray-200 rounded-xl space-y-6">
          {/* Status-specific feedback banners */}
          {loginFeedback && !loginFeedback.success && (
            <div
              className={`rounded-lg p-4 border text-xs space-y-2 animate-in fade-in duration-200 ${
                loginFeedback.errorCode === 'PENDING_APPROVAL'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : loginFeedback.errorCode === 'ACCOUNT_REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : loginFeedback.errorCode === 'ACCOUNT_SUSPENDED'
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : loginFeedback.errorCode === 'ACCOUNT_INACTIVE'
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {loginFeedback.errorCode === 'PENDING_APPROVAL' && (
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                {loginFeedback.errorCode === 'ACCOUNT_REJECTED' && (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                {loginFeedback.errorCode === 'ACCOUNT_SUSPENDED' && (
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                )}
                {loginFeedback.errorCode === 'ACCOUNT_INACTIVE' && (
                  <UserX className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                )}
                {loginFeedback.errorCode === 'INVALID_CREDENTIALS' && (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}

                <div className="space-y-1">
                  <div className="font-bold">
                    {loginFeedback.errorCode === 'PENDING_APPROVAL' &&
                      'Registration Pending Approval'}
                    {loginFeedback.errorCode === 'ACCOUNT_REJECTED' &&
                      'Registration Not Approved'}
                    {loginFeedback.errorCode === 'ACCOUNT_SUSPENDED' &&
                      'Account Access Restricted'}
                    {loginFeedback.errorCode === 'ACCOUNT_INACTIVE' &&
                      'Account Inactive'}
                    {loginFeedback.errorCode === 'INVALID_CREDENTIALS' &&
                      'Authentication Failed'}
                  </div>
                  <p className="leading-relaxed">{loginFeedback.errorMessage}</p>

                  {/* Actions for Pending accounts */}
                  {loginFeedback.errorCode === 'PENDING_APPROVAL' && (
                    <div className="pt-2">
                      <Link
                        to="/registration-pending"
                        state={{ registration: loginFeedback.registrationDetails }}
                        className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-black underline"
                      >
                        <span>View Pending Registration Status Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Action for Rejected accounts */}
                  {loginFeedback.errorCode === 'ACCOUNT_REJECTED' && (
                    <div className="pt-1 text-[11px] text-rose-800">
                      You may contact QSHE Division Ext. 4420 or submit an updated registration inquiry with your Department Leader.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Corporate Email Address"
              type="email"
              placeholder="e.g. your.name@toyota.co.id"
              autoComplete="email"
              required
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <InputField
              label="Password"
              type="password"
              placeholder="Enter your account password"
              autoComplete="current-password"
              required
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#EB0A1E] focus:ring-[#EB0A1E] h-4 w-4"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-gray-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#EB0A1E] hover:text-[#C80818] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              isLoading={isLoading}
              className="mt-2"
            >
              Sign In to SPLD Safety
            </Button>
          </form>

          {/* Registration link */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Not registered as a division member yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[#EB0A1E] hover:text-[#C80818] transition-colors"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>

        {/* Prototype Quick-Fill Bar */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EB0A1E]" />
              Quick Fill Prototype Accounts
            </span>
            <span className="text-[10px] text-gray-400">One-click test</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc.email, acc.pass)}
                className="text-left p-2 rounded border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors text-[11px]"
              >
                <div className="font-semibold text-gray-900 truncate">
                  {acc.status} Account
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {acc.name.split(' ')[0]} ({acc.dept})
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
