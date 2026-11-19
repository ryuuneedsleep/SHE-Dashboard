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
      <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9E2638]" />
            <h3 className="text-sm font-bold text-[#000000] tracking-tight">
              Monthly Finding Trend
            </h3>
          </div>
          <span className="text-[11px] text-[#666666]">Tren Laporan Bulanan</span>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-[#666666] space-y-2">
          <AlertCircle className="w-8 h-8 text-[#E5E7EB]" />
          <p className="text-xs font-semibold text-[#333333]">Belum ada data pada periode ini</p>
          <p className="text-[11px] text-[#666666] max-w-xs">
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
    <div className="bg-white rounded-[6px] shadow-xs border border-[#E5E7EB] p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#9E2638]" />
          <h3 className="text-sm font-bold text-[#000000] tracking-tight">
            Monthly Finding Trend
          </h3>
        </div>
        <span className="text-[11px] text-[#666666] font-medium">Laporan Masuk per Bulan</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none overflow-visible"
        >
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
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-[#666666] font-mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Solid Semi-Transparent Area (Strictly No Gradient) */}
          <path d={areaD} fill="rgba(158, 38, 56, 0.08)" />

          {/* Trend Line (Solid Primary Red #9E2638) */}
          <path
            d={pathD}
            fill="none"
            stroke="#9E2638"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill="#FFFFFF"
                stroke="#9E2638"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* Invisible larger hit target */}
              <circle cx={p.x} cy={p.y} r={16} fill="transparent" />

              {/* X Axis Labels */}
              <text
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[10px] fill-[#666666] font-medium"
              >
                {p.data.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full bg-[#000000] text-white text-[11px] px-2.5 py-1 rounded-[4px] shadow-sm z-10 font-medium"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
              marginTop: '-8px',
            }}
          >
            <div className="font-bold">{points[hoveredIndex].data.month}</div>
            <div>{points[hoveredIndex].data.count} Temuan</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingsTrendChart;
