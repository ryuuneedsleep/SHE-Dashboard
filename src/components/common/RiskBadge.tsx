import React from 'react';
import type { RiskLevel } from '../../types/finding.ts';
import { ShieldAlert, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'sm' }) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW: {
      label: 'Low',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
    },
    HIGH: {
      label: 'High',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
    },
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600" />,
    },
  };

  const normKey = (level || 'LOW').toUpperCase();
  const current = configs[normKey] || configs.LOW;
  const sizeClasses =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
