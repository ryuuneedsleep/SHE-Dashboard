import React from 'react';
import type { RiskLevelRecord } from '../../types/masterData';

interface RiskLevelColorBadgeProps {
  riskLevel: RiskLevelRecord;
  size?: 'sm' | 'md';
}

export const RiskLevelColorBadge: React.FC<RiskLevelColorBadgeProps> = ({
  riskLevel,
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1 font-bold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${sizeClasses}`}
      style={{
        backgroundColor: `${riskLevel.displayColor}15`,
        color: riskLevel.displayColor,
        borderColor: `${riskLevel.displayColor}40`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: riskLevel.displayColor }}
      />
      <span>{riskLevel.name}</span>
      <span className="text-[10px] opacity-75 font-mono">
        (Rank #{riskLevel.sortOrder})
      </span>
    </span>
  );
};

