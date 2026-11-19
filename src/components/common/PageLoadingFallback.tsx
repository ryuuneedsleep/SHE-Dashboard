import React from 'react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div className="relative w-10 h-10">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#E5E7EB]" />
        {/* Spinning accent ring in Primary Red */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#9E2638] border-t-transparent animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-[#000000] tracking-tight">SPLD SAFETY</p>
        <p className="text-xs text-[#666666]">Memuat halaman sistem keselamatan...</p>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
