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
    <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#9E2638]" />
          <span>Filter Data Dashboard</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-[#666666] hover:text-[#9E2638] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Filter</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#333333] mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#666666]" />
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
            className="w-full text-xs rounded-[4px] border border-[#E5E7EB] py-1.5 px-2.5 bg-white text-[#000000] focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
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
          <label className="block text-[11px] font-semibold text-[#333333] mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#666666]" />
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
            className="w-full text-xs rounded-[4px] border border-[#E5E7EB] py-1.5 px-2.5 bg-white text-[#000000] focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
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
            <label className="block text-[11px] font-semibold text-[#333333] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#666666]" />
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
              className="w-full text-xs rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white text-[#000000] focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#333333] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#666666]" />
              <span>Sampai Tanggal</span>
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
              className="w-full text-xs rounded-[4px] border border-[#E5E7EB] py-1.5 px-2 bg-white text-[#000000] focus:outline-none focus:border-[#9E2638] focus:ring-1 focus:ring-[#9E2638]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFiltersBar;
