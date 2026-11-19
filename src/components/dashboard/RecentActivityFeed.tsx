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
    <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#9E2638]" />
          <h3 className="text-sm font-bold text-[#000000] tracking-tight">
            Recent Findings (5 Temuan Terkini)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/findings')}
          className="text-xs font-semibold text-[#9E2638] hover:text-[#7F1F2E] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Lihat Semua</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {findings.length === 0 ? (
        <div className="p-8 text-center text-[#666666] text-xs">
          Belum ada laporan temuan K3
        </div>
      ) : (
        <div className="divide-y divide-[#E5E7EB]">
          {findings.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/findings/${item.id}`)}
              className="p-4 hover:bg-[#F7F8FA] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[#000000] group-hover:text-[#9E2638] transition-colors">
                    {item.referenceNo}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                  <RiskBadge level={item.riskLevel} size="sm" />
                </div>
                <h4 className="text-xs sm:text-sm font-medium text-[#000000] truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#666666]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#666666]" />
                    {item.findingDate}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-[#666666]" />
                    {item.operationalArea}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center text-[#666666] group-hover:text-[#9E2638] group-hover:translate-x-0.5 transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;
