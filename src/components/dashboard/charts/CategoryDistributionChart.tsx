import React from 'react';
import type { CategoryDistributionData } from '../../../types/dashboard.ts';
import { Tag } from 'lucide-react';

interface CategoryDistributionChartProps {
  data: CategoryDistributionData[];
}

const CATEGORY_SEMANTIC_COLORS: Record<string, string> = {
  'Unsafe Condition': '#DC2626',
  'Unsafe Action': '#EA580C',
  'Improvement Opportunity': '#2563EB',
};

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  const totalFindings = data.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#9E2638]" />
          <div>
            <h3 className="text-sm font-bold text-[#000000] tracking-tight">
              Finding Category Distribution
            </h3>
            <p className="text-[11px] text-[#666666]">
              Klasifikasi Jenis Temuan K3
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] text-[#333333]">
          {totalFindings} Temuan
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-[#666666]">
          Belum ada data kategori pada filter ini
        </div>
      ) : (
        <div className="space-y-3.5 pt-1">
          {data.map((cat) => {
            const barColor = CATEGORY_SEMANTIC_COLORS[cat.category] || cat.color;
            return (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="font-semibold text-[#000000]">
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#000000]">{cat.count}</span>
                    <span className="text-[#666666] text-[11px]">({cat.percentage}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-[2px] bg-[#E5E7EB] overflow-hidden">
                  <div
                    className="h-full rounded-[2px] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, cat.percentage)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryDistributionChart;
