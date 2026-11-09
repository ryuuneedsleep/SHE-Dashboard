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
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
  };

  const subSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Toyota-inspired Safety Shield with Red Chevron Vector Badge */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-lg bg-gray-900 shadow-sm border border-gray-800 flex-shrink-0 overflow-hidden`}
        aria-hidden="true"
      >
        {/* Red accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#EB0A1E]" />
        
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* Shield Outline */}
          <path
            d="M16 3L6 7V15C6 21.5 10.3 27.5 16 29C21.7 27.5 26 21.5 26 15V7L16 3Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Safety Cross / Red Chevron Accent */}
          <path
            d="M16 9V21M10 15H22"
            stroke="#EB0A1E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSizes[size]} ${
              inverted ? 'text-white' : 'text-gray-900'
            }`}
          >
            SPLD <span className="text-[#EB0A1E]">SAFETY</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
            TAM
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`${subSizes[size]} font-medium uppercase tracking-wider ${
              inverted ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            Safety Management System
          </span>
        )}
      </div>
    </div>
  );
};

