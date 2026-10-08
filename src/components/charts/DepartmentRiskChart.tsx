'use client';

import React, { useState } from 'react';
import {
  DepartmentSampleSummary,
  SampleDailyOutcome,
} from '@/lib/sample-analytics';

interface DepartmentRiskChartProps {
  department: 'Payroll' | 'Engineering';
  summary: DepartmentSampleSummary;
  dailyCohorts: SampleDailyOutcome[];
}

export function DepartmentRiskChart({
  department,
  summary,
  dailyCohorts,
}: DepartmentRiskChartProps) {
  const [activeCohort, setActiveCohort] = useState<SampleDailyOutcome | null>(null);

  // SVG dimensions for ~270px plotting canvas
  const svgWidth = 500;
  const svgHeight = 270;
  const padding = { top: 25, right: 20, bottom: 35, left: 35 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Max deliveries per day is fixed at 20 across both departments for identical fair comparison
  const maxDeliveries = 20;

  const getY = (count: number) => {
    return padding.top + plotHeight - (count / maxDeliveries) * plotHeight;
  };

  const getBarHeight = (count: number) => {
    return (count / maxDeliveries) * plotHeight;
  };

  const barWidth = 32;
  const yTicks = [0, 5, 10, 15, 20];

  return (
    <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 sm:p-6 flex flex-col justify-between space-y-5">
      {/* Header with Title and Sample Badge */}
      <div className="space-y-1.5 pb-2 border-b border-[#28282D]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100">
              {`${department} risk profile`}
            </h3>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1B1B1F] text-zinc-300 border border-[#28282D]">
              Sample data
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            HVI: <strong className="text-zinc-100 font-bold">{summary.hvi}</strong>
          </span>
        </div>
        <p className="text-xs text-[#8B8B95]">
          Sample final outcomes across seven delivery cohorts
        </p>
      </div>

      {/* Legend in exact order requested */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-red-400">
          <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-sm inline-block" />
          <span>Clicked</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 bg-[#10B981] rounded-sm inline-block" />
          <span>Reported without click</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <span className="w-2.5 h-2.5 bg-[#60A5FA] rounded-sm inline-block" />
          <span>Opened only</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="w-2.5 h-2.5 bg-[#71717A] rounded-sm inline-block" />
          <span>Expired untouched</span>
        </div>
      </div>

      {/* Stacked Vertical Bar Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[280px] select-none"
          role="img"
          aria-label={`Stacked bar chart of sample delivery outcomes for ${department} from Monday to Sunday`}
        >
          {/* Subtle Y-Axis Gridlines */}
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
                x={padding.left - 8}
                y={getY(tick) + 3}
                textAnchor="end"
                className="text-[10px] font-mono fill-[#8B8B95]"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Daily Stacked Bars */}
          {dailyCohorts.map((cohort, i) => {
            const xCenter =
              padding.left +
              (i + 0.5) * (plotWidth / dailyCohorts.length);
            const x = xCenter - barWidth / 2;

            // Stack calculations from bottom to top:
            // 1. Expired untouched (bottom)
            // 2. Opened only
            // 3. Reported without click
            // 4. Clicked (top)
            const hExpired = getBarHeight(cohort.expiredUntouched);
            const yExpired = padding.top + plotHeight - hExpired;

            const hOpened = getBarHeight(cohort.openedOnly);
            const yOpened = yExpired - hOpened;

            const hReported = getBarHeight(cohort.reported);
            const yReported = yOpened - hReported;

            const hClicked = getBarHeight(cohort.clicked);
            const yClicked = yReported - hClicked;

            const isHovered = activeCohort?.day === cohort.day;

            return (
              <g
                key={cohort.day}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setActiveCohort(cohort)}
                onMouseLeave={() => setActiveCohort(null)}
                tabIndex={0}
                onFocus={() => setActiveCohort(cohort)}
                onBlur={() => setActiveCohort(null)}
                role="button"
                aria-label={`${cohort.day}: ${cohort.delivered} delivered. ${cohort.clicked} clicked, ${cohort.reported} reported, ${cohort.openedOnly} opened, ${cohort.expiredUntouched} expired. HVI ${cohort.hvi}`}
              >
                {/* Active Column Background Glow */}
                {isHovered && (
                  <rect
                    x={x - 4}
                    y={padding.top}
                    width={barWidth + 8}
                    height={plotHeight}
                    fill="rgba(255,255,255,0.04)"
                    rx="4"
                  />
                )}

                {/* Expired untouched (bottom) */}
                {hExpired > 0 && (
                  <rect
                    x={x}
                    y={yExpired}
                    width={barWidth}
                    height={hExpired}
                    fill="#71717A"
                    className="transition-colors hover:brightness-110"
                  />
                )}

                {/* Opened only */}
                {hOpened > 0 && (
                  <rect
                    x={x}
                    y={yOpened}
                    width={barWidth}
                    height={hOpened}
                    fill="#60A5FA"
                    className="transition-colors hover:brightness-110"
                  />
                )}

                {/* Reported without click */}
                {hReported > 0 && (
                  <rect
                    x={x}
                    y={yReported}
                    width={barWidth}
                    height={hReported}
                    fill="#10B981"
                    className="transition-colors hover:brightness-110"
                  />
                )}

                {/* Clicked (top - with slight top radius) */}
                {hClicked > 0 && (
                  <rect
                    x={x}
                    y={yClicked}
                    width={barWidth}
                    height={hClicked}
                    fill="#EF4444"
                    rx="2"
                    className="transition-colors hover:brightness-110"
                  />
                )}

                {/* Day label on X axis */}
                <text
                  x={xCenter}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-mono ${
                    isHovered ? 'fill-white font-bold' : 'fill-zinc-300'
                  }`}
                >
                  {cohort.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Focus Tooltip Overlay */}
        {activeCohort && (
          <div className="absolute top-2 right-2 bg-[#18181B] border border-[#3F3F46] rounded-md p-3 shadow-xl text-xs space-y-1.5 z-20 pointer-events-none min-w-[190px]">
            <div className="flex items-center justify-between border-b border-[#28282D] pb-1 font-mono">
              <span className="font-semibold text-zinc-100">{activeCohort.day} Outcomes</span>
              <span className="text-[10px] text-[#8B8B95]">Total: {activeCohort.delivered}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px] pt-0.5">
              <span className="text-red-400">Clicked:</span>
              <span className="text-right text-red-400 font-bold tabular-nums">{activeCohort.clicked}</span>
              <span className="text-emerald-400">Reported:</span>
              <span className="text-right text-emerald-400 tabular-nums">{activeCohort.reported}</span>
              <span className="text-blue-400">Opened only:</span>
              <span className="text-right text-blue-400 tabular-nums">{activeCohort.openedOnly}</span>
              <span className="text-zinc-400">Expired:</span>
              <span className="text-right text-zinc-400 tabular-nums">{activeCohort.expiredUntouched}</span>
              <span className="text-zinc-300 border-t border-[#28282D] pt-1">Cohort HVI:</span>
              <span className="text-right font-bold text-white border-t border-[#28282D] pt-1 tabular-nums">{activeCohort.hvi}</span>
              <span className="text-zinc-300">Click rate:</span>
              <span className="text-right text-red-400 tabular-nums">{activeCohort.clickRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Concise Summary Metrics within panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#28282D] text-xs">
        <div className="bg-[#09090B] p-2 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">7-Day HVI</span>
          <p className="text-base font-bold font-mono text-zinc-100 tabular-nums">{summary.hvi}</p>
        </div>
        <div className="bg-[#09090B] p-2 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Clicked</span>
          <p className="text-base font-bold font-mono text-red-400 tabular-nums">
            {summary.clicked} <span className="text-[10px] text-[#8B8B95] font-normal">/ {summary.eligibleDeliveries}</span>
          </p>
        </div>
        <div className="bg-[#09090B] p-2 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Click Rate</span>
          <p className="text-base font-bold font-mono text-red-400 tabular-nums">{summary.clickRate}%</p>
        </div>
        <div className="bg-[#09090B] p-2 rounded border border-[#28282D]">
          <span className="text-[10px] uppercase font-mono text-[#8B8B95]">Coverage</span>
          <p className="text-base font-bold font-mono text-emerald-400 tabular-nums">{summary.responseCoverage}%</p>
        </div>
      </div>

      {/* Topic label & Interpretation Copy */}
      <div className="space-y-1.5 pt-1 text-xs">
        <div className="text-[11px] font-mono text-zinc-300 font-medium bg-[#141416] px-2.5 py-1 rounded border border-[#28282D]">
          {summary.scenarioTitle}
        </div>
        <p className="text-[#8B8B95] italic text-[11px] leading-relaxed">
          “{summary.interpretation}”
        </p>
      </div>
    </div>
  );
}
