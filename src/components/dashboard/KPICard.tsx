import React from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  accentColor?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-[#F8EDEF] text-[#9E2638]',
  accentColor = 'border-l-[#9E2638]',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[6px] p-4 border border-[#E5E7EB] border-l-[3px] ${accentColor} shadow-xs transition-colors hover:bg-[#F7F8FA] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#000000] tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] text-[#666666] font-normal truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-[4px] shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
