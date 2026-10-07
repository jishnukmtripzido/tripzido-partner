"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";

// Mirrors what the backend allows a SUSPENDED vendor: read everything,
// keep serving existing bookings, nothing else.
export const SUSPENDED_MESSAGE =
  "Your vendor account has been suspended. You can still view your account and manage your existing bookings, but other changes are turned off. Contact support for details.";

/** Inline banner for pages a suspended vendor can view but not change. */
export function SuspendedNotice({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      className={`rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 ${className}`}
    >
      {SUSPENDED_MESSAGE}
    </div>
  );
}

/**
 * Replaces a create/edit-only screen (new listing, edit pickup point, …)
 * for a suspended vendor — the whole page exists only to submit a change
 * the backend would reject.
 */
export function SuspendedBlockedScreen() {
  const router = useRouter();
  return (
    <>
      <Header title="Not available" onBack={() => router.back()} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 bg-brand-bg lg:px-page-narrow lg:pt-7">
        <SuspendedNotice />
      </main>
    </>
  );
}
