/**
 * SPLD SAFETY - Safety Patrol Performance Card Component
 * Planned vs Completed patrols with division-by-zero N/A protection.
 */

import React from 'react';
import type { PatrolPerformanceSummary } from '../../../types/dashboard';
import { Footprints, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface PatrolPerformanceCardProps {
  summary: PatrolPerformanceSummary;
}

export const PatrolPerformanceCard: React.FC<PatrolPerformanceCardProps> = ({ summary }) => {
  const isNA = summary.achievementRate === null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Safety Patrol Performance
            </h3>
            <p className="text-[11px] text-gray-500">
              Management & Leader walkthrough audits
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            isNA
              ? 'bg-gray-100 text-gray-400'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {summary.achievementDisplay} Rate
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {/* Main Achievement Metric Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Achievement Target
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {summary.achievementDisplay}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-500 block">Planned Walkthroughs</span>
            <span className="text-sm font-bold text-gray-800 font-mono">
              {summary.completed} / {summary.planned}
            </span>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-lg border border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-gray-700">Completed</span>
            </div>
            <span className="text-sm font-bold font-mono text-gray-900">
              {summary.completed}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-gray-700">Pending</span>
            </div>
            <span className="text-sm font-bold font-mono text-gray-900">
              {summary.pending}
            </span>
          </div>
        </div>

        {isNA && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>No planned patrol targets configured for this date selection.</span>
          </div>
        )}
      </div>
    </div>
  );
};

