import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FindingRecord } from '../../types/finding.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { RiskBadge } from '../common/RiskBadge.tsx';
import { ClipboardList, ChevronRight, Calendar, MapPin } from 'lucide-react';

interface RecentActivityFeedProps {
  findings: FindingRecord[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ findings }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent Findings (5 Temuan Terkini)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {findings.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          Belum ada laporan temuan K3
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {findings.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/findings/${item.id}`)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                    {item.referenceNo}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                  <RiskBadge level={item.riskLevel} size="sm" />
                </div>
                <h4 className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {item.findingDate}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {item.operationalArea}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
