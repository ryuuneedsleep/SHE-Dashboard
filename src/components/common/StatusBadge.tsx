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
      bg: 'bg-[#FFFBEB]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />,
    },
    IN_PROGRESS: {
      label: 'IN PROGRESS',
      bg: 'bg-[#EFF6FF]',
      text: 'text-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
      icon: <Clock className="w-3.5 h-3.5 text-[#2563EB]" />,
    },
    CLOSED: {
      label: 'CLOSED',
      bg: 'bg-[#F0FDF4]',
      text: 'text-[#15803D]',
      border: 'border-[#BBF7D0]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />,
    },
  };

  const current = configs[status] || configs.OPEN;
  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1 font-medium' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-[4px] border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
