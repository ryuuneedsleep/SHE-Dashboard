import React from 'react';
import type { AppRole } from '../../types/auth';
import { ROLE_CONFIGS } from '../../data/masterData';
import { ShieldAlert, ShieldCheck, User, Briefcase } from 'lucide-react';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.MEMBER;

  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1 font-semibold';

  const icons: Record<AppRole, React.ReactNode> = {
    QSHE_ADMIN: <ShieldAlert className="w-3.5 h-3.5 text-red-600" />,
    APPROVER: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />,
    MEMBER: <User className="w-3.5 h-3.5 text-gray-500" />,
    MANAGEMENT: <Briefcase className="w-3.5 h-3.5 text-purple-600" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses}`}
    >
      {icons[role]}
      <span>{config.label}</span>
    </span>
  );
};
