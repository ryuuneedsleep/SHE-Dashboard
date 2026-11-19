import React from 'react';
import type { RiskDistributionData } from '../../../types/dashboard.ts';
import { ShieldAlert } from 'lucide-react';

interface RiskDistributionChartProps {
  data: RiskDistributionData[];
}

const RISK_SEMANTIC_COLORS: Record<string, string> = {
  LOW: '#16A34A',
  MEDIUM: '#EAB308',
  HIGH: '#EA580C',
  CRITICAL: '#DC2626',
};

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ data }) => {
  const totalFindings = data.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#9E2638]" />
          <div>
            <h3 className="text-sm font-bold text-[#000000] tracking-tight">
              Risk Level Distribution
            </h3>
            <p className="text-[11px] text-[#666666]">
              Distribusi Tingkat Keparahan Risiko
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] text-[#333333]">
          {totalFindings} Total
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-[#666666]">
          Belum ada data risiko pada filter ini
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Multi-Segment Stacked Bar */}
          <div className="w-full h-3 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB] overflow-hidden flex">
            {data.map((risk) => {
              if (risk.count === 0) return null;
              const barColor =
                RISK_SEMANTIC_COLORS[risk.level?.toUpperCase()] || risk.color;
              return (
                <div
                  key={risk.level}
                  className="h-full transition-all duration-300 hover:opacity-90"
                  style={{
                    width: `${Math.max(4, risk.percentage)}%`,
                    backgroundColor: barColor,
                  }}
                  title={`${risk.level}: ${risk.count} (${risk.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Detailed Progress Bars */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {data.map((risk) => {
              const barColor =
                RISK_SEMANTIC_COLORS[risk.level?.toUpperCase()] || risk.color;
              return (
                <div
                  key={risk.level}
                  className="p-2.5 rounded-[4px] bg-[#F7F8FA] border border-[#E5E7EB]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="text-xs font-semibold text-[#333333]">
                        {risk.level}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#000000]">
                      {risk.count}{' '}
                      <span className="text-[10px] font-normal text-[#666666]">
                        ({risk.percentage}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-[2px] bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full rounded-[2px] transition-all duration-300"
                      style={{
                        width: `${risk.percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskDistributionChart;
