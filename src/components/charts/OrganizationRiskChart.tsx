'use client';

import React, { useState } from 'react';
import {
  SAMPLE_COMBINED_DAILY,
  ORGANIZATION_SAMPLE_SUMMARY,
  SampleDailyCombined,
} from '@/lib/sample-analytics';

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

    // Catmull-Rom to Cubic Bezier conversion
    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Monotonic clamping to strictly prevent overshooting
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    cp1y = Math.max(minY, Math.min(maxY, cp1y));
    cp2y = Math.max(minY, Math.min(maxY, cp2y));

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export function OrganizationRiskChart() {
  const [activeDay, setActiveDay] = useState<SampleDailyCombined | null>(null);

  // SVG dimensions for ~310px plotting canvas
  const svgWidth = 840;
  const svgHeight = 310;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;

  // Y-axis fixed from 0 to 100
  const getY = (val: number) => {
    return padding.top + plotHeight - (val / 100) * plotHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / (SAMPLE_COMBINED_DAILY.length - 1)) * plotWidth;
  };

  const orgPoints = SAMPLE_COMBINED_DAILY.map((d, i) => ({ x: getX(i), y: getY(d.organizationHvi) }));
  const payPoints = SAMPLE_COMBINED_DAILY.map((d, i) => ({ x: getX(i), y: getY(d.payrollHvi) }));
  const engPoints = SAMPLE_COMBINED_DAILY.map((d, i) => ({ x: getX(i), y: getY(d.engineeringHvi) }));

  const orgLineD = createSmoothPath(orgPoints);
  const payLineD = createSmoothPath(payPoints);
  const engLineD = createSmoothPath(engPoints);

  // Area fill under Organization series only
  const orgAreaD = `${orgLineD} L ${orgPoints[orgPoints.length - 1].x} ${baselineY} L ${orgPoints[0].x} ${baselineY} Z`;

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-xl bg-[#171717] border border-[#292929] p-6 space-y-5">
      {/* Upper-left Title & Subtitle + Sample data badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-medium tracking-tight text-[#FAFAFA]">
              Organization risk overview
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#212121] text-[#A3A3A3] border border-[#2E2E2E]">
              Sample data
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Sample HVI across delivery cohorts · Lower is better
          </p>
        </div>

        {/* Quiet Reference-Style Dots Legend */}
        <div className="flex items-center gap-4 text-xs text-[#A3A3A3]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F5F5F5] inline-block" />
            <span className="text-[#FAFAFA]">Organization</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#909090] inline-block" />
            <span>Payroll</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#666666] inline-block" />
            <span>Engineering</span>
          </div>
        </div>
      </div>

      {/* Plotting Canvas */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[320px] select-none"
          role="img"
          aria-label="Monochrome line and area chart of daily sample HVI for Organization, Payroll, and Engineering"
        >
          <defs>
            {/* Subtle white-to-transparent area shading for Organization series only */}
            <linearGradient id="orgMonochromeArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F5F5" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#F5F5F5" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#F5F5F5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Thin Horizontal Gridlines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={getY(tick)}
                x2={svgWidth - padding.right}
                y2={getY(tick)}
                stroke="#303030"
                strokeWidth={1}
              />
              <text
                x={padding.left - 10}
                y={getY(tick) + 3.5}
                textAnchor="end"
                className="text-[11px] font-sans fill-[#A3A3A3]"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Organization Area Shading (under Org line only) */}
          <path
            d={orgAreaD}
            fill="url(#orgMonochromeArea)"
            pointerEvents="none"
          />

          {/* Series 3: Engineering HVI (Dark Gray, 2px, dashed) */}
          <path
            d={engLineD}
            fill="none"
            stroke="#666666"
            strokeWidth="2"
            strokeDasharray="4,4"
            strokeLinecap="round"
          />

          {/* Series 2: Payroll HVI (Medium Gray, 2px, dashed) */}
          <path
            d={payLineD}
            fill="none"
            stroke="#909090"
            strokeWidth="2"
            strokeDasharray="7,4"
            strokeLinecap="round"
          />

          {/* Series 1: Organization HVI (Crisp White, 2.5px solid) */}
          <path
            d={orgLineD}
            fill="none"
            stroke="#F5F5F5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* X-axis Day Ticks */}
          {SAMPLE_COMBINED_DAILY.map((d, i) => (
            <text
              key={d.day}
              x={getX(i)}
              y={svgHeight - padding.bottom + 22}
              textAnchor="middle"
              className="text-[11px] font-sans fill-[#A3A3A3]"
            >
              {d.day}
            </text>
          ))}

          {/* Hover / Focus Interaction Elements */}
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
                aria-label={`${d.day}: Organization ${d.organizationHvi}, Payroll ${d.payrollHvi}, Engineering ${d.engineeringHvi}`}
              >
                {/* Vertical guide on hover */}
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

                {/* Markers visible on hover */}
                {isHovered && (
                  <>
                    <circle cx={x} cy={yEng} r="3.5" fill="#666666" stroke="#171717" strokeWidth="1.5" />
                    <circle cx={x} cy={yPay} r="4" fill="#909090" stroke="#171717" strokeWidth="1.5" />
                    <circle cx={x} cy={yOrg} r="5" fill="#FFFFFF" stroke="#171717" strokeWidth="2" />
                  </>
                )}

                {/* Transparent hit area */}
                <rect
                  x={x - 22}
                  y={padding.top}
                  width={44}
                  height={plotHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {activeDay && (
          <div className="absolute top-2 right-4 bg-[#212121] border border-[#333333] rounded-lg p-3 shadow-2xl text-xs space-y-1.5 z-20 pointer-events-none min-w-[190px]">
            <div className="flex items-center justify-between border-b border-[#303030] pb-1.5">
              <span className="font-medium text-[#FAFAFA]">{activeDay.day} Cohort</span>
              <span className="text-[10px] text-[#A3A3A3]">Daily HVI</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
              <span className="text-[#A3A3A3]">Organization:</span>
              <span className="text-right font-medium text-[#FAFAFA] tabular-nums">{activeDay.organizationHvi}</span>
              <span className="text-[#A3A3A3]">Payroll:</span>
              <span className="text-right text-[#909090] tabular-nums">{activeDay.payrollHvi}</span>
              <span className="text-[#A3A3A3]">Engineering:</span>
              <span className="text-right text-[#A3A3A3] tabular-nums">{activeDay.engineeringHvi}</span>
              <span className="text-[#737373] border-t border-[#303030] pt-1">Deliveries:</span>
              <span className="text-right text-[#A3A3A3] border-t border-[#303030] pt-1 tabular-nums">{activeDay.delivered}</span>
              <span className="text-[#737373]">Clicks:</span>
              <span className="text-right text-[#FAFAFA] tabular-nums">{activeDay.clicked}</span>
            </div>
          </div>
        )}
      </div>

      {/* Thin Divider */}
      <div className="border-t border-[#292929]" />

      {/* Clean Monochrome Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Overall HVI</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {ORGANIZATION_SAMPLE_SUMMARY.overallHvi}
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Eligible deliveries</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {ORGANIZATION_SAMPLE_SUMMARY.eligibleDeliveries}
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Clicked deliveries</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {ORGANIZATION_SAMPLE_SUMMARY.clicked}
          </span>
        </div>
        <div>
          <span className="text-[#A3A3A3] block text-[11px]">Click rate</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {ORGANIZATION_SAMPLE_SUMMARY.clickRate}%
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[#A3A3A3] block text-[11px]">Response coverage</span>
          <span className="text-base font-semibold text-[#FAFAFA] tabular-nums mt-0.5 block">
            {ORGANIZATION_SAMPLE_SUMMARY.responseCoverage}%
          </span>
        </div>
      </div>

      {/* Grounded Interpretation in Normal Readable Text */}
      <p className="text-xs text-[#A3A3A3] leading-relaxed pt-1">
        {ORGANIZATION_SAMPLE_SUMMARY.interpretation}
      </p>
    </div>
  );
}
