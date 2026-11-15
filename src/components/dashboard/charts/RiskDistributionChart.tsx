import React from 'react';
import type { RiskDistributionData } from '../../../types/dashboard.ts';
import { ShieldAlert } from 'lucide-react';

interface RiskDistributionChartProps {
  data: RiskDistributionData[];
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ data }) => {
  const totalFindings = data.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Risk Level Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Distribusi Tingkat Keparahan Risiko
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {totalFindings} Total
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400">
          Belum ada data risiko pada filter ini
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Multi-Segment Stacked Bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
            {data.map((risk) => {
              if (risk.count === 0) return null;
              return (
                <div
                  key={risk.level}
                  className="h-full transition-all duration-500 hover:opacity-85"
                  style={{
                    width: `${Math.max(4, risk.percentage)}%`,
                    backgroundColor: risk.color,
                  }}
                  title={`${risk.level}: ${risk.count} (${risk.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Detailed Progress Bars */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {data.map((risk) => (
              <div key={risk.level} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: risk.color }}
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {risk.level}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {risk.count}{' '}
                    <span className="text-[10px] font-normal text-slate-500">
                      ({risk.percentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${risk.percentage}%`,
                      backgroundColor: risk.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
