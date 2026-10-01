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

/**
 * Compact month tile (Revenue / Orders) — sized to sit two-up on a
 * phone, so the value and trend stay readable at half width.
 */
export function StatCard({
  icon,
  iconTone,
  label,
  value,
  trendPct,
  lastLabel,
  lastValue,
}: StatCardProps) {
  const isPositive = trendPct > 0;
  const isNegative = trendPct < 0;
  const trendColor = isPositive
    ? "bg-green-100 text-green-700"
    : isNegative
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600";

  return (
    <section className="h-full rounded-2xl bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            iconTone === "yellow"
              ? "bg-brand-yellow-lg text-brand-secondary"
              : "bg-gray-100 text-font-dim"
          }`}
        >
          {icon}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${trendColor}`}
          aria-label={`${isNegative ? "Down" : isPositive ? "Up" : "No change"} ${Math.abs(trendPct)} percent versus last month`}
        >
          {isPositive || isNegative ? (
            <svg
              className={`h-2.5 w-2.5 ${isNegative ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          ) : null}
          {Math.abs(trendPct)}%
        </span>
      </div>
      <p className="mt-3 text-xs text-font-dim">{label}</p>
      <p className="mt-0.5 break-words font-heading text-xl font-bold tabular-nums text-font-main-sub">
        {value}
      </p>
      <p className="mt-2 truncate text-[11px] text-font-dim">
        {lastLabel}{" "}
        <span className="font-semibold tabular-nums text-font-main-sub">
          {lastValue}
        </span>
      </p>
    </section>
  );
}
