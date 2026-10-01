"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useAuth } from "@/context/AuthContext";
import { logoutApi } from "@/services/auth.service";
import { useConfirmedBookingsCount } from "@/hooks/useConfirmedBookingsCount";
import {
  SECTIONS,
  getActiveHref,
  getInitials,
} from "@/components/layout/Sidebar";

/**
 * Permanent left sidebar at lg: and up. Same links, sections and
 * confirm-to-logout as the mobile drawer, but deliberately quieter: a
 * white panel (so it reads apart from the cream page) with no yellow
 * banner competing with the dashboard (just a yellow brand strip,
 * matching the View payouts button), compact rows so every link fits
 * on short laptop screens, log out as the last nav row, and the
 * profile tucked into the footer.
 * Carries the Bookings badge that BottomNav shows on small screens.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, token, refreshToken, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const confirmedCount = useConfirmedBookingsCount();
  const activeHref = getActiveHref(pathname);

  function handleLogout() {
    if (token && refreshToken) {
      logoutApi(token, refreshToken).catch(() => {
        // Ignored — session is cleared locally regardless.
      });
    }
    logout();
  }

  const fullName = user
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : "Partner";

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-dvh relative z-10 bg-white border-r border-gray-200/80">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-[72px] shrink-0 bg-brand-yellow">
        <div className="bg-brand-secondary rounded-lg flex items-center justify-center h-8 w-8">
          <svg
            className="w-5 h-5 text-brand-yellow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <p className="font-heading font-extrabold text-lg tracking-tight text-brand-secondary">
          tripzido{" "}
          <span className="font-semibold text-brand-secondary/60 text-xs tracking-normal align-middle">
            partner
          </span>
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 pt-4 pb-4 space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const active = link.href === activeHref;
                const badge = link.href === "/bookings" ? confirmedCount : 0;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.hint}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-brand-bg font-semibold text-brand-secondary"
                        : "font-medium text-font-dim hover:bg-gray-50 hover:text-font-main-sub"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-yellow-lg"
                        aria-hidden="true"
                      />
                    )}
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {link.icon}
                    </svg>
                    <span className="min-w-0 flex-1 truncate">
                      {link.label}
                    </span>
                    {badge > 0 && (
                      <span
                        className="min-w-[20px] h-5 rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-5 tabular-nums text-white shrink-0"
                        aria-label={`${badge} upcoming to hand over`}
                      >
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Log out — a nav row like the others, confirmed inline so a
            stray click can't sign the partner out */}
        <div className="border-t border-gray-100 pt-3">
          {confirmLogout ? (
            <div className="rounded-xl bg-brand-bg p-3">
              <p className="text-sm font-semibold text-font-main-sub mb-3 px-1">
                Log out of Tripzido Partner?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="py-2 rounded-lg text-sm font-semibold bg-white text-font-main-sub shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          )}
        </div>
      </nav>

      {/* Profile */}
      <div className="shrink-0 border-t border-gray-100 p-3">
        <Link
          href={"/profile" as Route}
          className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-brand-secondary text-brand-yellow flex items-center justify-center font-heading font-bold text-xs shrink-0">
            {getInitials(user?.first_name, user?.last_name)}
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-sm text-font-main-sub truncate">
              {fullName}
            </span>
            <span className="block text-xs text-font-dim truncate">
              {user?.phone_number ?? "Not signed in"}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
