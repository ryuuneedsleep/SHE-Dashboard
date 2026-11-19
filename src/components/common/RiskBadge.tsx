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
      bg: 'bg-[#F0FDF4]',
      text: 'text-[#15803D]',
      border: 'border-[#BBF7D0]',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />,
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-[#FEFCE8]',
      text: 'text-[#854D0E]',
      border: 'border-[#FEF08A]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#EAB308]" />,
    },
    HIGH: {
      label: 'High',
      bg: 'bg-[#FFF7ED]',
      text: 'text-[#9A3412]',
      border: 'border-[#FED7AA]',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />,
    },
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-[#FEF2F2]',
      text: 'text-[#991B1B]',
      border: 'border-[#FECACA]',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />,
    },
  };

  const normKey = (level || 'LOW').toUpperCase();
  const current = configs[normKey] || configs.LOW;
  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1 font-medium' : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-[4px] border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
