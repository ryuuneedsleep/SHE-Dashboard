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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Safety Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitoring metrik K3 terpadu • Terakhir diperbarui: {lastUpdated}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
          title="Segarkan data dashboard"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-slate-500'}`} />
          <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
        </button>
      </div>
    </div>
  );
};

