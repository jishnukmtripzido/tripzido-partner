"use client";

import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { DashboardContent } from "@/components/features/dashboard/DashboardContent";
import { DashboardSkeleton } from "@/components/features/dashboard/DashboardSkeleton";

export default function DashboardPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();

  return (
    <>
      <Header
        title="Dashboard"
        onMenuClick={openSidebar}
        // rightSlot={
        //   <button className="relative p-2 bg-gray-50 rounded-full border border-gray-100 text-gray-600">
        //     <svg
        //       className="w-5 h-5"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //     >
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth={2}
        //         d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        //       />
        //     </svg>
        //     <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        //   </button>
        // }
      />
      {token ? <DashboardContent token={token} /> : <DashboardSkeleton />}
    </>
  );
}
