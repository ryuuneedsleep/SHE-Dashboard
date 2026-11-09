import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  LogIn,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandLogo } from '../components/common/BrandLogo';
import { authService } from '../services/authService';
import type { RegistrationRequest } from '../types/auth';

export const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();

  const stateData = (location.state as { registration?: RegistrationRequest })?.registration;
  const registration: RegistrationRequest =
    stateData ||
    authService.getLatestPendingRegistration() || {
      registrationId: 'REG-2026-9921',
      fullName: 'Ahmad Fauzi',
      noreg: 'TAM-9012',
      phone: '081234567890',
      email: 'ahmad.fauzi@toyota.co.id',
      department: 'Warehouse',
      section: 'Receiving & Inbound Area',
      position: 'Staff',
      requestedRole: 'Member / Reporter',
      accountStatus: 'Pending',
      registrationDate: new Date().toISOString(),
    };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Registration Submitted Successfully
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            SPLD Safety Management System • Application Registration
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Success Banner */}
          <div className="bg-emerald-500/10 border-b border-emerald-200 p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 mb-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reference: {registration.registrationId}</span>
              </div>
              <h2 className="text-base font-bold text-gray-900">
                Request Created with Pending Status
              </h2>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Thank you, <strong>{registration.fullName}</strong>. Your registration request has
                been securely processed and assigned the default requested role{' '}
                <span className="font-semibold">"Member / Reporter"</span>.
              </p>
            </div>
          </div>

          {/* Details & Next Steps */}
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Next Steps in Onboarding
              </h3>

              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Request Logged & Encrypted',
                    desc: 'Your account record is provisioned with in-memory encryption. Plaintext passwords are never stored.',
                    done: true,
                  },
                  {
                    step: '2',
                    title: 'QSHE Division Verification',
                    desc: 'Safety administrators confirm employee identity, department alignment, and division area.',
                    done: false,
                  },
                  {
                    step: '3',
                    title: 'Role Governance in Module 02',
                    desc: 'Admin approves or adjusts role assignment (Member / Reporter or Section Safety Officer).',
                    done: false,
                  },
                  {
                    step: '4',
                    title: 'Operational Access Activation',
                    desc: 'Once activated, login permits access to incident reporting and 5S observation tools.',
                    done: false,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-xs"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        item.done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-[11px] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crucial Governance Reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Important Notice:</span> Attempting to login
                before QSHE approval will display your pending review status. Protected operational modules remain locked.
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                to="/registration-pending"
                state={{ registration }}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
                >
                  View Pending Status Page
                </Button>
              </Link>

              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  rightIcon={<LogIn className="w-4 h-4" />}
                >
                  Proceed to Login Interface
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
