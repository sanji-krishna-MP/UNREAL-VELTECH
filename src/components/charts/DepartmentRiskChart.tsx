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
  defaultView?: 'trend' | 'outcomes';
}

/**
 * Generates a smooth monotone cubic bezier SVG path that does not overshoot bounds.
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    cp1y = Math.max(minY, Math.min(maxY, cp1y));
    cp2y = Math.max(minY, Math.min(maxY, cp2y));

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export function DepartmentRiskChart({
  department,
  summary,
  dailyCohorts,
  defaultView = 'trend',
}: DepartmentRiskChartProps) {
  const [view, setView] = useState<'trend' | 'outcomes'>(defaultView);
  const [activeCohort, setActiveCohort] = useState<SampleDailyOutcome | null>(null);

  // SVG dimensions for ~270px plotting canvas
  const svgWidth = 520;
  const svgHeight = 270;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;

  // --- TREND VIEW CALCULATIONS (0 to 100 HVI scale) ---
  const getTrendY = (hvi: number) => {
    return padding.top + plotHeight - (hvi / 100) * plotHeight;
  };
  const getTrendX = (index: number) => {
    return padding.left + (index / (dailyCohorts.length - 1)) * plotWidth;
  };

  const trendPoints = dailyCohorts.map((d, i) => ({
    x: getTrendX(i),
    y: getTrendY(d.hvi),
  }));
  const trendLineD = createSmoothPath(trendPoints);
  const trendAreaD = `${trendLineD} L ${trendPoints[trendPoints.length - 1].x} ${baselineY} L ${trendPoints[0].x} ${baselineY} Z`;
  const trendTicks = [0, 25, 50, 75, 100];

  // --- OUTCOMES VIEW CALCULATIONS (Grouped bars, max 20 scale) ---
  const maxOutcomeScale = 20;
  const getOutcomeY = (count: number) => {
    return padding.top + plotHeight - (count / maxOutcomeScale) * plotHeight;
  };
  const getOutcomeBarHeight = (count: number) => {
    return (count / maxOutcomeScale) * plotHeight;
  };
  const outcomesTicks = [0, 5, 10, 15, 20];

  // Grouped bar parameters
  const singleBarWidth = 7;
  const barGap = 2;
  const groupTotalWidth = 4 * singleBarWidth + 3 * barGap; // 34px

  return (
    <div className="rounded-xl bg-[#171717] border border-[#292929] p-6 flex flex-col justify-between space-y-5">
      {/* 1. Title, Sample Data Badge, and View Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium tracking-tight text-[#FAFAFA]">
              {`${department} risk profile`}
            </h3>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#212121] text-[#A3A3A3] border border-[#2E2E2E]">
              Sample data
            </span>
          </div>

          {/* Compact Trend | Outcomes selector */}
          <div
            role="group"
            aria-label="Chart presentation view"
            className="inline-flex items-center rounded-lg bg-[#212121] p-0.5 border border-[#2E2E2E]"
          >
            <button
              type="button"
              onClick={() => setView('trend')}
              aria-pressed={view === 'trend'}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                view === 'trend'
                  ? 'bg-[#2E2E2E] text-[#FAFAFA] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              Trend
            </button>
            <button
              type="button"
              onClick={() => setView('outcomes')}
              aria-pressed={view === 'outcomes'}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                view === 'outcomes'
                  ? 'bg-[#2E2E2E] text-[#FAFAFA] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              Outcomes
            </button>
          </div>
        </div>

        {/* 2. Subtitle */}
        <p className="text-xs text-[#A3A3A3]">
          {view === 'trend'
            ? 'Daily sample HVI · Lower is better'
            : 'Sample delivery outcomes by day'}
        </p>

        {/* 3. Small Legend beneath Subtitle */}
        <div className="pt-1">
          {view === 'trend' ? (
            <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
              <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" />
              <span className="text-[#FAFAFA]">Daily HVI</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A3A3A3]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" />
                <span className="text-[#FAFAFA]">Clicked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#909090] inline-block" />
                <span>Reported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#575757] inline-block" />
                <span>Opened</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#383838] border border-[#505050] inline-block" />
                <span>Expired</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Chart Plotting Area (~270px high) */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[275px] select-none"
          role="img"
          aria-label={`${department} risk profile chart in ${view} mode`}
        >
          <defs>
            <linearGradient
              id={`${department.toLowerCase()}TrendArea`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#F5F5F5" stopOpacity="0.16" />
              <stop offset="70%" stopColor="#F5F5F5" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#F5F5F5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Ticks */}
          {(view === 'trend' ? trendTicks : outcomesTicks).map((tick) => {
            const y = view === 'trend' ? getTrendY(tick) : getOutcomeY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#303030"
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-sans fill-[#A3A3A3]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* === TREND VIEW: Smooth White Line with Area Shading === */}
          {view === 'trend' && (
            <>
              {/* Subtle Gradient Area Fill */}
              <path
                d={trendAreaD}
                fill={`url(#${department.toLowerCase()}TrendArea)`}
                pointerEvents="none"
              />

              {/* White Smooth Line */}
              <path
                d={trendLineD}
                fill="none"
                stroke="#F5F5F5"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* X-axis Day Labels */}
              {dailyCohorts.map((d, i) => (
                <text
                  key={d.day}
                  x={getTrendX(i)}
                  y={svgHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-[10px] font-sans fill-[#A3A3A3]"
                >
                  {d.day}
                </text>
              ))}

              {/* Hover Interaction for Trend */}
              {dailyCohorts.map((cohort, i) => {
                const isHovered = activeCohort?.day === cohort.day;
                const x = getTrendX(i);
                const y = getTrendY(cohort.hvi);

                return (
                  <g
                    key={cohort.day}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveCohort(cohort)}
                    onMouseLeave={() => setActiveCohort(null)}
                    tabIndex={0}
                    onFocus={() => setActiveCohort(cohort)}
                    onBlur={() => setActiveCohort(null)}
                    role="button"
                    aria-label={`${cohort.day}: HVI ${cohort.hvi}, eligible ${cohort.delivered}`}
                  >
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={baselineY}
                        stroke="#525252"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                      />
                    )}
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r="4.5"
                        fill="#FFFFFF"
                        stroke="#171717"
                        strokeWidth="2"
                      />
                    )}
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
            </>
          )}

          {/* === OUTCOMES VIEW: Slim Grouped Bars (White, Medium Gray, Dark Gray, Darkest Gray) === */}
          {view === 'outcomes' && (
            <>
              {dailyCohorts.map((cohort, i) => {
                const groupCenterX =
                  padding.left + (i + 0.5) * (plotWidth / dailyCohorts.length);
                const startGroupX = groupCenterX - groupTotalWidth / 2;

                const isHovered = activeCohort?.day === cohort.day;

                // Bar 1: Clicked (#F5F5F5)
                const h1 = getOutcomeBarHeight(cohort.clicked);
                const y1 = baselineY - h1;
                const x1 = startGroupX;

                // Bar 2: Reported (#909090)
                const h2 = getOutcomeBarHeight(cohort.reported);
                const y2 = baselineY - h2;
                const x2 = x1 + singleBarWidth + barGap;

                // Bar 3: Opened (#575757)
                const h3 = getOutcomeBarHeight(cohort.openedOnly);
                const y3 = baselineY - h3;
                const x3 = x2 + singleBarWidth + barGap;

                // Bar 4: Expired (#383838)
                const h4 = getOutcomeBarHeight(cohort.expiredUntouched);
                const y4 = baselineY - h4;
                const x4 = x3 + singleBarWidth + barGap;

                return (
                  <g
                    key={cohort.day}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveCohort(cohort)}
                    onMouseLeave={() => setActiveCohort(null)}
                    tabIndex={0}
                    onFocus={() => setActiveCohort(cohort)}
                    onBlur={() => setActiveCohort(null)}
                    role="button"
                    aria-label={`${cohort.day}: ${cohort.clicked} clicked, ${cohort.reported} reported, ${cohort.openedOnly} opened, ${cohort.expiredUntouched} expired`}
                  >
                    {/* Hover column background highlight */}
                    {isHovered && (
                      <rect
                        x={startGroupX - 4}
                        y={padding.top}
                        width={groupTotalWidth + 8}
                        height={plotHeight}
                        fill="rgba(255,255,255,0.03)"
                        rx="4"
                      />
                    )}

                    {/* Bar 1: Clicked (White) */}
                    {h1 > 0 && (
                      <rect
                        x={x1}
                        y={y1}
                        width={singleBarWidth}
                        height={h1}
                        fill="#F5F5F5"
                        rx="3"
                      />
                    )}

                    {/* Bar 2: Reported (Medium Gray) */}
                    {h2 > 0 && (
                      <rect
                        x={x2}
                        y={y2}
                        width={singleBarWidth}
                        height={h2}
                        fill="#909090"
                        rx="3"
                      />
                    )}

                    {/* Bar 3: Opened (Darker Gray) */}
                    {h3 > 0 && (
                      <rect
                        x={x3}
                        y={y3}
                        width={singleBarWidth}
                        height={h3}
                        fill="#575757"
                        rx="3"
                      />
                    )}

                    {/* Bar 4: Expired (Darkest Gray, visible border) */}
                    {h4 > 0 && (
                      <rect
                        x={x4}
                        y={y4}
                        width={singleBarWidth}
                        height={h4}
                        fill="#383838"
                        stroke="#505050"
                        strokeWidth="0.8"
                        rx="3"
                      />
                    )}

                    {/* X-axis Day Label */}
                    <text
                      x={groupCenterX}
                      y={svgHeight - padding.bottom + 20}
                      textAnchor="middle"
                      className={`text-[10px] font-sans ${
                        isHovered ? 'fill-[#FAFAFA] font-medium' : 'fill-[#A3A3A3]'
                      }`}
                    >
                      {cohort.day}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {activeCohort && (
          <div className="absolute top-2 right-2 bg-[#212121] border border-[#333333] rounded-lg p-3 shadow-2xl text-xs space-y-1.5 z-20 pointer-events-none min-w-[185px]">
            <div className="flex items-center justify-between border-b border-[#303030] pb-1">
              <span className="font-medium text-[#FAFAFA]">{activeCohort.day} Cohort</span>
              <span className="text-[10px] text-[#A3A3A3]">Total: {activeCohort.delivered}</span>
            </div>
            {view === 'trend' ? (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
                <span className="text-[#A3A3A3]">Cohort HVI:</span>
                <span className="text-right font-medium text-[#FAFAFA] tabular-nums">{activeCohort.hvi}</span>
                <span className="text-[#A3A3A3]">Click rate:</span>
                <span className="text-right text-[#A3A3A3] tabular-nums">{activeCohort.clickRate}%</span>
                <span className="text-[#737373]">Eligible:</span>
                <span className="text-right text-[#FAFAFA] tabular-nums">{activeCohort.delivered}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
                <span className="text-[#FAFAFA]">Clicked:</span>
                <span className="text-right font-medium text-[#FAFAFA] tabular-nums">{activeCohort.clicked}</span>
                <span className="text-[#909090]">Reported:</span>
                <span className="text-right text-[#909090] tabular-nums">{activeCohort.reported}</span>
                <span className="text-[#A3A3A3]">Opened:</span>
                <span className="text-right text-[#A3A3A3] tabular-nums">{activeCohort.openedOnly}</span>
                <span className="text-[#737373]">Expired:</span>
                <span className="text-right text-[#737373] tabular-nums">{activeCohort.expiredUntouched}</span>
                <span className="text-[#A3A3A3] border-t border-[#303030] pt-1">Daily HVI:</span>
                <span className="text-right font-medium text-[#FAFAFA] border-t border-[#303030] pt-1 tabular-nums">{activeCohort.hvi}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Thin Divider */}
      <div className="border-t border-[#292929]" />

      {/* 6. Clean Monochrome Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">7-Day HVI</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {summary.hvi}
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Clicked</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {summary.clicked}{' '}
            <span className="text-[11px] text-[#A3A3A3] font-normal">
              / {summary.eligibleDeliveries}
            </span>
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Click rate</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {summary.clickRate}%
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Coverage</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {summary.responseCoverage}%
          </span>
        </div>
      </div>

      {/* 7. Scenario Context & Normal Readable Explanatory Text */}
      <div className="space-y-1 text-xs pt-1">
        <div className="font-medium text-[#FAFAFA]">
          {summary.scenarioTitle}
        </div>
        <p className="text-[#A3A3A3] leading-relaxed text-xs">
          {summary.interpretation}
        </p>
      </div>
    </div>
  );
}
