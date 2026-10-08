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
    <div className="rounded-xl bg-[#171717] border border-[#292929] p-6 space-y-4">
      {/* Heading with Sample Data Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-[#292929]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-medium text-[#FAFAFA]">
            Sample risk breakdown
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#212121] text-[#A3A3A3] border border-[#2E2E2E]">
            Sample data
          </span>
        </div>
        <span className="text-xs text-[#A3A3A3] hidden sm:inline-block">
          7-Day Cohort Summary
        </span>
      </div>

      {/* Contained responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#292929] text-[#A3A3A3] text-[11px]">
              <th scope="col" className="py-2.5 px-3 font-normal">Department</th>
              <th scope="col" className="py-2.5 px-3 font-normal text-right">Eligible deliveries</th>
              <th scope="col" className="py-2.5 px-3 font-normal text-right">Clicked</th>
              <th scope="col" className="py-2.5 px-3 font-normal text-right">Reported without click</th>
              <th scope="col" className="py-2.5 px-3 font-normal text-right">Opened only</th>
              <th scope="col" className="py-2.5 px-3 font-normal text-right">Expired untouched</th>
              <th scope="col" className="py-2.5 px-3 font-medium text-right text-[#FAFAFA]">HVI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242424] text-[#E5E5E5]">
            {rows.map((row) => (
              <tr
                key={row.department}
                className={`transition-colors ${
                  row.isTotal ? 'bg-[#212121] font-medium text-[#FAFAFA]' : 'hover:bg-[#1E1E1E]'
                }`}
              >
                <td className="py-3 px-3 font-medium text-[#FAFAFA]">
                  {row.department}
                </td>
                <td className="py-3 px-3 text-right tabular-nums">{row.eligible}</td>
                <td className="py-3 px-3 text-right tabular-nums">{row.clicked}</td>
                <td className="py-3 px-3 text-right tabular-nums">{row.reported}</td>
                <td className="py-3 px-3 text-right tabular-nums">{row.openedOnly}</td>
                <td className="py-3 px-3 text-right tabular-nums">{row.expired}</td>
                <td className="py-3 px-3 text-right font-medium text-sm tabular-nums text-[#FAFAFA]">
                  {row.hvi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanatory footer */}
      <div className="pt-2 border-t border-[#292929] text-xs text-[#A3A3A3] leading-relaxed">
        “HVI reflects observed simulation behavior. Expired untouched deliveries receive zero points, so response coverage is important when interpreting the score.”
      </div>
    </div>
  );
}
