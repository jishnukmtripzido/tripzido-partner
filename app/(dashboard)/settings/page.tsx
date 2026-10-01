"use client";

import Link from "next/link";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";

interface SettingsLink {
  href: Route;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const SECTIONS: { title: string; links: SettingsLink[] }[] = [
  {
    title: "Listings",
    links: [
      {
        href: "/settings/pickup-points",
        label: "Pickup points",
        hint: "Exact addresses & contacts for your listings",
        icon: (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </>
        ),
      },
      {
        href: "/settings/schedule-templates",
        label: "Schedule templates",
        hint: "Reusable weekly hours for your listings",
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
        href: "/settings/terms",
        label: "Terms & Conditions",
        hint: "Shown to customers on every listing",
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
  {
    title: "Account & payouts",
    links: [
      {
        href: "/settings/bank-accounts",
        label: "Bank account details",
        hint: "Your payout account & new submissions",
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
        hint: "Uploaded documents & new submissions",
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
];

export default function SettingsPage() {
  const { openSidebar } = useSidebar();

  return (
    <div className="bg-brand-bg h-full flex flex-col">
      <Header title="Settings" onMenuClick={openSidebar} />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 lg:px-8 lg:pt-7">
        <div className="mx-auto max-w-5xl space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:items-start">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                {section.title}
              </h2>
              <div className="rounded-2xl bg-white p-1.5 shadow-sm space-y-0.5">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 active:bg-gray-100 transition-colors"
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
      </main>
    </div>
  );
}
