'use client';

import React from 'react';
import {
  PAYROLL_SAMPLE_SUMMARY,
  ENGINEERING_SAMPLE_SUMMARY,
  ORGANIZATION_SAMPLE_SUMMARY,
} from '@/lib/sample-analytics';

export function SampleRiskBreakdown() {
  const rows = [
    {
      department: 'Payroll',
      eligible: PAYROLL_SAMPLE_SUMMARY.eligibleDeliveries,
      clicked: PAYROLL_SAMPLE_SUMMARY.clicked,
      reported: PAYROLL_SAMPLE_SUMMARY.reported,
      openedOnly: PAYROLL_SAMPLE_SUMMARY.openedOnly,
      expired: PAYROLL_SAMPLE_SUMMARY.expiredUntouched,
      hvi: PAYROLL_SAMPLE_SUMMARY.hvi,
      isTotal: false,
    },
    {
      department: 'Engineering',
      eligible: ENGINEERING_SAMPLE_SUMMARY.eligibleDeliveries,
      clicked: ENGINEERING_SAMPLE_SUMMARY.clicked,
      reported: ENGINEERING_SAMPLE_SUMMARY.reported,
      openedOnly: ENGINEERING_SAMPLE_SUMMARY.openedOnly,
      expired: ENGINEERING_SAMPLE_SUMMARY.expiredUntouched,
      hvi: ENGINEERING_SAMPLE_SUMMARY.hvi,
      isTotal: false,
    },
    {
      department: 'Organization (Combined)',
      eligible: ORGANIZATION_SAMPLE_SUMMARY.eligibleDeliveries,
      clicked: ORGANIZATION_SAMPLE_SUMMARY.clicked,
      reported: ORGANIZATION_SAMPLE_SUMMARY.reported,
      openedOnly: ORGANIZATION_SAMPLE_SUMMARY.openedOnly,
      expired: ORGANIZATION_SAMPLE_SUMMARY.expiredUntouched,
      hvi: ORGANIZATION_SAMPLE_SUMMARY.overallHvi,
      isTotal: true,
    },
  ];

  return (
    <div className="rounded-lg bg-[#111113] border border-[#28282D] p-5 sm:p-6 space-y-4">
      {/* Heading with Sample Data Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-[#28282D]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-zinc-100">
            Sample risk breakdown
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1B1B1F] text-zinc-300 border border-[#28282D]">
            Sample data
          </span>
        </div>
        <span className="text-xs text-[#8B8B95] font-mono hidden sm:inline-block">
          7-Day Cohort Summary
        </span>
      </div>

      {/* Contained responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#28282D] text-[#8B8B95] text-[11px]">
              <th scope="col" className="py-2.5 px-3 font-medium">Department</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right">Eligible deliveries</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-red-400">Clicked</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-emerald-400">Reported without click</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-blue-400">Opened only</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-zinc-400">Expired untouched</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-zinc-100 font-bold">HVI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#28282D]/60 text-zinc-200">
            {rows.map((row) => (
              <tr
                key={row.department}
                className={`transition-colors ${
                  row.isTotal ? 'bg-[#18181B]/70 font-semibold text-white' : 'hover:bg-[#18181B]/40'
                }`}
              >
                <td className="py-3 px-3 font-sans font-medium text-zinc-200">
                  {row.department}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">{row.eligible}</td>
                <td className="py-3 px-3 text-right text-red-400 tabular-nums">{row.clicked}</td>
                <td className="py-3 px-3 text-right text-emerald-400 tabular-nums">{row.reported}</td>
                <td className="py-3 px-3 text-right text-blue-400 tabular-nums">{row.openedOnly}</td>
                <td className="py-3 px-3 text-right text-zinc-400 tabular-nums">{row.expired}</td>
                <td className="py-3 px-3 text-right text-zinc-100 font-bold text-sm tabular-nums">
                  {row.hvi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanatory footer */}
      <div className="pt-2 border-t border-[#28282D] text-[11px] text-[#8B8B95] leading-relaxed">
        “HVI reflects observed simulation behavior. Expired untouched deliveries receive zero points, so response coverage is important when interpreting the score.”
      </div>
    </div>
  );
}
