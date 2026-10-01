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
      <Header title="Dashboard" onMenuClick={openSidebar} />
      {token ? <DashboardContent token={token} /> : <DashboardSkeleton />}
    </>
  );
}
