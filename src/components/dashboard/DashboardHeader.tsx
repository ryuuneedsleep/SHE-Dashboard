/**
 * SPLD SAFETY - Dashboard Header Component
 * Displays application context, current user authorization scope, last updated timestamp, demo toggle, and export dropdown.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AuthUser } from '../../types/auth';
import { RoleBadge } from '../common/RoleBadge';
import {
  RefreshCw,
  Clock,
  ShieldCheck,
  Sparkles,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { Button } from '../common/Button';

interface DashboardHeaderProps {
  currentUser: AuthUser;
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onExportFilteredFindings?: () => void;
  onExportAllFindings?: () => void;
  onExportUsers?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentUser,
  lastUpdated,
  isRefreshing,
  onRefresh,
  isDemoMode,
  onToggleDemoMode,
  onExportFilteredFindings,
  onExportAllFindings,
  onExportUsers,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getScopeDescription = () => {
    switch (currentUser.role) {
      case 'QSHE_ADMIN':
        return {
          title: 'Full Division Scope',
          subtitle: 'Super Admin visibility across all departments and operational areas',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'MANAGEMENT':
        return {
          title: 'Division-Wide Executive Scope',
          subtitle: 'Aggregated safety performance oversight',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'APPROVER':
        return {
          title: `Authorized Area Scope (${currentUser.areaAccess?.length || 0} Areas)`,
          subtitle: 'Visibility strictly scoped to assigned operational areas',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'MEMBER':
        return {
          title: 'Personal Submissions Scope',
          subtitle: 'Visibility restricted to personal safety findings and assignments',
          badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        };
      default:
        return {
          title: 'Standard Scope',
          subtitle: 'Role-based access',
          badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        };
    }
  };

  const scope = getScopeDescription();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Division Context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EB0A1E] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              {currentUser.role === 'MEMBER'
                ? 'Dashboard Pelaporan Safety Saya'
                : 'Safety Dashboard — Division Overview'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              {currentUser.role === 'MEMBER' ? 'Pelapor' : 'Module 04'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {currentUser.role === 'MEMBER'
              ? 'Monitoring status dan tindak lanjut laporan keselamatan kerja yang Anda kirimkan'
              : 'SPLD Safety Management System • Service Parts Logistic Division (SPLD)'}
          </p>
        </div>

        {/* Actions & Timestamps */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Dropdown Menu */}
          {(onExportFilteredFindings || onExportAllFindings || onExportUsers) && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                leftIcon={<Download className="w-3.5 h-3.5 text-gray-700" />}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              >
                Export Data (Excel)
              </Button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  {onExportFilteredFindings && (
                    <button
                      type="button"
                      onClick={() => {
                        onExportFilteredFindings();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Export Laporan Sesuai Filter</div>
                        <div className="text-[10px] text-gray-400">Unduh data temuan yang tampil</div>
                      </div>
                    </button>
                  )}

                  {onExportAllFindings && (
                    <button
                      type="button"
                      onClick={() => {
                        onExportAllFindings();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Export Seluruh Laporan Divisi</div>
                        <div className="text-[10px] text-gray-400">Semua laporan dari semua user</div>
                      </div>
                    </button>
                  )}

                  {currentUser.role === 'QSHE_ADMIN' && onExportUsers && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={() => {
                          onExportUsers();
                          setIsExportMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-800"
                      >
                        <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">Export Direktori Semua User</div>
                          <div className="text-[10px] text-gray-400">Data akun seluruh personel</div>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Demo Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isDemoMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
            title="Toggle between populated prototype operational dataset and clean zero-state"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600' : 'text-gray-400'}`} />
            <span>{isDemoMode ? 'Demo Seeds: ON' : 'Clean State: ON'}</span>
          </button>

          {/* Last Updated Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {lastUpdated}</span>
          </div>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 text-gray-600 ${isRefreshing ? 'animate-spin text-[#EB0A1E]' : ''}`}
              />
            }
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* User Scope Banner */}
      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[11px]">
            {currentUser.fullName.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900">{currentUser.fullName}</span>
          <span className="text-gray-400 font-mono text-[11px]">({currentUser.noreg})</span>
          <RoleBadge role={currentUser.role} size="sm" />
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="text-gray-600">{currentUser.department}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${scope.badgeClass}`}
            title={scope.subtitle}
          >
            <ShieldCheck className="w-3 h-3 flex-shrink-0" />
            <span>{scope.title}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
