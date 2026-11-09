import React, { useState } from 'react';
import type {
  MasterRecord,
  MasterDataCategory,
  SectionRecord,
  OperationalAreaRecord,
  RiskLevelRecord,
} from '../../types/masterData';
import { Button } from '../common/Button';
import { RiskLevelColorBadge } from './RiskLevelColorBadge';
import {
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  ArrowUpDown,
} from 'lucide-react';

interface MasterDataTableProps {
  category: MasterDataCategory;
  categoryTitle: string;
  categorySubtitle: string;
  data: MasterRecord[];
  onAddNew: () => void;
  onEdit: (record: MasterRecord) => void;
  onToggleStatus: (record: MasterRecord) => void;
  departmentFilterOptions?: { id: string; name: string }[];
}

export const MasterDataTable: React.FC<MasterDataTableProps> = ({
  category,
  categoryTitle,
  categorySubtitle,
  data,
  onAddNew,
  onEdit,
  onToggleStatus,
  departmentFilterOptions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'code' | 'name' | 'status' | 'updatedAt'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter logic
  const filtered = data
    .filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      let matchesDept = true;
      if (category === 'sections' && selectedDept !== 'ALL') {
        matchesDept = (r as SectionRecord).departmentId === selectedDept;
      }

      return matchesSearch && matchesStatus && matchesDept;
    })
    .sort((a, b) => {
      if (category === 'risk_levels') {
        return (a as RiskLevelRecord).sortOrder - (b as RiskLevelRecord).sortOrder;
      }

      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      const comp = String(valA).localeCompare(String(valB));
      return sortAsc ? comp : -comp;
    });

  const handleSort = (field: 'code' | 'name' | 'status' | 'updatedAt') => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden space-y-4 p-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">{categoryTitle}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono font-bold">
              {filtered.length} Records
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{categorySubtitle}</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onAddNew}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New {categoryTitle.split(' ')[0]}
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search code, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive')}
            className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        {category === 'sections' && departmentFilterOptions ? (
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]"
            >
              <option value="ALL">All Departments</option>
              {departmentFilterOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-end text-[11px] text-gray-500 font-medium">
            Click column headers to sort
          </div>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500">
          No records found matching your filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-y border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-1">
                    <span>Code</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Name / Label</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                {category === 'sections' && <th className="px-4 py-3">Parent Dept</th>}
                {category === 'operational_areas' && <th className="px-4 py-3">Physical Location</th>}
                {category === 'risk_levels' && <th className="px-4 py-3">Visual Display</th>}
                <th className="px-4 py-3">Description</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => {
                const isInactive = item.status === 'Inactive';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isInactive ? 'opacity-65 bg-gray-50/40' : ''
                    }`}
                  >
                    {/* Code */}
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">
                      {item.code}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        ID: {item.id}
                      </div>
                    </td>

                    {/* Category specific columns */}
                    {category === 'sections' && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          <Building2 className="w-3 h-3 text-gray-500" />
                          <span>{(item as SectionRecord).departmentName}</span>
                        </span>
                      </td>
                    )}

                    {category === 'operational_areas' && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-700 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-[#EB0A1E] flex-shrink-0" />
                          <span>{(item as OperationalAreaRecord).location}</span>
                        </span>
                      </td>
                    )}

                    {category === 'risk_levels' && (
                      <td className="px-4 py-3">
                        <RiskLevelColorBadge riskLevel={item as RiskLevelRecord} size="sm" />
                      </td>
                    )}

                    {/* Description */}
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={item.description}>
                      {item.description || '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {item.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3 h-3 text-gray-500" />
                        <span>Edit</span>
                      </button>

                      {item.status === 'Active' ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item)}
                          className="p-1.5 rounded border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-medium transition-colors"
                          title="Deactivate this record"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(item)}
                          className="p-1.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-medium transition-colors"
                          title="Reactivate this record"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

