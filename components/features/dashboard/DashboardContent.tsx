// "use client";

// import { use } from "react";
// import { useRouter } from "next/navigation";
// import type { Route } from "next";
// import { BalanceCard } from "@/components/features/dashboard/BalanceCard";
// import { StatCard } from "@/components/features/dashboard/StatCard";
// import { OrdersOverviewChart } from "@/components/features/dashboard/OrdersOverviewChart";
// import { CompactBookingCard } from "@/components/features/bookings/CompactBookingCard";
// import type { VendorDashboardData } from "@/types/dashboard.types";

// const VENDOR_STATUS_BANNER: Record<
//   string,
//   { style: string; message: (reason: string) => string }
// > = {
//   PENDING: {
//     style: "bg-yellow-50 border-yellow-200 text-yellow-800",
//     message: () =>
//       "Your vendor account is pending admin approval. Some features may be limited until approved.",
//   },
//   REJECTED: {
//     style: "bg-red-50 border-red-200 text-red-800",
//     message: (reason) =>
//       reason
//         ? `Your vendor application was rejected: ${reason}`
//         : "Your vendor application was rejected.",
//   },
//   SUSPENDED: {
//     style: "bg-red-50 border-red-200 text-red-800",
//     message: () =>
//       "Your vendor account has been suspended. Contact support for details.",
//   },
//   BANNED: {
//     style: "bg-red-50 border-red-200 text-red-800",
//     message: () => "Your vendor account has been permanently banned.",
//   },
// };

// function toBarHeights(counts: number[]): number[] {
//   const max = Math.max(...counts);
//   if (max <= 0) return counts.map(() => 4);
//   return counts.map((c) => Math.max(Math.round((c / max) * 100), 6));
// }

// function getLast7DayLabels(): string[] {
//   const labels: string[] = [];
//   const today = new Date();
//   for (let i = 6; i >= 0; i--) {
//     const d = new Date(today);
//     d.setDate(today.getDate() - i);
//     labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
//   }
//   return labels;
// }

// const currency = (n: number) =>
//   `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// export function DashboardContent({
//   promise,
// }: {
//   promise: Promise<VendorDashboardData>;
// }) {
//   // Suspends only this component. The parent's <Suspense> fallback
//   // covers the gap — Header etc. above it render immediately.
//   const data = use(promise);
//   const router = useRouter();

//   const banner = VENDOR_STATUS_BANNER[data.vendor_status];
//   const hasNeedsAttention =
//     data.bookings_to_start.length > 0 || data.bookings_to_return.length > 0;

//   return (
//     <main className="flex-1 overflow-y-auto hide-scrollbar px-5 lg:px-8 pt-6 lg:pt-8 pb-6 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start bg-brand-bg">
//       {banner && (
//         <div
//           className={`lg:col-span-2 border rounded-xl px-4 py-3 text-sm font-medium ${banner.style}`}
//         >
//           {banner.message(data.vendor_rejection_reason)}
//         </div>
//       )}

//       <div className="lg:col-span-2">
//         <BalanceCard
//           balance={Number(data.current_balance)}
//           onWithdraw={() => {
//             // TODO: wire up to the real withdrawal flow/endpoint —
//             // manual payouts only for now, no vendor-initiated action
//             // exists yet.
//           }}
//         />
//       </div>

//       {hasNeedsAttention && (
//         <div className="space-y-3 lg:col-span-2">
//           <h3 className="font-heading font-bold text-base text-font-main-sub">
//             Needs attention
//           </h3>

//           {data.bookings_to_start.length > 0 && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//               {data.bookings_to_start.map((booking) => (
//                 <CompactBookingCard
//                   key={booking.id}
//                   booking={booking}
//                   variant="compact"
//                   onClick={() =>
//                     router.push(`/bookings/detail?id=${booking.id}` as Route)
//                   }
//                 />
//               ))}
//             </div>
//           )}

//           {data.bookings_to_return.length > 0 && (
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//               <p className="text-xs font-semibold text-font-dim uppercase tracking-wide lg:col-span-2">
//                 Ready to return
//               </p>
//               {data.bookings_to_return.map((booking) => (
//                 <CompactBookingCard
//                   key={booking.id}
//                   booking={booking}
//                   variant="compact"
//                   onClick={() =>
//                     router.push(`/bookings/detail?id=${booking.id}` as Route)
//                   }
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       <div className="lg:col-span-1">
//         <StatCard
//           iconTone="yellow"
//           icon={
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//               />
//             </svg>
//           }
//           label="Revenue (This month)"
//           value={currency(Number(data.revenue_this_month))}
//           trendPct={data.revenue_trend_pct}
//           lastLabel="Last month"
//           lastValue={currency(Number(data.revenue_last_month))}
//         />
//       </div>

