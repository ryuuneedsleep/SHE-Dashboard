import React from 'react';
import type { CategoryDistributionData } from '../../../types/dashboard.ts';
import { Tag } from 'lucide-react';

interface CategoryDistributionChartProps {
  data: CategoryDistributionData[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  const totalFindings = data.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-red-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Finding Category Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Klasifikasi Jenis Temuan K3
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {totalFindings} Temuan
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Belum ada data kategori pada filter ini
        </div>
      ) : (
        <div className="space-y-3.5 pt-1">
          {data.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-800">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">{cat.count}</span>
                  <span className="text-slate-400 text-[11px]">({cat.percentage}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, cat.percentage)}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
