/**
 * SPLD SAFETY - Primary KPI Metric Card Component
 * Professional Toyota-styled card with value, icon, description, and period delta.
 */

import React from 'react';
import type { KPIMetric } from '../../types/dashboard';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  metric: KPIMetric;
  icon: React.ReactNode;
  iconBgColor?: string;
  accentColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  metric,
  icon,
  iconBgColor = 'bg-red-50 text-[#EB0A1E]',
  accentColor = 'border-l-[#EB0A1E]',
}) => {
  const isNA = metric.value === 'N/A';

  const renderComparisonBadge = () => {
    if (isNA || !metric.comparison) return null;

    if (metric.comparison.percentageChange === undefined) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <Minus className="w-3 h-3 text-gray-400" />
          <span>Baseline period</span>
        </span>
      );
    }

    const pct = metric.comparison.percentageChange;
    const isImprovement = metric.comparison.isImprovement;

    if (pct === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <Minus className="w-3 h-3 text-gray-400" />
          <span>0% vs prev period</span>
        </span>
      );
    }

    const badgeBg = isImprovement
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200';

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}
        title={`Previous period value: ${metric.comparison.previousValue}`}
      >
        {pct > 0 ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        <span>{Math.abs(pct)}%</span>
        <span className="font-normal text-[9px] text-gray-500 ml-0.5">vs prev</span>
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-xs border border-gray-200 border-l-4 ${accentColor} p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-sm`}
    >
      {/* Top Header: Title & Icon */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider line-clamp-1">
          {metric.title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="my-2 flex items-baseline gap-2">
        <span
          className={`font-black tracking-tight ${
            isNA ? 'text-2xl text-gray-400' : 'text-3xl sm:text-4xl text-gray-900'
          }`}
        >
          {metric.value}
        </span>
        {renderComparisonBadge()}
      </div>

      {/* Short Description */}
      <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
        {metric.description}
      </p>
    </div>
  );
};
