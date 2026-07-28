"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/context/AuthContext";
import { logoutApi } from "@/services/auth.service";
import { useMountTransition } from "@/hooks/useMountTransition";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface SidebarLink {
  href: Route;
  label: string;
  icon: React.ReactNode;
}

const LINKS: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    ),
  },
  {
    href: "/fleet",
    label: "My Fleet",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: "/fleet/block",
    label: "Block Bikes",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    ),
  },
  {
    href: "/bookings",
    label: "Bookings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: "/ledger",
    label: "Ledger",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <circle cx="12" cy="12" r="3" strokeWidth={2} />
      </>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
  },
];

/**
 * Slide-in drawer opened from the hamburger button in Header. Uses
 * useMountTransition so it plays a real enter AND exit animation —
 * previously this referenced animate-overlay-in / animate-drawer-in,
 * neither of which exist in globals.css, so it had no animation at
 * all. Backdrop reuses the existing .modal-backdrop-* fade classes;
 * the drawer panel uses the new .drawer-panel-* slide classes.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, token, refreshToken, logout } = useAuth();
  const { shouldRender, phase } = useMountTransition(open, 250);

  if (!shouldRender) return null;

  function handleLogout() {
    if (token && refreshToken) {
      logoutApi(token, refreshToken).catch(() => {
        // Ignored — session is cleared locally regardless.
      });
    }
    onClose();
    logout();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />

      <aside
        className={`drawer-panel drawer-panel-${phase} absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-white shadow-2xl flex flex-col pt-safe`}
      >
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-brand-yellow-lg p-1.5 rounded-lg flex items-center justify-center h-8 w-8">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="font-heading font-extrabold text-lg tracking-tight">
                tripzido{" "}
                <span className="font-semibold text-font-dim text-xs tracking-normal align-middle">
                  partner
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="text-gray-400 hover:text-font-main-sub transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-yellow/20 text-brand-secondary flex items-center justify-center font-heading font-bold">
              {user?.first_name?.[0]?.toUpperCase() ?? "P"}
            </div>
            <div>
              <p className="font-semibold text-sm text-font-main-sub">
                {user
                  ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                  : "Partner"}
              </p>
              <p className="text-xs text-font-dim">
                {user?.phone_number ?? "Not signed in"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand-yellow/20 text-brand-secondary"
                    : "text-font-dim hover:bg-gray-50"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 pb-safe">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}
