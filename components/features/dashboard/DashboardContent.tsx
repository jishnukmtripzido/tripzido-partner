"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useAuth } from "@/context/AuthContext";
import { BalanceCard } from "@/components/features/dashboard/BalanceCard";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { OrdersOverviewChart } from "@/components/features/dashboard/OrdersOverviewChart";
import { DashboardBookingRow } from "@/components/features/dashboard/DashboardBookingRow";
import { DashboardErrorBoundary } from "@/components/features/dashboard/DashboardErrorBoundary";
import {
  BalanceCardSkeleton,
  StatCardSkeleton,
  OrdersOverviewChartSkeleton,
  FleetSummarySkeleton,
  BookingListSkeleton,
} from "@/components/features/dashboard/DashboardSkeleton";
import {
  getVendorDashboardStatusApi,
  getVendorDashboardAttentionApi,
  getVendorDashboardStatsApi,
  getVendorDashboardFleetApi,
  getVendorDashboardRecentBookingsApi,
} from "@/services/dashboard.service";
import { queryKeys } from "@/lib/queryKeys";
import type {
  VendorDashboardStatus,
  VendorDashboardAttention,
  VendorDashboardStats,
  VendorDashboardFleet,
  VendorDashboardRecentBookings,
} from "@/types/dashboard.types";

// Unwraps the {success, message, data} envelope into the plain typed
// data (or throws) so useSuspenseQuery's returned `data` is already
// the shape each section renders, and a failed envelope surfaces as a
// thrown error for the nearest DashboardErrorBoundary to catch.
function unwrap<T>(res: { success: boolean; message: string; data?: T }): T {
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load dashboard data");
  }
  return res.data;
}

const VENDOR_STATUS_BANNER: Record<
  string,
  { style: string; message: (reason: string) => string }
