"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { MobileShell } from "@/components/layout/MobileShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SKIP_AUTH } from "@/lib/devFlags";

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { open, closeSidebar } = useSidebar();

  return (
    <MobileShell>
      <Sidebar open={open} onClose={closeSidebar} />
      {/* pb-20 reserves room for the absolutely-positioned BottomNav,
          exactly like the original `pb-20` wrapper in each mockup. */}
      <div className="flex-1 flex flex-col pb-20 min-h-0">{children}</div>
      <BottomNav />
    </MobileShell>
  );
}

/** Shared chrome (sidebar + bottom nav) + auth guard for every screen under the dashboard tabs. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!SKIP_AUTH && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!SKIP_AUTH && !isAuthenticated) return null;

  return (
    <SidebarProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </SidebarProvider>
  );
}
