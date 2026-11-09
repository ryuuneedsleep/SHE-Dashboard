import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { BrandLogo } from '../components/common/BrandLogo';
import type { RegistrationRequest } from '../types/auth';
import { authService } from '../services/authService';

export const RegistrationPendingPage: React.FC = () => {
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Search lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active registration displayed
  const stateData = (location.state as { registration?: RegistrationRequest })?.registration;
  const initialRegistration: RegistrationRequest =
    stateData ||
    authService.getLatestPendingRegistration() || {
      registrationId: 'REG-2026-0001',
      fullName: 'Agus Pratama',
      noreg: 'TAM-8802',
      phone: '081234567891',
      email: 'agus.pratama@toyota.co.id',
      department: 'Warehouse',
      section: 'Receiving & Inbound Area',
      position: 'Operator',
      requestedRole: 'Member / Reporter',
      accountStatus: 'Pending',
      registrationDate: new Date().toISOString(),
    };

  const [currentReg, setCurrentReg] = useState<RegistrationRequest>(initialRegistration);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshNotice(
        `Status checked: Request ${currentReg.registrationId} remains ${currentReg.accountStatus} review by QSHE Administrator.`
      );
      setTimeout(() => setRefreshNotice(null), 4000);
    }, 600);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const found = authService.findRegistration(searchQuery);
    if (found) {
      setCurrentReg(found);
      setRefreshNotice(`Loaded registration record for ${found.fullName} (${found.noreg}).`);
      setTimeout(() => setRefreshNotice(null), 3500);
    } else {
      setSearchError(
        `No registration request found matching "${searchQuery}". Please verify your Employee Number or Reference ID.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Registration Status Verification
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Service Parts Logistic Division — Access Governance
          </p>
        </div>

        {/* Lookup Bar */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Noreg (e.g. TAM-8802) or Reference ID"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB0A1E]"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!searchQuery.trim()}
              className="whitespace-nowrap"
            >
              Lookup Application
            </Button>
          </form>

          {searchError && (
            <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{searchError}</span>
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Status Header Banner */}
          <div
            className={`border-b p-6 flex items-start gap-4 ${
              currentReg.accountStatus === 'Active'
                ? 'bg-emerald-500/10 border-emerald-200'
                : currentReg.accountStatus === 'Rejected'
                ? 'bg-rose-500/10 border-rose-200'
                : 'bg-amber-500/10 border-amber-200'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-sm ${
                currentReg.accountStatus === 'Active'
                  ? 'bg-emerald-600'
                  : currentReg.accountStatus === 'Rejected'
                  ? 'bg-rose-600'
                  : 'bg-amber-500'
              }`}
            >
              {currentReg.accountStatus === 'Active' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : currentReg.accountStatus === 'Rejected' ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge status={currentReg.accountStatus} size="md" />
                <span className="text-xs font-mono font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-300">
                  {currentReg.registrationId}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900">
                {currentReg.accountStatus === 'Pending' &&
                  'Your Registration is Under QSHE Review'}
                {currentReg.accountStatus === 'Active' &&
                  'Registration Approved & Active'}
                {currentReg.accountStatus === 'Rejected' &&
                  'Registration Not Approved'}
              </h2>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  currentReg.accountStatus === 'Active'
                    ? 'text-emerald-900'
                    : currentReg.accountStatus === 'Rejected'
                    ? 'text-rose-900'
                    : 'text-amber-900'
                }`}
              >
                {currentReg.accountStatus === 'Pending' &&
                  'Your details have been transmitted to the Service Parts Logistic Division QSHE Safety Committee for identity and division verification.'}
                {currentReg.accountStatus === 'Active' &&
                  'Your account has been validated and authorized. You may sign in with your corporate email to access operational safety modules.'}
                {currentReg.accountStatus === 'Rejected' &&
                  'This registration request was rejected during division verification. Please review your submitted details with your supervisor or HR.'}
              </p>
            </div>
          </div>

          {/* Submission Details Table */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#EB0A1E]" />
                Registration Summary
              </h3>

              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 text-xs">
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Full Name</span>
                  <span className="font-semibold text-gray-900">{currentReg.fullName}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Employee Number (Noreg)</span>
                  <span className="font-mono font-bold text-gray-900">{currentReg.noreg}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Registered Email</span>
                  <span className="font-mono text-gray-800">{currentReg.email}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Department</span>
                  <span className="font-medium text-gray-900">
                    {currentReg.department === 'Lain-lain'
                      ? `${currentReg.department} (${currentReg.otherDepartmentName})`
                      : currentReg.department}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Section / Area</span>
                  <span className="font-medium text-gray-900">{currentReg.section}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-gray-500">Reported Position</span>
                  <span className="font-medium text-gray-900">
                    {currentReg.position === 'Other'
                      ? `${currentReg.position} (${currentReg.otherPositionName})`
                      : currentReg.position}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center bg-gray-100/60">
                  <span className="text-gray-600 font-medium">Requested System Role</span>
                  <span className="font-semibold text-gray-900">{currentReg.requestedRole}</span>
                </div>
                {currentReg.approvedBy && (
                  <div className="px-4 py-2.5 flex justify-between items-center bg-gray-100/60">
                    <span className="text-gray-600 font-medium">Reviewed By</span>
                    <span className="font-semibold text-gray-900">{currentReg.approvedBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Access Governance Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <ShieldCheck className="w-4 h-4 text-[#EB0A1E]" />
                <span>Access Security Governance</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px] leading-relaxed">
                <li>
                  User-reported position (e.g. Group Head, Manager) does not grant administrative privileges.
                </li>
                <li>
                  Operational modules (Incident reporting, safety inspections, hazard logging) are locked until QSHE approval.
                </li>
                <li>
                  Final role assignments and permissions are configured by QSHE Admins in Module 02.
                </li>
              </ul>
            </div>

            {refreshNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg animate-in fade-in">
                {refreshNotice}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Return to Login
                </Button>
              </Link>

              <Button
                variant="primary"
                size="md"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Check Approval Status
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
