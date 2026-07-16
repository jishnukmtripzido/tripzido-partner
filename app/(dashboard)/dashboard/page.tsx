"use client";

import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { BalanceCard } from "@/components/features/dashboard/BalanceCard";
import { StatCard } from "@/components/features/dashboard/StatCard";
import { OrdersOverviewChart } from "@/components/features/dashboard/OrdersOverviewChart";
import { MOCK_DASHBOARD_STATS } from "@/lib/mockData";

export default function DashboardPage() {
  const { openSidebar } = useSidebar();
  const stats = MOCK_DASHBOARD_STATS;

  const currency = (n: number) =>
    `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <Header
        title="Dashboard"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="relative p-2 bg-gray-50 rounded-full border border-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-6 pb-6 space-y-5">
        <BalanceCard
          balance={stats.currentBalance}
          onWithdraw={() => {
            // TODO: wire up to the real withdrawal flow/endpoint
          }}
        />

        <StatCard
          iconTone="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Revenue (This month)"
          value={currency(stats.revenueThisMonth)}
          trendPct={stats.revenueTrendPct}
          lastLabel="Last month"
          lastValue={currency(stats.revenueLastMonth)}
        />

        <StatCard
          iconTone="gray"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
          label="Orders (This month)"
          value={String(stats.ordersThisMonth)}
          trendPct={stats.ordersTrendPct}
          lastLabel="Last month"
          lastValue={String(stats.ordersLastMonth)}
        />

        <OrdersOverviewChart bars={stats.weeklyOrderBars} rangeLabel={stats.rangeLabel} />
      </main>
    </>
  );
}
