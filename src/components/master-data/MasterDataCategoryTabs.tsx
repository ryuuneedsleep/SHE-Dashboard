import React from 'react';
import type { MasterDataCategory } from '../../types/masterData';
import { CATEGORIES_META } from '../../data/masterDataCategoriesMeta';
import { Building2, ShieldCheck } from 'lucide-react';

interface MasterDataCategoryTabsProps {
  activeCategory: MasterDataCategory;
  onSelectCategory: (cat: MasterDataCategory) => void;
  counts: Record<MasterDataCategory, number>;
}

export const MasterDataCategoryTabs: React.FC<MasterDataCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  counts,
}) => {
  const orgCategories = CATEGORIES_META.filter((c) => c.group === 'organizational');
  const safetyCategories = CATEGORIES_META.filter((c) => c.group === 'safety');

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-4">
      {/* Group 1: Organizational */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
          <Building2 className="w-3.5 h-3.5 text-[#EB0A1E]" />
          <span>Organizational Master Data (4 Categories)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {orgCategories.map((c) => {
            const isSelected = activeCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelectCategory(c.key)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[#EB0A1E] bg-red-50/60 shadow-xs text-gray-900 font-bold'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={isSelected ? 'text-[#EB0A1E]' : 'text-gray-400'}>
                    {c.icon}
                  </span>
                  <span className="text-xs truncate">{c.title}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-[#EB0A1E] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[c.key] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Group 2: Safety */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#EB0A1E]" />
          <span>Safety Master Data (6 Categories)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {safetyCategories.map((c) => {
            const isSelected = activeCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelectCategory(c.key)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[#EB0A1E] bg-red-50/60 shadow-xs text-gray-900 font-bold'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={isSelected ? 'text-[#EB0A1E]' : 'text-gray-400'}>
                    {c.icon}
                  </span>
                  <span className="text-xs truncate">{c.title}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ml-1 ${
                    isSelected ? 'bg-[#EB0A1E] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[c.key] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

