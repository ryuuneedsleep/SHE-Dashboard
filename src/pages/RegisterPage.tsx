import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registrationSchema,
  type RegistrationFormValues,
} from '../utils/validation';
import { authService } from '../services/authService';
import { masterDataService } from '../services/masterDataService';
import {
  DEPARTMENT_OPTIONS,
  SAMPLE_SECTION_OPTIONS,
  POSITION_OPTIONS,
  REGISTRATION_AGREEMENT_TEXT,
} from '../data/masterData';
import { InputField } from '../components/common/InputField';
import { SelectField } from '../components/common/SelectField';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import {
  User,
  BadgeAlert,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { RegistrationRequest } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      noreg: '',
      phone: '',
      email: '',
      department: undefined,
      otherDepartmentName: '',
      section: '',
      position: undefined,
      otherPositionName: '',
      password: '',
      confirmPassword: '',
      agreement: false,
    },
    mode: 'onTouched',
  });

  // Watch dynamic conditional fields
  const selectedDepartment = useWatch({ control, name: 'department' });
  const selectedPosition = useWatch({ control, name: 'position' });

  // Centralized Master Data (Single Source of Truth)
  const activeDepts = masterDataService.getActiveDepartments();
  const departmentOptions =
    activeDepts.length > 0
      ? activeDepts.map((d) => ({ value: d.name, label: d.name }))
      : DEPARTMENT_OPTIONS;

  // Filter sections dynamically if parent department is selected
  const parentDeptRecord = activeDepts.find((d) => d.name === selectedDepartment);
  const activeSecs = masterDataService.getActiveSections(parentDeptRecord?.id);
  const sectionOptions =
    activeSecs.length > 0
      ? activeSecs.map((s) => ({ value: s.name, label: s.name }))
      : SAMPLE_SECTION_OPTIONS.map((s) => ({ value: s.name, label: s.name }));

  const activePos = masterDataService.getActivePositions();
  const positionOptions =
    activePos.length > 0
      ? activePos.map((p) => ({ value: p.name, label: p.name }))
      : POSITION_OPTIONS;

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // 1. Asynchronous check for duplicate Noreg
      const isNoregAvailable = await authService.checkNoregAvailability(values.noreg);
      if (!isNoregAvailable) {
        setError('noreg', {
          type: 'manual',
          message: `Employee Number (Noreg) "${values.noreg}" is already registered.`,
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Asynchronous check for duplicate Email
      const isEmailAvailable = await authService.checkEmailAvailability(values.email);
      if (!isEmailAvailable) {
        setError('email', {
          type: 'manual',
          message: `Email address "${values.email}" is already registered in the system.`,
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Submit registration request (Strictly decoupled, passwords never stored in registration model)
      const newRequest: RegistrationRequest = await authService.register(values);

      // 4. Navigate to Registration Success / Information Page
      navigate('/registration-success', {
        state: { registration: newRequest },
        replace: true,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please check your data and retry.';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Member Registration
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            Register as a member of Service Parts Logistic Division (SPLD) to report
            hazards, track 5S compliance, and participate in safety kaizen.
          </p>
        </div>

        {/* Global Error Banner */}
        {submissionError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Submission Blocked</div>
              <p className="mt-0.5">{submissionError}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden space-y-8 p-6 sm:p-8"
        >
          {/* SECTION A: PERSONAL INFORMATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200">
              <span className="w-6 h-6 rounded-md bg-[#EB0A1E] text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                  Personal Information
                </h2>
                <p className="text-[11px] text-gray-500">
                  All fields are mandatory. Employee number (Noreg) must be unique.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Name (Nama Lengkap)"
                placeholder="e.g. Ahmad Fauzi"
                required
                leftIcon={<User className="w-4 h-4" />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <InputField
                label="Employee Number / Noreg"
                placeholder="e.g. TAM-9012"
                required
                leftIcon={<BadgeAlert className="w-4 h-4" />}
                error={errors.noreg?.message}
                helperText="Unique employee identity number"
                {...register('noreg')}
              />

              <InputField
                label="Mobile Phone Number"
                type="tel"
                placeholder="e.g. 081234567890"
                required
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                helperText="Used for critical safety alerts & OTP"
                {...register('phone')}
              />

              <InputField
                label="Corporate Email Address"
                type="email"
                placeholder="e.g. ahmad.fauzi@toyota.co.id"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                helperText="Corporate or division email"
                {...register('email')}
              />
            </div>
          </section>

          {/* SECTION B: WORK INFORMATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200">
              <span className="w-6 h-6 rounded-md bg-[#EB0A1E] text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                  Work Information
                </h2>
                <p className="text-[11px] text-gray-500">
                  Select your department, section, and position from master data.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department Dropdown (Centralized Master Data) */}
              <div className="space-y-4 sm:col-span-1">
                <SelectField
                  label="Department"
                  required
                  placeholder="-- Select Department --"
                  options={departmentOptions}
                  error={errors.department?.message}
                  {...register('department')}
                />

                {/* Conditional Field: Other Department Name if "Lain-lain" is selected */}
                {selectedDepartment === 'Lain-lain' && (
                  <div className="p-3 bg-red-50/50 rounded-lg border border-red-200 animate-in fade-in duration-200">
                    <InputField
                      label="Other Department Name"
                      placeholder="Specify your department / unit name"
                      required
                      error={errors.otherDepartmentName?.message}
                      {...register('otherDepartmentName')}
                    />
                  </div>
                )}
              </div>

              {/* Section / Area Dropdown (Centralized Master Data, dynamically filtered by Department) */}
              <div className="space-y-4 sm:col-span-1">
                <SelectField
                  label="Section / Area"
                  required
                  placeholder="-- Select Section / Area --"
                  options={sectionOptions}
                  error={errors.section?.message}
                  helperText={
                    parentDeptRecord
                      ? `Filtered for ${parentDeptRecord.name} (${sectionOptions.length} active sections)`
                      : 'Configurable master data options'
                  }
                  {...register('section')}
                />
              </div>

              {/* Position / Jabatan Dropdown (Centralized Master Data) */}
              <div className="space-y-4 sm:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Position / Jabatan"
                    required
                    placeholder="-- Select Position --"
                    options={positionOptions}
                    error={errors.position?.message}
                    helperText="Does not grant administrative permissions automatically"
                    {...register('position')}
                  />

                  {/* Conditional Field: Other Position Name if "Other" is selected */}
                  {selectedPosition === 'Other' && (
                    <div className="p-3 bg-red-50/50 rounded-lg border border-red-200 animate-in fade-in duration-200 sm:col-span-1">
                      <InputField
                        label="Other Position Title"
                        placeholder="Specify official position title"
                        required
                        error={errors.otherPositionName?.message}
                        {...register('otherPositionName')}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Note on default role */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Default Role Assignment:</strong> All registrations create a standard{' '}
                <span className="font-semibold text-gray-900">Member / Reporter</span> request.
                Final administrative role authorizations are strictly managed by QSHE Admins in Module 02.
              </span>
            </div>
          </section>

          {/* SECTION C: ACCOUNT SECURITY */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200">
              <span className="w-6 h-6 rounded-md bg-[#EB0A1E] text-white text-xs font-bold flex items-center justify-center">
                C
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                  Account Security
                </h2>
                <p className="text-[11px] text-gray-500">
                  Password must be at least 8 characters with uppercase, number, and special character.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="New Password"
                type="password"
                placeholder="At least 8 characters"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <InputField
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Enterprise Security Standard:</strong> Plaintext passwords are never
                stored or logged. Future enterprise production will transition to Microsoft Entra ID SSO.
              </span>
            </div>
          </section>

          {/* SECTION D: AGREEMENT */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200">
              <span className="w-6 h-6 rounded-md bg-[#EB0A1E] text-white text-xs font-bold flex items-center justify-center">
                D
              </span>
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                  Terms & Safety Compliance Agreement
                </h2>
                <p className="text-[11px] text-gray-500">
                  Mandatory confirmation before submission.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#EB0A1E] focus:ring-[#EB0A1E] h-5 w-5 mt-0.5 flex-shrink-0"
                  {...register('agreement')}
                />
                <span className="text-xs text-gray-800 leading-relaxed font-medium">
                  {REGISTRATION_AGREEMENT_TEXT}
                </span>
              </label>

              {errors.agreement && (
                <p className="text-xs text-red-600 font-medium pl-8 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-600 inline-block" />
                  {errors.agreement.message}
                </p>
              )}
            </div>
          </section>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/login"
              className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Already registered? Return to Login
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full sm:w-auto px-8"
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Registration Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
