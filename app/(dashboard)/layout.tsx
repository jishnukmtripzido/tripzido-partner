"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { MobileShell } from "@/components/layout/MobileShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SKIP_AUTH } from "@/lib/devFlags";

// Drill-down screens (detail/edit/create) reached by tapping into a
// list get the full viewport instead of the tab bar — matches the
// usual mobile pattern of losing the tab bar once you're a level
// deep. Prefix match so /fleet/listing, /fleet/listing/new, and
// /fleet/schedule-templates/new all hide it without a separate entry
// per sub-route.
const HIDE_BOTTOM_NAV_PREFIXES = [
  "/fleet/listing",
  "/fleet/schedule-templates",
  "/bookings/detail",
  "/settings/terms",
  "/settings/schedule-templates/edit",
];

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { open, closeSidebar } = useSidebar();
  const pathname = usePathname();
  const showBottomNav = !HIDE_BOTTOM_NAV_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  return (
    <MobileShell>
      <Sidebar open={open} onClose={closeSidebar} />
      {/* pb-20 only needed to reserve room for BottomNav when it's
          actually rendered — dropped on drill-down screens so content
          uses the full height instead of leaving dead space at the
          bottom. */}
      <div
        className={`flex-1 flex flex-col min-h-0 ${showBottomNav ? "pb-20" : ""}`}
      >
        {children}
      </div>
      {showBottomNav && <BottomNav />}
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
