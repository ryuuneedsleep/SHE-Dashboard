import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#000000] tracking-tight">
          Safety Dashboard
        </h1>
        <p className="text-xs text-[#666666] mt-0.5">
          Monitoring metrik K3 terpadu • Terakhir diperbarui: {lastUpdated}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-[4px] border border-[#E5E7EB] bg-white hover:bg-[#F7F8FA] text-[#333333] text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          title="Segarkan data dashboard"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#9E2638]' : 'text-[#666666]'}`}
          />
          <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
