"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

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
        className="w-6 h-6 mb-1"
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
    // this tab up — see isActive() below.
    href: "/fleet",
    label: "Fleet",
    icon: (active) => (
      <svg
        className="w-6 h-6 mb-1"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M19.5 13.5A3.5 3.5 0 1 0 23 17a3.5 3.5 0 0 0-3.5-3.5ZM19.5 19A2 2 0 1 1 21.5 17 2 2 0 0 1 19.5 19ZM4.5 13.5A3.5 3.5 0 1 0 8 17a3.5 3.5 0 0 0-3.5-3.5ZM4.5 19A2 2 0 1 1 6.5 17 2 2 0 0 1 4.5 19Z" />
        <path d="M15.5 8H13V6a1 1 0 0 0-2 0v2H8.5a.5.5 0 0 0-.5.5v1.944A4.52 4.52 0 0 0 9.873 14H14.5a.5.5 0 0 0 .5-.5V10.5A2.5 2.5 0 0 1 17.5 13H19a1 1 0 0 0 0-2h-1.5a.5.5 0 0 0-.5.5.5.5 0 0 0-.5.5v1H14.5v-2H16v-2h-.5z" />
      </svg>
    ),
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: (active) => (
      <svg
        className="w-6 h-6 mb-1"
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
        className="w-6 h-6 mb-1"
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
 */
export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/fleet") return pathname.startsWith("/fleet");
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-white border-t border-gray-200 absolute bottom-0 w-full flex justify-around items-center pb-safe pt-2 px-2 z-20">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 transition-colors ${
              active
                ? "text-brand-yellow-lg"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {item.icon(active)}
            <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
