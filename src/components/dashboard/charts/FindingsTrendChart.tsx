import React, { useState } from 'react';
import type { MonthlyTrendData } from '../../../types/dashboard.ts';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface FindingsTrendChartProps {
  data: MonthlyTrendData[];
}

export const FindingsTrendChart: React.FC<FindingsTrendChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Monthly Finding Trend
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Tren Laporan Bulanan</span>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">Belum ada data pada periode ini</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Sesuaikan filter untuk melihat tren laporan temuan K3 secara historis.
          </p>
        </div>
      </div>
    );
  }

  // Calculate SVG coordinates
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(...data.map((d) => d.count), 4);
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = svgHeight - paddingY - (d.count / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Monthly Finding Trend
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Laporan Masuk per Bulan</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = svgHeight - paddingY - pct * chartHeight;
            const labelVal = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#DC2626"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                className="fill-white stroke-red-600 stroke-[2.5] cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <text
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-medium"
              >
                {p.data.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%`,
            }}
          >
            <div className="font-bold text-[11px] text-slate-200">
              {points[hoveredIndex].data.month}
            </div>
            <div className="text-[11px] text-red-300">
              Total: {points[hoveredIndex].data.count} temuan
            </div>
            <div className="text-[10px] text-slate-400">
              Selesai: {points[hoveredIndex].data.closedCount} | Terbuka: {points[hoveredIndex].data.openCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
