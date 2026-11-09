/**
 * SPLD SAFETY - Recent Safety Activity Feed Component
 * Displays recent safety findings, actions, patrols, and incident reports with slide-over detail modal.
 */

import React, { useState } from 'react';
import type { SafetyActivityItem, ActivityType } from '../../types/dashboard';
import {
  Activity,
  AlertTriangle,
  CheckSquare,
  Footprints,
  AlertOctagon,
  Eye,
  X,
  MapPin,
} from 'lucide-react';

interface RecentActivityFeedProps {
  activities: SafetyActivityItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const [selectedItem, setSelectedItem] = useState<SafetyActivityItem | null>(null);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'SAFETY_FINDING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'CORRECTIVE_ACTION':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'SAFETY_PATROL':
        return <Footprints className="w-4 h-4 text-emerald-600" />;
      case 'INCIDENT':
        return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'NEAR_MISS':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'SAFETY_FINDING':
        return { label: 'Finding', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'CORRECTIVE_ACTION':
        return { label: 'Action', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'SAFETY_PATROL':
        return { label: 'Patrol', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'INCIDENT':
        return { label: 'Incident', bg: 'bg-red-50 text-red-800 border-red-200' };
      case 'NEAR_MISS':
        return { label: 'Near Miss', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      default:
        return { label: 'Activity', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#EB0A1E]" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Recent Safety Activities
              </h3>
              <p className="text-[11px] text-gray-500">
                Latest division findings, countermeasures, and patrol events
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Showing {activities.length} recent items
          </span>
        </div>

        {/* Activity List */}
        {activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No safety activities recorded for the selected filter parameters.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((item) => {
              const badge = getActivityBadge(item.activityType);
              const formattedDate = new Date(item.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="py-3 px-2 rounded-lg transition-colors hover:bg-slate-50/80 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Icon, Badge, Ref, Title */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white group-hover:border-gray-300 transition-colors flex-shrink-0">
                      {getActivityIcon(item.activityType)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="font-mono text-xs font-semibold text-gray-700">
                          {item.referenceNo}
                        </span>
                        {item.riskLevelName && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${item.riskDisplayColor}15`,
                              color: item.riskDisplayColor,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: item.riskDisplayColor }}
                            />
                            {item.riskLevelName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-gray-900 group-hover:text-red-700 transition-colors truncate max-w-xl">
                        {item.title}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{item.operationalAreaName}</span>
                        </span>
                        <span>•</span>
                        <span>{item.departmentName}</span>
                        <span>•</span>
                        <span>Reporter: {item.actorName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date, Status Badge, Detail Peek */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formattedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold border border-gray-200">
                        {item.status}
                      </span>
                      <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Detail Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  {getActivityIcon(selectedItem.activityType)}
                </div>
                <div>
                  <div className="text-xs font-mono text-gray-400">
                    {selectedItem.referenceNo}
                  </div>
                  <h4 className="text-sm font-bold text-white">Record Details</h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Title & Observation
                </span>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {selectedItem.title}
                </p>
                {selectedItem.rawRecord && 'description' in selectedItem.rawRecord && (
                  <p className="text-gray-600 mt-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedItem.rawRecord.description}
                  </p>
                )}
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <span className="text-gray-500 block">Department:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedItem.departmentName}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-500 block">Operational Area:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedItem.operationalAreaName}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-500 block">Reported / Assigned:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedItem.actorName}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-500 block">Lifecycle Status:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                    {selectedItem.status}
                  </span>
                </div>

                {selectedItem.riskLevelName && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-gray-500 block">Risk Classification:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedItem.riskDisplayColor }}
                      />
                      <span className="font-bold text-gray-900">
                        {selectedItem.riskLevelName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>Recorded: {new Date(selectedItem.timestamp).toLocaleString()}</span>
                <span>Audit Verified</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
