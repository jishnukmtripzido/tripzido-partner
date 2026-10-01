"use client";

import { useEffect, useState } from "react";
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
  hint: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const SECTIONS: SidebarSection[] = [
  {
    title: "Business",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        hint: "Earnings & activity",
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
        href: "/bookings",
        label: "Bookings",
        hint: "Upcoming & past rentals",
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
        href: "/fleet",
        label: "My Fleet",
        hint: "Listings, pricing & photos",
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
        hint: "Mark bikes unavailable",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        ),
      },
    ],
  },
  {
    title: "Account",
    links: [
      {
        href: "/ledger",
        label: "Ledger",
        hint: "Payouts & transactions",
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
        href: "/profile",
        label: "Profile",
        hint: "Your business details",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        ),
      },
      {
        href: "/settings",
        label: "Settings",
        hint: "Bank, KYC & preferences",
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
    ],
  },
];

const LINKS = SECTIONS.flatMap((s) => s.links);

// Longest-prefix match — same fix as DesktopSidebar. Prevents parent
// and child routes (e.g. "/fleet" and "/fleet/block") from both
// lighting up at once when the pathname is the more specific one.
function getActiveHref(pathname: string): string | null {
  const matches = LINKS.filter(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((longest, l) =>
    l.href.length > longest.href.length ? l : longest,
  ).href;
}

function getInitials(first?: string, last?: string): string {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return initials || "P";
}

/**
 * Slide-in drawer opened from the hamburger button in Header. Uses
 * useMountTransition so it plays a real enter AND exit animation.
 * Backdrop reuses the existing .modal-backdrop-* fade classes; the
 * drawer panel uses the .drawer-panel-* slide classes.
 *
 * Layout: brand header with a tappable profile card, links grouped
 * into sections (each with a one-line hint so new partners know what
 * lives where), and a logout that asks for confirmation inline so a
 * stray tap near the bottom edge can't sign the partner out.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, token, refreshToken, logout } = useAuth();
  const { shouldRender, phase } = useMountTransition(open, 250);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const activeHref = getActiveHref(pathname);

  // Reset the logout confirmation whenever the drawer closes, so it
  // always reopens in its default state.
  useEffect(() => {
    if (!open) setConfirmLogout(false);
  }, [open]);

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

  const fullName = user
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : "Partner";

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />

      <aside
        className={`drawer-panel drawer-panel-${phase} absolute left-0 top-0 bottom-0 w-[85%] max-w-xs bg-brand-bg shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Brand header + profile card */}
        <div className="bg-linear-to-br from-banner-from to-banner-to px-5 pt-safe pb-5 rounded-br-3xl">
          <div className="flex items-center justify-between pt-5 mb-5">
            <div className="flex items-center gap-2">
              <div className="bg-brand-secondary rounded-lg flex items-center justify-center h-8 w-8">
                <svg
                  className="w-5 h-5 text-brand-yellow"
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
              <h2 className="font-heading font-extrabold text-lg tracking-tight text-brand-secondary">
                tripzido{" "}
                <span className="font-semibold text-brand-secondary/60 text-xs tracking-normal align-middle">
                  partner
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="h-9 w-9 rounded-full bg-white/40 text-brand-secondary flex items-center justify-center active:bg-white/70 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <Link
            href={"/profile" as Route}
            onClick={onClose}
            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-brand-secondary text-brand-yellow flex items-center justify-center font-heading font-bold text-base shrink-0">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-sm text-font-main-sub truncate">
                {fullName}
              </p>
              <p className="text-xs text-font-dim truncate">
                {user?.phone_number ?? "Not signed in"}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                {section.title}
              </p>
              <div className="bg-white rounded-2xl p-1.5 space-y-0.5 shadow-sm">
                {section.links.map((link) => {
                  const active = link.href === activeHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors ${
                        active ? "bg-brand-yellow/25" : "active:bg-gray-100"
                      }`}
                    >
                      <span
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? "bg-brand-yellow-lg text-brand-secondary"
                            : "bg-gray-100 text-font-dim"
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
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold truncate ${
                            active ? "text-brand-secondary" : "text-font-main-sub"
                          }`}
                        >
                          {link.label}
                        </span>
                        <span className="block text-xs text-font-dim truncate">
                          {link.hint}
                        </span>
                      </span>
                      {active && (
                        <span
                          className="h-2 w-2 rounded-full bg-brand-yellow-lg shrink-0 mr-1"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout with inline confirmation */}
        <div className="pb-safe">
          <div className="px-3 pt-2 pb-4">
            {confirmLogout ? (
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <p className="text-sm font-semibold text-font-main-sub mb-3 px-1">
                  Log out of Tripzido Partner?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-font-main-sub active:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white active:bg-red-600 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl bg-white shadow-sm text-sm font-semibold text-red-500 active:bg-red-50 transition-colors"
              >
                <span className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
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
                </span>
                Log out
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
