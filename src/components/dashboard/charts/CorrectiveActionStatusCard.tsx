/**
 * SPLD SAFETY - Corrective Action Status Card Component
 * Monitors resolution status: Open, In Progress, Completed, Overdue.
 */

import React from 'react';
import type { CorrectiveActionSummary } from '../../../types/dashboard';
import { CheckSquare, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface CorrectiveActionStatusCardProps {
  summary: CorrectiveActionSummary;
}

export const CorrectiveActionStatusCard: React.FC<CorrectiveActionStatusCardProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Corrective Action Status
            </h3>
            <p className="text-[11px] text-gray-500">
              Kaizen countermeasure completion & overdue monitoring
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-gray-900">
            {summary.complianceRate}%
          </span>
          <span className="text-[10px] text-gray-500 block">Completed</span>
        </div>
      </div>

      {summary.total === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-gray-400">
          No corrective actions in selected scope
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* Overdue Bar (Red alert) */}
          <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-900">Overdue Target</div>
                <div className="text-[10px] text-red-700">Due date passed without closure</div>
              </div>
            </div>
            <span className="text-base font-black font-mono text-red-700">
              {summary.overdue}
            </span>
          </div>

          {/* In Progress & Open Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-900">In Progress</span>
              </div>
              <span className="text-sm font-bold font-mono text-amber-900">
                {summary.inProgress}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-xs font-bold text-blue-900">Open</span>
              </div>
              <span className="text-sm font-bold font-mono text-blue-900">
                {summary.open}
              </span>
            </div>
          </div>

          {/* Completed Bar */}
          <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Completed & Verified</div>
                <div className="text-[10px] text-emerald-700">Countermeasures implemented</div>
              </div>
            </div>
            <span className="text-base font-black font-mono text-emerald-800">
              {summary.completed}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

