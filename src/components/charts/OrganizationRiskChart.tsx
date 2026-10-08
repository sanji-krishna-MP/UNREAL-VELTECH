'use client';

import React, { useState } from 'react';
import {
  SAMPLE_COMBINED_DAILY,
  ORGANIZATION_SAMPLE_SUMMARY,
  SampleDailyCombined,
} from '@/lib/sample-analytics';

export function OrganizationRiskChart() {
  const [activeDay, setActiveDay] = useState<SampleDailyCombined | null>(null);

  // SVG dimensions for 320px high plotting canvas
  const svgWidth = 800;
  const svgHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis fixed from 0 to 100
  const getY = (val: number) => {
    return padding.top + plotHeight - (val / 100) * plotHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / (SAMPLE_COMBINED_DAILY.length - 1)) * plotWidth;
  };

  // Generate SVG path points (straight line segments, no misleading curves)
  const orgPoints = SAMPLE_COMBINED_DAILY.map((d, i) => `${getX(i)},${getY(d.organizationHvi)}`).join(' L ');
  const payrollPoints = SAMPLE_COMBINED_DAILY.map((d, i) => `${getX(i)},${getY(d.payrollHvi)}`).join(' L ');
  const engPoints = SAMPLE_COMBINED_DAILY.map((d, i) => `${getX(i)},${getY(d.engineeringHvi)}`).join(' L ');

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 sm:p-6 space-y-5">
      {/* Header with Title, Badge, and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#28282D]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100">
              Organization risk overview
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1B1B1F] text-zinc-300 border border-[#28282D]">
              Sample data
            </span>
          </div>
          <p className="text-xs text-[#8B8B95] mt-1">
            Sample HVI by delivery cohort · Lower is better
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="w-3.5 h-[3px] bg-zinc-100 rounded-full inline-block" />
            <svg width="8" height="8" className="inline-block">
              <circle cx="4" cy="4" r="3" fill="#FFFFFF" />
            </svg>
            <span>Organization (3px)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3.5 h-[2px] bg-amber-500 rounded-full inline-block" />
            <svg width="8" height="8" className="inline-block">
              <rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill="#F59E0B" />
            </svg>
            <span>Payroll (2px)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-3.5 h-[2px] bg-blue-500 rounded-full inline-block" />
            <svg width="8" height="8" className="inline-block">
              <rect x="1" y="1" width="6" height="6" fill="#3B82F6" />
            </svg>
            <span>Engineering (2px)</span>
          </div>
        </div>
      </div>

      {/* Scope Clarification */}
      <div className="text-[11px] text-[#8B8B95] bg-[#09090B] px-3 py-2 rounded border border-[#28282D]">
        <strong className="text-zinc-300 font-medium">Scope:</strong> Each point scores that day’s delivery cohort. It is not a cumulative organization score.
      </div>

      {/* Responsive Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[340px] select-none"
          role="img"
          aria-label="Multi-series line chart illustrating daily sample HVI for Organization, Payroll, and Engineering cohorts from Monday to Sunday"
        >
          {/* Subtle Horizontal Gridlines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={svgWidth - padding.right}
                y2={getY(tick)}
                stroke="#28282D"
                strokeDasharray={tick === 0 ? undefined : '2,3'}
                strokeWidth={tick === 0 ? 1.5 : 1}
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-[#8B8B95]"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* X-axis Day Ticks */}
          {SAMPLE_COMBINED_DAILY.map((d, i) => (
            <g key={d.day}>
              <line
                x1={getX(i)}
                y1={padding.top}
                x2={getX(i)}
                y2={padding.top + plotHeight}
                stroke="#28282D"
                strokeWidth={1}
                strokeDasharray="1,4"
              />
              <text
                x={getX(i)}
                y={svgHeight - padding.bottom + 22}
                textAnchor="middle"
                className="text-[11px] font-mono fill-zinc-300 font-medium"
              >
                {d.day}
              </text>
            </g>
          ))}

          {/* Series 2: Payroll HVI (Amber, 2px stroke, straight segments) */}
          <path
            d={`M ${payrollPoints}`}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Series 3: Engineering HVI (Blue, 2px stroke, straight segments) */}
          <path
            d={`M ${engPoints}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Series 1: Organization HVI (Off-white, 3px stroke, straight segments) */}
          <path
            d={`M ${orgPoints}`}
            fill="none"
            stroke="#F4F4F5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Marker Points */}
          {SAMPLE_COMBINED_DAILY.map((d, i) => {
            const isHovered = activeDay?.day === d.day;
            const x = getX(i);
            const yOrg = getY(d.organizationHvi);
            const yPay = getY(d.payrollHvi);
            const yEng = getY(d.engineeringHvi);

            return (
              <g
                key={d.day}
                className="cursor-pointer"
                onMouseEnter={() => setActiveDay(d)}
                onMouseLeave={() => setActiveDay(null)}
                tabIndex={0}
                onFocus={() => setActiveDay(d)}
                onBlur={() => setActiveDay(null)}
                role="button"
                aria-label={`${d.day}: Organization HVI ${d.organizationHvi}, Payroll ${d.payrollHvi}, Engineering ${d.engineeringHvi}`}
              >
                {/* Active vertical guide line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + plotHeight}
                    stroke="#D4D4D8"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Payroll Marker (Diamond) */}
                <rect
                  x={x - 4}
                  y={yPay - 4}
                  width="8"
                  height="8"
                  transform={`rotate(45 ${x} ${yPay})`}
                  fill="#F59E0B"
                  stroke="#111113"
                  strokeWidth="1.5"
                />

                {/* Engineering Marker (Square) */}
                <rect
                  x={x - 3.5}
                  y={yEng - 3.5}
                  width="7"
                  height="7"
                  fill="#3B82F6"
                  stroke="#111113"
                  strokeWidth="1.5"
                />

                {/* Organization Marker (Circle) */}
                <circle
                  cx={x}
                  cy={yOrg}
                  r={isHovered ? 5.5 : 4.5}
                  fill="#FFFFFF"
                  stroke="#111113"
                  strokeWidth="2"
                />

                {/* Invisible wide hit target for hover/touch */}
                <rect
                  x={x - 20}
                  y={padding.top}
                  width={40}
                  height={plotHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover / Focus Tooltip Overlay */}
        {activeDay && (
          <div className="absolute top-2 right-2 sm:right-6 bg-[#18181B] border border-[#3F3F46] rounded-md p-3 shadow-xl text-xs space-y-1.5 z-20 pointer-events-none min-w-[200px]">
            <div className="flex items-center justify-between border-b border-[#28282D] pb-1 font-mono">
              <span className="font-semibold text-zinc-100">{activeDay.day} Cohort</span>
              <span className="text-[10px] text-[#8B8B95]">Daily Scope</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] pt-0.5">
              <span className="text-zinc-300">Org HVI:</span>
              <span className="text-right font-bold text-white tabular-nums">{activeDay.organizationHvi}</span>
              <span className="text-amber-400">Payroll HVI:</span>
              <span className="text-right font-bold text-amber-400 tabular-nums">{activeDay.payrollHvi}</span>
              <span className="text-blue-400">Eng HVI:</span>
              <span className="text-right font-bold text-blue-400 tabular-nums">{activeDay.engineeringHvi}</span>
              <span className="text-zinc-400 border-t border-[#28282D] pt-1">Eligible:</span>
              <span className="text-right text-zinc-300 border-t border-[#28282D] pt-1 tabular-nums">{activeDay.delivered}</span>
              <span className="text-zinc-400">Clicks:</span>
              <span className="text-right text-red-400 tabular-nums">{activeDay.clicked}</span>
            </div>
          </div>
        )}
      </div>

      {/* Compact 7-Day Summary Strip */}
      <div className="pt-3 border-t border-[#28282D] grid grid-cols-2 sm:grid-cols-5 gap-3 text-center sm:text-left">
        <div className="bg-[#09090B] p-2.5 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Overall HVI</span>
          <p className="text-lg font-bold font-mono text-zinc-100 tabular-nums">
            {ORGANIZATION_SAMPLE_SUMMARY.overallHvi}
          </p>
        </div>
        <div className="bg-[#09090B] p-2.5 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Eligible Deliveries</span>
          <p className="text-lg font-bold font-mono text-zinc-100 tabular-nums">
            {ORGANIZATION_SAMPLE_SUMMARY.eligibleDeliveries}
          </p>
        </div>
        <div className="bg-[#09090B] p-2.5 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Clicked Deliveries</span>
          <p className="text-lg font-bold font-mono text-red-400 tabular-nums">
            {ORGANIZATION_SAMPLE_SUMMARY.clicked}
          </p>
        </div>
        <div className="bg-[#09090B] p-2.5 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Click Rate</span>
          <p className="text-lg font-bold font-mono text-red-400 tabular-nums">
            {ORGANIZATION_SAMPLE_SUMMARY.clickRate}%
          </p>
        </div>
        <div className="bg-[#09090B] p-2.5 rounded border border-[#28282D] col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Response Coverage</span>
          <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
            {ORGANIZATION_SAMPLE_SUMMARY.responseCoverage}%
          </p>
        </div>
      </div>

      {/* Concise Interpretation Copy */}
      <div className="text-xs text-[#8B8B95] italic border-l-2 border-zinc-600 pl-3">
        “{ORGANIZATION_SAMPLE_SUMMARY.interpretation}”
      </div>
    </div>
  );
}
