import React from 'react';
import type { DashboardFilters } from '../../types/dashboard.ts';
import { DEPARTMENT_LIST, OPERATIONAL_AREA_LIST } from '../../types/finding.ts';
import { Filter, RotateCcw, Calendar, Building2, MapPin } from 'lucide-react';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export const DashboardFiltersBar: React.FC<DashboardFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-red-600" />
          <span>Filter Data Dashboard</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Departemen Pelapor</span>
          </label>
          <select
            value={filters.department || 'ALL'}
            onChange={(e) =>
              onChange({
                ...filters,
                department: e.target.value as DashboardFilters['department'],
              })
            }
            className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">Semua Departemen</option>
            {DEPARTMENT_LIST.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Operational Area Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Area Operasional Temuan</span>
          </label>
          <select
            value={filters.operationalArea || 'ALL'}
            onChange={(e) =>
              onChange({
                ...filters,
                operationalArea: e.target.value,
              })
            }
            className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">Semua Area Operasional</option>
            {OPERATIONAL_AREA_LIST.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter (Start Date to End Date) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Dari Tanggal</span>
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  startDate: e.target.value || undefined,
                })
              }
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Sampai</span>
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  endDate: e.target.value || undefined,
                })
              }
              className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