//       <div className="lg:col-span-1">
//         <StatCard
//           iconTone="gray"
//           icon={
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
//               />
//             </svg>
//           }
//           label="Orders (This month)"
//           value={String(data.orders_this_month)}
//           trendPct={data.orders_trend_pct}
//           lastLabel="Last month"
//           lastValue={String(data.orders_last_month)}
//         />
//       </div>

//       <div className="lg:col-span-2">
//         <OrdersOverviewChart
//           bars={toBarHeights(data.weekly_order_bars)}
//           dayLabels={getLast7DayLabels()}
//           rangeLabel={data.range_label}
//         />
//       </div>

//       <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-heading font-bold text-lg">Your fleet</h3>
//           <button
//             onClick={() => router.push("/fleet" as Route)}
//             className="text-xs font-semibold text-brand-yellow-lg"
//           >
//             Manage
//           </button>
//         </div>
//         <div className="grid grid-cols-3 gap-3 text-center">
//           <div>
//             <p className="text-2xl font-heading font-extrabold text-font-main-sub">
//               {data.fleet_total_listings}
//             </p>
//             <p className="text-xs text-font-dim mt-0.5">Listings</p>
//           </div>
//           <div>
//             <p className="text-2xl font-heading font-extrabold text-font-main-sub">
//               {data.fleet_pending_approval}
//             </p>
//             <p className="text-xs text-font-dim mt-0.5">Pending approval</p>
//           </div>
//           <div>
//             <p className="text-2xl font-heading font-extrabold text-font-main-sub">
//               {data.fleet_blocked_units}
//             </p>
//             <p className="text-xs text-font-dim mt-0.5">Blocked now</p>
//           </div>
//         </div>
//       </div>

//       <div className="space-y-3 lg:col-span-2">
//         <div className="flex items-center justify-between">
//           <h3 className="font-heading font-bold text-base text-font-main-sub">
//             Recent bookings
//           </h3>
//           <button
//             onClick={() => router.push("/bookings" as Route)}
//             className="text-xs font-bold text-brand-yellow-lg"
//           >
//             See all
//           </button>
//         </div>
//         {data.recent_bookings.length === 0 ? (
//           <p className="text-sm text-font-dim text-center py-6">
//             No bookings yet.
//           </p>
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//             {data.recent_bookings.map((booking) => (
//               <CompactBookingCard
//                 key={booking.id}
//                 booking={booking}
//                 variant="compact"
//                 onClick={() =>
//                   router.push(`/bookings/detail?id=${booking.id}` as Route)
//                 }
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </main>
//   );
// }

"use client";

import { use, Suspense } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BalanceCard } from "@/components/features/dashboard/BalanceCard";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { OrdersOverviewChart } from "@/components/features/dashboard/OrdersOverviewChart";
import { CompactBookingCard } from "@/components/features/bookings/CompactBookingCard";
import { DashboardErrorBoundary } from "@/components/features/dashboard/DashboardErrorBoundary";
import {
  BalanceCardSkeleton,
  StatCardSkeleton,
  OrdersOverviewChartSkeleton,
  FleetSummarySkeleton,
  BookingCardSkeleton,
} from "@/components/features/dashboard/DashboardSkeleton";
import type {
  VendorDashboardStatus,
  VendorDashboardAttention,
  VendorDashboardStats,
  VendorDashboardFleet,
  VendorDashboardRecentBookings,
} from "@/types/dashboard.types";

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

