"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function BalanceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-40 mb-5" />
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-6 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// 7 bars matching the real week-view chart, staggered heights so it
// reads as a chart silhouette rather than a plain gray block.
export function OrdersOverviewChartSkeleton() {
  const heights = [40, 65, 30, 80, 50, 90, 60];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex items-end justify-between gap-2 h-32">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 h-full flex items-end">
            <div
              className="w-full rounded-t-md bg-gray-200 animate-pulse"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {heights.map((_, i) => (
          <Skeleton key={i} className="h-2 w-6" />
        ))}
      </div>
    </div>
  );
}

export function FleetSummarySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Best-guess shape for CompactBookingCard (thumbnail + two text lines +
// a status pill). Share that component if you want this matched exactly.
export function BookingCardSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
      <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full shrink-0" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar px-5 lg:px-8 pt-6 lg:pt-8 pb-6 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start bg-brand-bg">
      <div className="lg:col-span-2">
        <BalanceCardSkeleton />
      </div>

      <div className="lg:col-span-1">
        <StatCardSkeleton />
      </div>
      <div className="lg:col-span-1">
        <StatCardSkeleton />
      </div>

      <div className="lg:col-span-2">
        <OrdersOverviewChartSkeleton />
      </div>

      <div className="lg:col-span-2">
        <FleetSummarySkeleton />
      </div>

      <div className="space-y-3 lg:col-span-2">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
