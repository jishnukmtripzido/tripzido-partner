"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { logoutApi } from "@/services/auth.service";
import { getVendorProfileApi } from "@/services/vendor.service";
import { queryKeys } from "@/lib/queryKeys";
import { VENDOR_STATUS_STYLES } from "@/lib/vendorStatus";

interface ProfileLink {
  href: Route;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const SECTIONS: { title: string; links: ProfileLink[] }[] = [
  {
    title: "Business",
    links: [
      {
        href: "/profile/vendor-details",
        label: "Vendor details",
        hint: "Business profile & account status",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        ),
      },
      {
        href: "/settings/bank-accounts",
        label: "Bank accounts",
        hint: "Where your payouts are sent",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"
          />
        ),
      },
      {
        href: "/settings/kyc-documents",
        label: "KYC documents",
        hint: "Verification documents",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        ),
      },
    ],
  },
  {
    title: "App",
    links: [
      {
        href: "/settings",
        label: "Settings",
        hint: "Pickup points, schedules & more",
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
        href: "/settings/terms",
        label: "Terms & Conditions",
        hint: "Partner agreement",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        ),
      },
    ],
  },
];

function getInitials(first?: string, last?: string): string {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return initials || "P";
}

export default function ProfilePage() {
  const { openSidebar } = useSidebar();
  const { user, token, refreshToken, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Same query (and cache entry) as the Vendor details page, so the
  // business name/status here is free once either page has loaded it.
  const { data: vendor } = useQuery({
    queryKey: queryKeys.profile.vendorDetails(token),
    queryFn: async () => {
      const res = await getVendorProfileApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load vendor details");
      }
      return res.data;
    },
    enabled: !!token,
  });

  // Same logout flow as the sidebar: revoke the refresh token on the
  // server (best effort), then clear the local session.
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
    <>
      <Header title="Profile" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-brand-bg px-5 pt-4 pb-8 lg:px-page-narrow lg:pt-7">
        {/* Identity card */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-linear-to-br from-banner-from to-banner-to h-16" />
          <div className="px-4 pb-4">
            <div className="-mt-9 flex items-end justify-between gap-3">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-brand-secondary font-heading text-2xl font-bold text-brand-yellow">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              {vendor && (
                <span
                  className={`mb-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    VENDOR_STATUS_STYLES[vendor.status] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {vendor.status_label}
                </span>
              )}
            </div>
            <h2 className="mt-3 font-heading text-xl font-bold text-font-main-sub">
              {fullName}
            </h2>
            <p className="text-sm text-font-dim">{user?.phone_number}</p>
            {vendor?.business_name && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-font-dim">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {vendor.business_name}
              </p>
            )}
          </div>
        </section>

        {/* Links */}
        <div className="mt-5 space-y-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                {section.title}
              </h3>
              <div className="rounded-2xl bg-white p-1.5 shadow-sm space-y-0.5">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-gray-100 active:bg-gray-100 transition-colors"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        {link.icon}
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-font-main-sub">
                        {link.label}
                      </span>
                      <span className="block truncate text-xs text-font-dim">
                        {link.hint}
                      </span>
                    </span>
                    <svg
                      className="h-5 w-5 shrink-0 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Logout with inline confirmation, same as the sidebar */}
        <div className="mt-5">
          {confirmLogout ? (
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="mb-3 px-1 text-sm font-semibold text-font-main-sub">
                Log out of Tripzido Partner?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-font-main-sub hover:bg-gray-200 active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 active:bg-red-600 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-2.5 py-2.5 text-sm font-semibold text-red-500 shadow-sm hover:bg-red-50 active:bg-red-50 transition-colors"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <svg
                  className="h-5 w-5"
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
              </span>
              Log out
            </button>
          )}
        </div>
      </main>
    </>
  );
}
