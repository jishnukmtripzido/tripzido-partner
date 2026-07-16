"use client";

import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";

// Placeholder — no bookings mockup was provided yet. Swap this body
// out once you share the Bookings screen design.
export default function BookingsPage() {
  const { openSidebar } = useSidebar();

  return (
    <>
      <Header title="Bookings" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6 flex items-center justify-center">
        <p className="text-sm font-medium text-font-dim text-center">
          Bookings screen coming soon.
        </p>
      </main>
    </>
  );
}
