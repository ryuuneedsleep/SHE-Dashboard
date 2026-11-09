import React from 'react';
import type { AccountStatus } from '../../types/auth';
import { CheckCircle2, Clock, XCircle, AlertTriangle, UserX } from 'lucide-react';

interface StatusBadgeProps {
  status: AccountStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    AccountStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    Active: {
      label: 'Active',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    Pending: {
      label: 'Pending Approval',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    Rejected: {
      label: 'Registration Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    Suspended: {
      label: 'Account Suspended',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
    },
    Inactive: {
      label: 'Account Inactive',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: <UserX className="w-3.5 h-3.5 text-slate-500" />,
    },
  };

  const current = configs[status] || configs.Pending;
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

