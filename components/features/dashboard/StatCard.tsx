"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  iconTone: "yellow" | "gray";
  label: string;
  value: string;
  trendPct: number;
  lastLabel: string;
  lastValue: string;
}

/** Generic version of the Revenue / Orders cards — same layout, different data + icon tone. */
export function StatCard({
  icon,
  iconTone,
  label,
  value,
  trendPct,
  lastLabel,
  lastValue,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div
        className={`p-3.5 rounded-2xl shrink-0 ${
          iconTone === "yellow"
            ? "bg-brand-yellow/20 text-brand-yellow-lg"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 w-full">
        <div className="flex justify-between items-start mb-1.5">
          <p className="text-sm text-font-dim font-semibold">{label}</p>
          <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md text-[11px] font-bold">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {trendPct}%
          </div>
        </div>
        <h3 className="text-2xl font-heading font-extrabold text-font-main-sub mb-4">
          {value}
        </h3>

        <div className="border-t border-gray-100 pt-3 flex justify-between items-center w-full">
          <p className="text-[11px] text-gray-400 font-semibold">{lastLabel}</p>
          <p className="text-[12px] font-bold text-gray-700">{lastValue}</p>
        </div>
      </div>
    </div>
  );
}
