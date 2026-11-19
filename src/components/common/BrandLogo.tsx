import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  inverted = false,
}) => {
  const titleSizes = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  };

  const subSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className="flex flex-col select-none">
      <span
        className={`${titleSizes[size]} ${
          inverted ? 'text-white' : 'text-[#000000]'
        } leading-none`}
      >
        SPLD <span className="text-[#9E2638]">SAFETY</span>
      </span>
      {showSubtitle && (
        <span
          className={`${subSizes[size]} font-medium tracking-wide mt-0.5 ${
            inverted ? 'text-slate-300' : 'text-[#666666]'
          }`}
        >
          Safety Management System
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
