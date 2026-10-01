"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useConfirmedBookingsCount } from "@/hooks/useConfirmedBookingsCount";

interface NavItem {
  href: Route;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    // Block Bikes is nested under Fleet, so /fleet/block also lights
    // this tab up (prefix match in BottomNav below).
    href: "/fleet",
    label: "Fleet",
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M15 5a3 3 0 1 0-6 0m6 0h3m-3 0c0 .903-.399 1.713-1.03 2.263M9 5H6m3 0c0 .903.399 1.713 1.03 2.263M14 20h2a2 2 0 0 0 2-2v-5c0-1.692-.859-4.816-4.03-5.737M14 20v0a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v0m4 0v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5m0 0H8a2 2 0 0 1-2-2v-5c0-1.692.859-4.816 4.03-5.737m3.94 0A2.988 2.988 0 0 1 12 8a2.988 2.988 0 0 1-1.97-.737"
        />
      </svg>
    ),
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active) => (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 2.5 : 2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

/**
 * Bottom tab bar shared by every dashboard screen. Active state is a
 * pathname match — Ledger (reached via the Sidebar, not a tab) simply
 * has no tab active, which is more correct than the mockup's fallback.
 * /fleet/block (Block Bikes) lights up Fleet, since it's nested under it.
 *
 * The active tab gets a yellow pill behind a dark icon + label: yellow
 * text on white (the old style) is ~1.6:1 contrast and hard to read
 * outdoors.
 */
export function BottomNav() {
  const pathname = usePathname();
  // Confirmed bookings still waiting for handover — shown as a count on
  // the Bookings tab so upcoming pickups aren't missed.
  const confirmedCount = useConfirmedBookingsCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-stretch border-t border-gray-100 bg-white px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const badge = item.href === "/bookings" ? confirmedCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={
              badge > 0
                ? `${item.label}, ${badge} upcoming to hand over`
                : undefined
            }
            className="flex flex-1 flex-col items-center gap-1 py-1"
          >
            <span
              className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
                active
                  ? "bg-brand-yellow-lg text-brand-secondary"
                  : "text-gray-500"
              }`}
            >
              {item.icon(active)}
              {badge > 0 && (
                <span className="absolute -top-1 right-1.5 min-w-[18px] h-[18px] rounded-full border-2 border-white bg-red-500 px-1 text-center text-[9px] font-bold leading-[14px] tabular-nums text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span
              className={`text-[11px] ${
                active
                  ? "font-bold text-brand-secondary"
                  : "font-medium text-gray-500"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
