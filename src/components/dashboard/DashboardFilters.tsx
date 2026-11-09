/**
 * SPLD SAFETY - Dashboard Filters Component
 * Date Range Presets, Department, Section (Cascaded), and Role-Authorized Operational Areas.
 */

import React from 'react';
import type { AuthUser } from '../../types/auth';
import type { DashboardFilters, DateRangePreset } from '../../types/dashboard';
import { masterDataService } from '../../services/masterDataService.ts';
import {
  Calendar,
  Filter,
  Building2,
  Layers,
  MapPin,
  RotateCcw,
} from 'lucide-react';

interface DashboardFiltersProps {
  currentUser: AuthUser;
  filters: DashboardFilters;
  onChange: (newFilters: DashboardFilters) => void;
  onReset: () => void;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersProps> = ({
  currentUser,
  filters,
  onChange,
  onReset,
}) => {
  // Master data sources (Module 03 Single Source of Truth)
  const activeDepartments = masterDataService.getActiveDepartments();
  const activeSections = masterDataService.getActiveSections(
    filters.departmentId && filters.departmentId !== 'ALL'
      ? filters.departmentId
      : undefined
  );
  const allOperationalAreas = masterDataService.getActiveOperationalAreas();

  // Role Scope Enforcer for Operational Areas:
  // If Approver, only show operational areas that belong to their areaAccess array
  const authorizedOperationalAreas =
    currentUser.role === 'APPROVER'
      ? allOperationalAreas.filter((a) => (currentUser.areaAccess || []).includes(a.id))
      : allOperationalAreas;

  const datePresets: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last Quarter' },
    { id: 'ytd', label: 'YTD' },
    { id: 'custom', label: 'Custom' },
  ];

  const handleDatePresetChange = (preset: DateRangePreset) => {
    onChange({
      ...filters,
      datePreset: preset,
    });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeptId = e.target.value;
    onChange({
      ...filters,
      departmentId: newDeptId,
      // Reset section if it does not belong to the selected department
      sectionId: 'ALL',
    });
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sectionId: e.target.value,
    });
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      operationalAreaId: e.target.value,
    });
  };

  const hasActiveFilters =
    filters.datePreset !== '30d' ||
    (filters.departmentId && filters.departmentId !== 'ALL') ||
    (filters.sectionId && filters.sectionId !== 'ALL') ||
    (filters.operationalAreaId && filters.operationalAreaId !== 'ALL');

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-5 space-y-4">
      {/* Top Row: Date Presets & Filter Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#EB0A1E]" />
          <span>Analytics Filters & Scope</span>
        </div>

        {/* Date Preset Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {datePresets.map((p) => {
            const isActive = filters.datePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Pickers (if Custom is chosen) */}
      {filters.datePreset === 'custom' && (
        <div className="p-3 bg-red-50/50 rounded-lg border border-red-200 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 font-semibold text-red-900">
            <Calendar className="w-3.5 h-3.5 text-[#EB0A1E]" />
            <span>Custom Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600">From:</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="px-2.5 py-1 rounded border border-gray-300 bg-white text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600">To:</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="px-2.5 py-1 rounded border border-gray-300 bg-white text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-gray-400" />
            <span>Department</span>
          </label>
          <select
            value={filters.departmentId || 'ALL'}
            onChange={handleDepartmentChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none"
          >
            <option value="ALL">All Departments (Division-Wide)</option>
            {activeDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section / Area Filter (Cascaded by Department) */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
            <Layers className="w-3 h-3 text-gray-400" />
            <span>Section / Area</span>
          </label>
          <select
            value={filters.sectionId || 'ALL'}
            onChange={handleSectionChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none"
          >
            <option value="ALL">
              {filters.departmentId && filters.departmentId !== 'ALL'
                ? 'All Sections in Selected Dept'
                : 'All Sections / Areas'}
            </option>
            {activeSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Operational Area Filter (Clipped by Role Access) */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>Operational Area</span>
            </span>
            {currentUser.role === 'APPROVER' && (
              <span className="text-[10px] text-blue-600 font-bold">Authorized Only</span>
            )}
          </label>
          <select
            value={filters.operationalAreaId || 'ALL'}
            onChange={handleAreaChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none"
          >
            <option value="ALL">
              {currentUser.role === 'APPROVER'
                ? `All Authorized Areas (${authorizedOperationalAreas.length})`
                : 'All Operational Areas'}
            </option>
            {authorizedOperationalAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

