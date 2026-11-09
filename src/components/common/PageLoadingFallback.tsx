import React from 'react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        {/* Spinning accent ring in Toyota red */}
        <div className="absolute inset-0 rounded-full border-4 border-[#EB0A1E] border-t-transparent animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-gray-800 tracking-wide">SPLD SAFETY</p>
        <p className="text-xs text-gray-500">Memuat halaman sistem keselamatan...</p>
      </div>
    </div>
  );
};

