/**
 * SPLD SAFETY - Incident & Near Miss Summary Card Component
 * Breakdown by Incident Type using Module 03 Master Data.
 */

import React from 'react';
import type { IncidentSummary } from '../../../types/dashboard';
import { AlertOctagon } from 'lucide-react';

interface IncidentSummaryCardProps {
  summary: IncidentSummary;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Incident & Near Miss Monitoring
            </h3>
            <p className="text-[11px] text-gray-500">
              Module 03 Incident Type categorization
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {summary.total} Events
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {/* Top Comparison: Near Miss vs Physical Incidents */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Near Misses (Hiyari Hatto)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-900 font-mono">
                {summary.nearMissCount}
              </span>
              <span className="text-[10px] text-amber-700">Kaizen Opportunity</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-50/60 border border-red-200 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
              Safety Incidents
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-red-900 font-mono">
                {summary.incidentsCount}
              </span>
              <span className="text-[10px] text-red-700">P3K / Damage</span>
            </div>
          </div>
        </div>

        {/* Breakdown by Incident Type */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Breakdown by Classification
          </span>
          {summary.byType.length === 0 ? (
            <div className="text-xs text-gray-400 py-2">No incidents recorded in period</div>
          ) : (
            <div className="space-y-1.5">
              {summary.byType.map((item) => (
                <div
                  key={item.typeId}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isNearMiss ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-gray-800 font-medium">{item.typeName}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