interface DashboardContentProps {
  statusPromise: Promise<VendorDashboardStatus>;
  attentionPromise: Promise<VendorDashboardAttention>;
  statsPromise: Promise<VendorDashboardStats>;
  fleetPromise: Promise<VendorDashboardFleet>;
  recentBookingsPromise: Promise<VendorDashboardRecentBookings>;
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
export function DashboardContent({
  statusPromise,
  attentionPromise,
  statsPromise,
  fleetPromise,
  recentBookingsPromise,
}: DashboardContentProps) {
  return (
    <main className="flex-1 overflow-y-auto hide-scrollbar px-5 lg:px-8 pt-6 lg:pt-8 pb-6 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start bg-brand-bg">
      <div className="lg:col-span-2">
        <DashboardErrorBoundary
          fallback={({ error, retry }) => (
            <SectionError message={error.message} onRetry={retry} />
          )}
        >
          <Suspense fallback={<BalanceCardSkeleton />}>
            <StatusBalanceSection promise={statusPromise} />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      <div className="lg:col-span-2">
        <DashboardErrorBoundary
          fallback={({ error, retry }) => (
            <SectionError message={error.message} onRetry={retry} />
          )}
        >
          <Suspense
            fallback={
              <div className="space-y-3">
                <BookingCardSkeleton />
                <BookingCardSkeleton />
              </div>
            }
          >
            <AttentionSection promise={attentionPromise} />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      <DashboardErrorBoundary
        fallback={({ error, retry }) => (
          <div className="lg:col-span-2">
            <SectionError message={error.message} onRetry={retry} />
          </div>
        )}
      >
        <Suspense
          fallback={
            <>
              <div className="lg:col-span-1">
                <StatCardSkeleton />
              </div>
              <div className="lg:col-span-1">
                <StatCardSkeleton />
              </div>
              <div className="lg:col-span-2">
                <OrdersOverviewChartSkeleton />
              </div>
            </>
          }
        >
          <StatsSection promise={statsPromise} />
        </Suspense>
      </DashboardErrorBoundary>

      <div className="lg:col-span-2">
        <DashboardErrorBoundary
          fallback={({ error, retry }) => (
            <SectionError message={error.message} onRetry={retry} />
          )}
        >
          <Suspense fallback={<FleetSummarySkeleton />}>
            <FleetSection promise={fleetPromise} />
          </Suspense>
        </DashboardErrorBoundary>
      </div>

      <div className="lg:col-span-2">
        <DashboardErrorBoundary
          fallback={({ error, retry }) => (
            <SectionError message={error.message} onRetry={retry} />
          )}
        >
          <Suspense
            fallback={
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                  <BookingCardSkeleton />
                </div>
              </div>
            }
          >
            <RecentBookingsSection promise={recentBookingsPromise} />
          </Suspense>
        </DashboardErrorBoundary>
      </div>
    </main>
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
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700 flex items-center justify-between gap-3">
      <span>{message}</span>
      <button
        onClick={onRetry}
        className="text-xs font-bold text-red-700 underline shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

// ── Section 1: Status banner + Balance ─────────────────────────────────

function StatusBalanceSection({
  promise,
}: {
  promise: Promise<VendorDashboardStatus>;
}) {
  const data = use(promise);
  const banner = VENDOR_STATUS_BANNER[data.vendor_status];

  return (
    <div className="space-y-5">
      {banner && (
        <div
          className={`border rounded-xl px-4 py-3 text-sm font-medium ${banner.style}`}
        >
          {banner.message(data.vendor_rejection_reason)}
        </div>
      )}
      <BalanceCard
        balance={Number(data.current_balance)}
        onWithdraw={() => {
          // TODO: wire up to the real withdrawal flow/endpoint —
          // manual payouts only for now, no vendor-initiated action
          // exists yet.
        }}
      />
    </div>
  );
}

// ── Section 2: Needs attention ──────────────────────────────────────────

function AttentionSection({
  promise,
}: {
  promise: Promise<VendorDashboardAttention>;
}) {
  const data = use(promise);
  const router = useRouter();
  const hasNeedsAttention =
    data.bookings_to_start.length > 0 || data.bookings_to_return.length > 0;

  if (!hasNeedsAttention) return null;

  return (
    <div className="space-y-3">
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
  );
}

// ── Section 3: Revenue card + Orders card + Weekly chart (one shared promise) ──

function StatsSection({ promise }: { promise: Promise<VendorDashboardStats> }) {
  const data = use(promise);

  return (
    <>
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
    </>
  );
}

// ── Section 4: Fleet summary ────────────────────────────────────────────

function FleetSection({ promise }: { promise: Promise<VendorDashboardFleet> }) {
  const data = use(promise);
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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
  );
}

// ── Section 5: Recent bookings ──────────────────────────────────────────

function RecentBookingsSection({
  promise,
}: {
  promise: Promise<VendorDashboardRecentBookings>;
}) {
  const data = use(promise);
  const router = useRouter();

  return (
    <div className="space-y-3">
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
  );
}
