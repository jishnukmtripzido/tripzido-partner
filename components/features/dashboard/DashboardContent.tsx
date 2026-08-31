"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BalanceCard } from "@/components/features/dashboard/BalanceCard";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { OrdersOverviewChart } from "@/components/features/dashboard/OrdersOverviewChart";
import { CompactBookingCard } from "@/components/features/bookings/CompactBookingCard";
import type { VendorDashboardData } from "@/types/dashboard.types";

const VENDOR_STATUS_BANNER: Record<
  string,
  { style: string; message: (reason: string) => string }
> = {
  PENDING: {
    style: "bg-yellow-50 border-yellow-200 text-yellow-800",
    message: () =>
      "Your vendor account is pending admin approval. Some features may be limited until approved.",
  },
  REJECTED: {
    style: "bg-red-50 border-red-200 text-red-800",
    message: (reason) =>
      reason
        ? `Your vendor application was rejected: ${reason}`
        : "Your vendor application was rejected.",
  },
  SUSPENDED: {
    style: "bg-red-50 border-red-200 text-red-800",
    message: () =>
      "Your vendor account has been suspended. Contact support for details.",
  },
  BANNED: {
    style: "bg-red-50 border-red-200 text-red-800",
    message: () => "Your vendor account has been permanently banned.",
  },
};

function toBarHeights(counts: number[]): number[] {
  const max = Math.max(...counts);
  if (max <= 0) return counts.map(() => 4);
  return counts.map((c) => Math.max(Math.round((c / max) * 100), 6));
}

function getLast7DayLabels(): string[] {
  const labels: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
  }
  return labels;
}

const currency = (n: number) =>
  `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export function DashboardContent({
  promise,
}: {
  promise: Promise<VendorDashboardData>;
}) {
  // Suspends only this component. The parent's <Suspense> fallback
  // covers the gap — Header etc. above it render immediately.
  const data = use(promise);
  const router = useRouter();

  const banner = VENDOR_STATUS_BANNER[data.vendor_status];
  const hasNeedsAttention =
    data.bookings_to_start.length > 0 || data.bookings_to_return.length > 0;

  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar px-5 lg:px-8 pt-6 lg:pt-8 pb-6 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start bg-brand-bg">
      {banner && (
        <div
          className={`lg:col-span-2 border rounded-xl px-4 py-3 text-sm font-medium ${banner.style}`}
        >
          {banner.message(data.vendor_rejection_reason)}
        </div>
      )}

      <div className="lg:col-span-2">
        <BalanceCard
          balance={Number(data.current_balance)}
          onWithdraw={() => {
            // TODO: wire up to the real withdrawal flow/endpoint —
            // manual payouts only for now, no vendor-initiated action
            // exists yet.
          }}
        />
      </div>

      {hasNeedsAttention && (
        <div className="space-y-3 lg:col-span-2">
          <h3 className="font-heading font-bold text-base text-font-main-sub">
            Needs attention
          </h3>

          {data.bookings_to_start.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.bookings_to_start.map((booking) => (
                <CompactBookingCard
                  key={booking.id}
                  booking={booking}
                  variant="compact"
                  onClick={() =>
                    router.push(`/bookings/detail?id=${booking.id}` as Route)
                  }
                />
              ))}
            </div>
          )}

          {data.bookings_to_return.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <p className="text-xs font-semibold text-font-dim uppercase tracking-wide lg:col-span-2">
                Ready to return
              </p>
              {data.bookings_to_return.map((booking) => (
                <CompactBookingCard
                  key={booking.id}
                  booking={booking}
                  variant="compact"
                  onClick={() =>
                    router.push(`/bookings/detail?id=${booking.id}` as Route)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="lg:col-span-1">
        <StatCard
          iconTone="yellow"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Revenue (This month)"
          value={currency(Number(data.revenue_this_month))}
          trendPct={data.revenue_trend_pct}
          lastLabel="Last month"
          lastValue={currency(Number(data.revenue_last_month))}
        />
      </div>

      <div className="lg:col-span-1">
        <StatCard
          iconTone="gray"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
          label="Orders (This month)"
          value={String(data.orders_this_month)}
          trendPct={data.orders_trend_pct}
          lastLabel="Last month"
          lastValue={String(data.orders_last_month)}
        />
      </div>

      <div className="lg:col-span-2">
        <OrdersOverviewChart
          bars={toBarHeights(data.weekly_order_bars)}
          dayLabels={getLast7DayLabels()}
          rangeLabel={data.range_label}
        />
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Your fleet</h3>
          <button
            onClick={() => router.push("/fleet" as Route)}
            className="text-xs font-semibold text-brand-yellow-lg"
          >
            Manage
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-heading font-extrabold text-font-main-sub">
              {data.fleet_total_listings}
            </p>
            <p className="text-xs text-font-dim mt-0.5">Listings</p>
          </div>
          <div>
            <p className="text-2xl font-heading font-extrabold text-font-main-sub">
              {data.fleet_pending_approval}
            </p>
            <p className="text-xs text-font-dim mt-0.5">Pending approval</p>
          </div>
          <div>
            <p className="text-2xl font-heading font-extrabold text-font-main-sub">
              {data.fleet_blocked_units}
            </p>
            <p className="text-xs text-font-dim mt-0.5">Blocked now</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-font-main-sub">
            Recent bookings
          </h3>
          <button
            onClick={() => router.push("/bookings" as Route)}
            className="text-xs font-bold text-brand-yellow-lg"
          >
            See all
          </button>
        </div>
        {data.recent_bookings.length === 0 ? (
          <p className="text-sm text-font-dim text-center py-6">
            No bookings yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.recent_bookings.map((booking) => (
              <CompactBookingCard
                key={booking.id}
                booking={booking}
                variant="compact"
                onClick={() =>
                  router.push(`/bookings/detail?id=${booking.id}` as Route)
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