> = {
  PENDING: {
    style: "bg-amber-50 text-amber-900",
    message: () =>
      "Your vendor account is pending admin approval. Some features may be limited until approved.",
  },
  REJECTED: {
    style: "bg-red-50 text-red-800",
    message: (reason) =>
      reason
        ? `Your vendor application was rejected: ${reason}`
        : "Your vendor application was rejected.",
  },
  SUSPENDED: {
    style: "bg-red-50 text-red-800",
    message: () =>
      "Your vendor account has been suspended. Contact support for details.",
  },
  BANNED: {
    style: "bg-red-50 text-red-800",
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

// Whole rupees for the half-width month tiles, so large amounts fit.
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS: { href: Route; label: string; icon: string }[] = [
  {
    href: "/fleet/listing/new",
    label: "Add bike",
    icon: "M12 4v16m8-8H4",
  },
  {
    href: "/fleet/block",
    label: "Block bikes",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
  {
    href: "/settings/pickup-points",
    label: "Pickup points",
    icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

interface DashboardContentProps {
  token: string;
}

/**
 * Five independent Suspense boundaries instead of one — each section
 * appears the moment ITS OWN data is ready, rather than every section
 * waiting on whichever query happens to be slowest. Status+Balance is
 * typically fastest (a couple of scalar vendor fields + one
 * aggregate); Stats is typically heaviest (two month-long aggregates
 * plus 7 daily counts), so it no longer holds everything else hostage
 * while it resolves. The three Stats-fed pieces (both StatCards + the
 * chart) share ONE Suspense boundary, not three — they're three views
 * into the same single statsPromise/API call, so they always resolve
 * or fail together; separate boundaries around a shared promise would
 * just be redundant, not genuinely independent.
 */
export function DashboardContent({ token }: DashboardContentProps) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-8 lg:py-7">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {/* Greeting */}
        <div className="px-1">
          <p className="text-xs text-font-dim">{today}</p>
          <h2 className="mt-0.5 font-heading text-2xl font-bold text-font-main-sub">
            {greeting()}
            {user?.first_name ? `, ${user.first_name}` : ""}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          {/* Balance + status */}
          <SectionBoundary>
            <Suspense fallback={<BalanceCardSkeleton />}>
              <StatusBalanceSection token={token} />
            </Suspense>
          </SectionBoundary>

          {/* Quick actions */}
          <nav aria-label="Quick actions" className="grid grid-cols-3 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 text-center shadow-sm active:scale-[0.98] transition-transform"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-yellow/30 text-brand-secondary">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={action.icon}
                    />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-font-main-sub">
                  {action.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Needs attention — renders nothing when there's nothing due */}
          <div className="lg:col-span-2">
            <SectionBoundary>
              <Suspense fallback={<BookingListSkeleton rows={2} />}>
                <AttentionSection token={token} />
              </Suspense>
            </SectionBoundary>
          </div>

          {/* Month tiles + week chart (one shared query) */}
          <SectionBoundary>
            <Suspense
              fallback={
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </div>
                  <OrdersOverviewChartSkeleton />
                </div>
              }
            >
              <StatsSection token={token} />
            </Suspense>
          </SectionBoundary>

          <div className="space-y-5">
            <SectionBoundary>
              <Suspense fallback={<FleetSummarySkeleton />}>
                <FleetSection token={token} />
              </Suspense>
            </SectionBoundary>

            <SectionBoundary>
              <Suspense fallback={<BookingListSkeleton rows={4} />}>
                <RecentBookingsSection token={token} />
              </Suspense>
            </SectionBoundary>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary
      fallback={({ error, retry }) => (
        <SectionError message={error.message} onRetry={retry} />
      )}
    >
      {children}
    </DashboardErrorBoundary>
  );
}

function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-red-700 shadow-sm">
      <span>{message}</span>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 active:bg-red-100"
      >
        Retry
      </button>
    </div>
  );
}

/** Sidebar-style section title with an optional count and action link. */
function SectionTitle({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: { label: string; href: Route };
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-1">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
        {title}
        {count !== undefined && ` · ${count}`}
      </h3>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-0.5 text-xs font-semibold text-font-main-sub hover:opacity-90 active:opacity-70"
        >
          {action.label}
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

// ── Section 1: Status banner + Balance ─────────────────────────────────

function StatusBalanceSection({ token }: { token: string }) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dashboard.status(token),
    queryFn: () =>
      getVendorDashboardStatusApi(token).then(unwrap<VendorDashboardStatus>),
  });
  const banner = VENDOR_STATUS_BANNER[data.vendor_status];

  return (
    <div className="space-y-3">
      {banner && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${banner.style}`}
        >
          {banner.message(data.vendor_rejection_reason)}
        </div>
      )}
      <BalanceCard balance={Number(data.current_balance)} />
    </div>
  );
}

// ── Section 2: Needs attention ──────────────────────────────────────────

function AttentionSection({ token }: { token: string }) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dashboard.attention(token),
    queryFn: () =>
      getVendorDashboardAttentionApi(token).then(
        unwrap<VendorDashboardAttention>,
      ),
  });
  const router = useRouter();
  const open = (id: number) =>
    router.push(`/bookings/detail?id=${id}` as Route);

  if (data.bookings_to_start.length === 0 && data.bookings_to_return.length === 0)
    return null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {data.bookings_to_start.length > 0 && (
        <section>
          <SectionTitle
            title="To hand over"
            count={data.bookings_to_start.length}
          />
          <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm ring-2 ring-brand-yellow-lg/60">
            {data.bookings_to_start.map((booking) => (
              <DashboardBookingRow
                key={booking.id}
                booking={booking}
                when="start"
                onClick={() => open(booking.id)}
              />
            ))}
          </div>
        </section>
      )}

      {data.bookings_to_return.length > 0 && (
        <section>
          <SectionTitle
            title="To collect back"
            count={data.bookings_to_return.length}
          />
          <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm">
            {data.bookings_to_return.map((booking) => (
              <DashboardBookingRow
                key={booking.id}
                booking={booking}
                when="end"
                onClick={() => open(booking.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Section 3: Revenue + Orders tiles + Weekly chart (one shared query) ──

function StatsSection({ token }: { token: string }) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dashboard.stats(token),
    queryFn: () =>
      getVendorDashboardStatsApi(token).then(unwrap<VendorDashboardStats>),
  });

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle title="This month" />
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            iconTone="yellow"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            label="Revenue"
            value={rupees(Number(data.revenue_this_month))}
            trendPct={data.revenue_trend_pct}
            lastLabel="Last month"
            lastValue={rupees(Number(data.revenue_last_month))}
          />
          <StatCard
            iconTone="gray"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            label="Orders"
            value={String(data.orders_this_month)}
            trendPct={data.orders_trend_pct}
            lastLabel="Last month"
            lastValue={String(data.orders_last_month)}
          />
        </div>
      </section>

      <section>
        <SectionTitle title="This week" />
        <OrdersOverviewChart
          bars={toBarHeights(data.weekly_order_bars)}
          counts={data.weekly_order_bars}
          dayLabels={getLast7DayLabels()}
          rangeLabel={data.range_label}
        />
      </section>
    </div>
  );
}

// ── Section 4: Fleet summary ────────────────────────────────────────────

function FleetSection({ token }: { token: string }) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dashboard.fleet(token),
    queryFn: () =>
      getVendorDashboardFleetApi(token).then(unwrap<VendorDashboardFleet>),
  });

  const stats = [
    { value: data.fleet_total_listings, label: "Listings", href: "/fleet" },
    { value: data.fleet_pending_approval, label: "Pending", href: "/fleet" },
    { value: data.fleet_blocked_units, label: "Blocked", href: "/fleet/block" },
  ] as const;

  return (
    <section>
      <SectionTitle
        title="Your fleet"
        action={{ label: "Manage", href: "/fleet" }}
      />
      <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white py-3.5 shadow-sm">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href as Route}
            className="px-2 text-center hover:opacity-90 active:opacity-70"
          >
            <p className="font-heading text-2xl font-bold leading-none tabular-nums text-font-main-sub">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-font-dim">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Section 5: Recent bookings ──────────────────────────────────────────

function RecentBookingsSection({ token }: { token: string }) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.dashboard.recentBookings(token),
    queryFn: () =>
      getVendorDashboardRecentBookingsApi(token).then(
        unwrap<VendorDashboardRecentBookings>,
      ),
  });
  const router = useRouter();

  return (
    <section>
      <SectionTitle
        title="Recent bookings"
        action={{ label: "See all", href: "/bookings" }}
      />
      {data.recent_bookings.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-font-dim shadow-sm">
          No bookings yet.
        </p>
      ) : (
        <div className="space-y-0.5 rounded-2xl bg-white p-1.5 shadow-sm">
          {data.recent_bookings.map((booking) => (
            <DashboardBookingRow
              key={booking.id}
              booking={booking}
              when="start"
              showStatus
              onClick={() =>
                router.push(`/bookings/detail?id=${booking.id}` as Route)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
