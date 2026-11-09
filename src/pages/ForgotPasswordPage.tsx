import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../utils/validation';
import { authService } from '../services/authService';
import { InputField } from '../components/common/InputField';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  Mail,
  KeyRound,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    submitted: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await authService.forgotPassword(values.email);
      setFeedback({
        submitted: true,
        message: result.message,
      });
    } catch {
      setFeedback({
        submitted: false,
        message: 'Unable to process recovery request at this time.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <BrandLogo size="md" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Forgot Password
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Account Credential Recovery & Identity Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-gray-200 rounded-xl space-y-6">
          {/* Identity Architecture Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <ShieldAlert className="w-4 h-4 text-[#EB0A1E]" />
              <span>Enterprise Identity Notice</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              SPLD SAFETY adheres to corporate authentication standards. For production
              environments, password recovery is federated via <strong>Microsoft Entra ID (SSPR)</strong> or
              the corporate IT Helpdesk.
            </p>
          </div>

          {feedback?.submitted ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Recovery Protocol Triggered</div>
                  <p className="leading-relaxed text-emerald-800">{feedback.message}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-200 space-y-2">
                <div className="font-semibold text-gray-900">Next Action:</div>
                <p className="text-[11px]">
                  Check your corporate inbox for the self-service reset token or contact your
                  designated Division QSHE Administrator if you require assistance with your account.
                </p>
              </div>

              <div className="pt-2">
                <Link to="/login">
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <InputField
                label="Registered Corporate Email"
                type="email"
                placeholder="e.g. employee.name@toyota.co.id"
                required
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                helperText="Enter the email address registered with your employee profile"
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isSubmitting}
                className="mt-2"
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Send Recovery Request
              </Button>

              <div className="pt-4 border-t border-gray-200 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
