/**
 * SPLD SAFETY - Finding Category Distribution Chart
 * Horizontal breakdown using Module 03 Finding Categories.
 */

import React from 'react';
import type { CategoryDistribution } from '../../../types/dashboard';
import { Tag } from 'lucide-react';

interface CategoryDistributionChartProps {
  data: CategoryDistribution[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  const totalFindings = data.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Findings by Category
            </h3>
            <p className="text-[11px] text-gray-500">
              Module 03 Finding Category classification
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {totalFindings} Findings
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-gray-400">
          No category observations recorded
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {data.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-800 line-clamp-1 max-w-[220px]" title={cat.name}>
                  {cat.name}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-gray-900">{cat.count}</span>
                  <span className="text-gray-400 text-[11px]">({cat.percentage}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#EB0A1E] transition-all duration-500"
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

