/**
 * SPLD SAFETY - Risk Level Distribution Chart
 * Respects Module 03 Risk Level configurations (displayColor and sortOrder).
 */

import React from 'react';
import type { RiskDistribution } from '../../../types/dashboard';
import { ShieldAlert } from 'lucide-react';

interface RiskDistributionChartProps {
  data: RiskDistribution[];
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ data }) => {
  const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalFindings = sorted.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Risk Level Distribution
            </h3>
            <p className="text-[11px] text-gray-500">
              Configured Module 03 Risk Matrix taxonomy
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {totalFindings} Total
        </span>
      </div>

      {totalFindings === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-gray-400">
          No risk assessments in selected scope
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Multi-Segment Stacked Bar */}
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex shadow-inner">
            {sorted.map((risk) => {
              if (risk.count === 0) return null;
              return (
                <div
                  key={risk.id}
                  className="h-full transition-all duration-500 hover:opacity-85"
                  style={{
                    width: `${Math.max(4, risk.percentage)}%`,
                    backgroundColor: risk.displayColor,
                  }}
                  title={`${risk.name}: ${risk.count} (${risk.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Risk Level Badges List */}
          <div className="grid grid-cols-2 gap-2.5">
            {sorted.map((risk) => (
              <div
                key={risk.id}
                className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-between transition-all hover:bg-white hover:shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: risk.displayColor }}
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900 leading-tight">
                      {risk.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {risk.code}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-extrabold text-gray-900">
                    {risk.count}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {risk.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

