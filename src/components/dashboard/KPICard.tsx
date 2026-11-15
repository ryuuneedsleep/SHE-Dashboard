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
  iconBgColor = 'bg-red-50 text-red-600',
  accentColor = 'border-l-red-600',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border border-slate-200 border-l-4 ${accentColor} shadow-sm transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
