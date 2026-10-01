"use client";

import { SidebarPanel } from "@/components/layout/Sidebar";

/**
 * Permanent left sidebar at lg: and up — the same panel the mobile
 * drawer slides in (brand header, profile card, sectioned links,
 * confirm-to-logout), so both screen sizes share one navigation design.
 */
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:block w-72 shrink-0 h-dvh relative z-10 border-r border-gray-200/80">
      <SidebarPanel showBadges />
    </aside>
  );
}
