"use client";

import { useState } from "react";

interface OrdersOverviewChartProps {
  bars: number[]; // 0-100 heights, oldest first
  rangeLabel: string;
  /** e.g. ["Mon","Tue",...] — falls back to "Week N" if omitted, so
   * this stays backward compatible with any other caller. */
  dayLabels?: string[];
}

const RANGE_OPTIONS = ["This Month", "Last Month", "Last 3 Months"] as const;

export function OrdersOverviewChart({
  bars,
  rangeLabel,
  dayLabels,
}: OrdersOverviewChartProps) {
  const [range, setRange] =
    useState<(typeof RANGE_OPTIONS)[number]>("This Month");
  const highestIndex = bars.indexOf(Math.max(...bars));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-heading font-bold text-lg text-font-main-sub">
          Orders Overview
        </h3>
        <select
          value={range}
          onChange={(e) =>
            setRange(e.target.value as (typeof RANGE_OPTIONS)[number])
          }
          className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 font-medium text-gray-600 outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 font-medium mb-4">{rangeLabel}</p>

      <div className="h-40 flex items-end justify-between gap-2 pt-4 border-b border-gray-100 pb-2">
        {bars.map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}%` }}
            className={`w-full rounded-t-sm transition-colors ${
              i === highestIndex
                ? "bg-brand-yellow"
                : "bg-gray-100 hover:bg-brand-yellow/50"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
        {bars.map((_, i) => (
          <span key={i} className="text-center w-full">
            {dayLabels?.[i] ?? `Week ${i + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}
