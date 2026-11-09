/**
 * SPLD SAFETY - Safety Findings Trend Chart (SVG-based Time-Series)
 * Responsive, zero-dependency SVG line chart with hover tooltips and empty state.
 */

import React, { useState } from 'react';
import type { TrendDataPoint } from '../../../types/dashboard';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface FindingsTrendChartProps {
  data: TrendDataPoint[];
}

export const FindingsTrendChart: React.FC<FindingsTrendChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || data.every((d) => d.findingsCount === 0)) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#EB0A1E]" />
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Safety Findings Trend
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">Time-series aggregation</span>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
          <AlertCircle className="w-8 h-8 text-gray-300" />
          <p className="text-xs font-semibold text-gray-600">No findings in selected period</p>
          <p className="text-[11px] text-gray-400 max-w-xs">
            Adjust the date range or filter criteria to view historical trend observations.
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

  const maxVal = Math.max(...data.map((d) => d.findingsCount), 4);
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = svgHeight - paddingY - (d.findingsCount / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  // Construct SVG path string
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Construct closed area path for subtle gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${
    svgHeight - paddingY
  } Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-3 flex flex-col justify-between">
      {/* Chart Title Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#EB0A1E]" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Safety Findings Trend
            </h3>
            <p className="text-[11px] text-gray-500">
              Aggregated finding observations over period
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#EB0A1E] rounded-full" />
            <span className="text-gray-600 font-medium">Total Findings</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="findingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EB0A1E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EB0A1E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + pct * chartHeight;
            const val = Math.round(maxVal * (1 - pct));
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="10"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area gradient under line */}
          <path d={areaD} fill="url(#findingGrad)" />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#EB0A1E"
            strokeWidth="2.5"
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
                fill="#FFFFFF"
                stroke="#EB0A1E"
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* X-axis labels */}
              <text
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="10"
                fontWeight="500"
              >
                {p.data.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-10 pointer-events-none bg-gray-900 text-white rounded-lg p-2.5 text-xs shadow-lg space-y-1 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100 - 4}%`,
            }}
          >
            <div className="font-bold border-b border-gray-700 pb-1 text-[11px] text-gray-300">
              {hoveredPoint.data.date}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300">Findings:</span>
              <span className="font-bold text-white">{hoveredPoint.data.findingsCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] text-amber-400">
              <span>Open:</span>
              <span>{hoveredPoint.data.openCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] text-emerald-400">
              <span>Resolved:</span>
              <span>{hoveredPoint.data.resolvedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

