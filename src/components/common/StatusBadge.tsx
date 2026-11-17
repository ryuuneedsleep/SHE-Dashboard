import React from 'react';
import type { FindingStatus } from '../../types/finding.ts';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: FindingStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    FindingStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    OPEN: {
      label: 'OPEN',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    IN_PROGRESS: {
      label: 'IN PROGRESS',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    CLOSED: {
      label: 'CLOSED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
  };

  const current = configs[status] || configs.OPEN;
  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
