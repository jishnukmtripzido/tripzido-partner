"use client";

import { Skeleton } from "@/components/ui/Skeleton";

// Shapes mirror the real sections so the page doesn't jump when data lands.

export function BalanceCardSkeleton() {
  return (
    <div className="rounded-2xl bg-brand-secondary/90 p-5 shadow-md">
      <div className="flex items-start justify-between">
        <div className="h-2.5 w-28 rounded bg-white/20 animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-white/15 animate-pulse" />
      </div>
      <div className="mt-1 h-9 w-44 max-w-full rounded-lg bg-white/20 animate-pulse" />
      <div className="mt-3 h-2.5 w-40 rounded bg-white/15 animate-pulse" />
      <div className="mt-5 h-9 w-32 rounded-xl bg-white/20 animate-pulse" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-4 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-24" />
      <Skeleton className="mt-2.5 h-2.5 w-28" />
    </div>
  );
}

// 7 bars matching the real week-view chart, staggered heights so it
// reads as a chart silhouette rather than a plain gray block.
export function OrdersOverviewChartSkeleton() {
  const heights = [40, 65, 30, 80, 50, 90, 60];
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
      <div className="flex h-32 items-end justify-between gap-2">
        {heights.map((h, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-lg bg-gray-100 animate-pulse"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {heights.map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1" />
        ))}
      </div>
    </div>
  );
}

export function FleetSummarySkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 ml-1 h-2.5 w-20" />
      <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white py-3.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grouped list of booking rows (DashboardBookingRow's shape). */
export function BookingListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div>
      <Skeleton className="mb-2 ml-1 h-2.5 w-24" />
      <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2.5 py-2.5">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="space-y-2 px-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-56 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <BalanceCardSkeleton />
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white py-3.5 shadow-sm"
              >
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2.5">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <OrdersOverviewChartSkeleton />
          </div>
          <div className="space-y-5">
            <FleetSummarySkeleton />
            <BookingListSkeleton rows={4} />
          </div>
        </div>
      </div>
    </main>
  );
}
