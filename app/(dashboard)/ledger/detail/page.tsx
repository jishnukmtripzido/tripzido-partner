"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { getVendorPayoutDetailApi } from "@/services/payment.service";
import { PAYOUT_STATUS_STYLES } from "@/lib/payoutStatus";
import { PageLoader } from "@/components/ui/PageLoader";
import { queryKeys } from "@/lib/queryKeys";
import {
  formatAmount,
  formatShortDate,
} from "@/components/features/ledger/LedgerListItem";

// ── Icons — reusing the same vocabulary established elsewhere in this
// portal (Booking Detail, Listing Detail). ─────────────────────────────

const HASH_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
  />
);
const CLOCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);
const CALENDAR_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
  />
);
const BANK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"
  />
);
const VEHICLE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6"
  />
);

function formatPayoutDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatShortDate(iso)}, ${d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

// Date-only display (no time component) for plain "YYYY-MM-DD"
// values like period_start/period_end and pickup_date/dropoff_date.
// Built from the string parts rather than `new Date(str)`, which would
// parse it as UTC midnight and can show the previous day locally.
function formatDateOnly(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "account_holder_name" → "Account Holder Name".
function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace(/\bIfsc\b/, "IFSC")
    .replace(/\bUpi\b/, "UPI");
}

export default function LedgerDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const payoutId = searchParams.get("id");
  const [copied, setCopied] = useState(false);

  const {
    data: payout,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.ledger.detail(token, payoutId),
    queryFn: async () => {
      const res = await getVendorPayoutDetailApi(
        payoutId as string,
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Payout not found");
      }
      return res.data;
    },
    enabled: !!token && !!payoutId,
  });

  async function copyUtr(utr: string) {
    try {
      await navigator.clipboard.writeText(utr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (older WebView / permissions) — the UTR is
      // still visible and selectable, so there's nothing else to do.
    }
  }

  const bankEntries = payout?.bank_account_snapshot
    ? Object.entries(payout.bank_account_snapshot)
    : [];

  return (
    <>
      <Header
        title={payout ? `Payout #${payout.id}` : "Payout"}
        onBack={() => router.back()}
      />
      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-8 bg-brand-bg lg:px-8 lg:pt-7">
        {isLoading && <PageLoader />}
        {error && !isLoading && (
          <p className="mx-auto mt-6 max-w-xl rounded-2xl bg-white shadow-sm px-4 py-4 text-center text-sm font-semibold text-red-600">
            {error instanceof Error ? error.message : "Failed to load payout"}
          </p>
        )}

        {payout && !isLoading && (
          <div className="mx-auto max-w-6xl space-y-5 lg:grid lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
            {/* Left column: amount, transfer, bank — stays in view on desktop */}
            <div className="space-y-5 lg:sticky lg:top-0">
              {/* Summary */}
              <section className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="rounded-xl bg-brand-bg px-4 py-5 text-center">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      PAYOUT_STATUS_STYLES[payout.status] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {payout.status_label}
                  </span>
                  <p className="mt-3 font-heading text-4xl font-bold tabular-nums text-font-main-sub">
                    ₹{formatAmount(payout.total_amount)}
                  </p>
                  <p className="mt-1.5 text-xs text-font-dim">
                    {payout.items.length} booking
                    {payout.items.length === 1 ? "" : "s"} ·{" "}
                    {payout.paid_at
                      ? `Paid ${formatShortDate(payout.paid_at)}`
                      : `Created ${formatShortDate(payout.created_at)}`}
                  </p>
                </div>
              </section>

              {/* Transfer */}
              <Section title="Transfer">
                <IconRow
                  icon={HASH_ICON}
                  label="UTR number"
                  hint={payout.utr_number || "Not recorded yet"}
                  trailing={
                    payout.utr_number ? (
                      <button
                        type="button"
                        onClick={() => copyUtr(payout.utr_number)}
                        className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-font-main-sub hover:bg-gray-200 active:bg-gray-200 transition-colors"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    ) : undefined
                  }
                />
                <IconRow
                  icon={CLOCK_ICON}
                  label="Paid on"
                  hint={
                    payout.paid_at
                      ? formatPayoutDateTime(payout.paid_at)
                      : "Pending"
                  }
                />
                {payout.period_start && payout.period_end && (
                  <IconRow
                    icon={CALENDAR_ICON}
                    label="Period"
                    hint={`${formatDateOnly(payout.period_start)} – ${formatDateOnly(
                      payout.period_end,
                    )}`}
                  />
                )}
              </Section>

              {bankEntries.length > 0 && (
                <Section title="Bank account">
                  <div className="flex items-center gap-3 px-1 pb-3 pt-1">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        {BANK_ICON}
                      </svg>
                    </span>
                    <p className="text-xs text-font-dim">
                      Account this payout was sent to
                    </p>
                  </div>
                  <div className="space-y-2.5 rounded-xl bg-brand-bg p-3">
                    {bankEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="shrink-0 text-font-dim">
                          {toTitleCase(key)}
                        </span>
                        <span className="break-all text-right font-semibold text-font-main-sub">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {payout.note && (
                <Section title="Note">
                  <p className="px-1 py-1 text-sm leading-relaxed text-font-main-sub">
                    {payout.note}
                  </p>
                </Section>
              )}
            </div>

            {/* Bookings covered */}
            <Section title={`Bookings covered · ${payout.items.length}`}>
              {payout.items.length === 0 ? (
                <p className="px-1 py-2 text-sm text-font-dim">
                  No bookings attached yet.
                </p>
              ) : (
                <div className="-my-1 divide-y divide-gray-100">
                  {payout.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/bookings/detail?id=${item.booking_id}` as Route,
                        )
                      }
                      className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-gray-50 active:bg-gray-50 transition-colors"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          {VEHICLE_ICON}
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-font-main-sub">
                          {item.vehicle_name}
                        </span>
                        <span className="block truncate text-xs text-font-dim">
                          #{item.booking_reference} ·{" "}
                          {formatDateOnly(item.pickup_date)} –{" "}
                          {formatDateOnly(item.dropoff_date)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-brand-yellow/30 px-2 py-0.5 text-sm font-bold tabular-nums text-brand-secondary">
                        ₹{formatAmount(item.amount)}
                      </span>
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-400"
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
                    </button>
                  ))}
                  <div className="flex items-center justify-between px-1 pt-3 pb-1">
                    <span className="text-sm font-semibold text-font-main-sub">
                      Total
                    </span>
                    <span className="font-heading text-base font-bold tabular-nums text-font-main-sub">
                      ₹{formatAmount(payout.total_amount)}
                    </span>
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}
      </main>
    </>
  );
}

/** Sidebar-style section: small uppercase title above a white card. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
        {title}
      </h2>
      <div className="rounded-2xl bg-white p-3 shadow-sm">{children}</div>
    </section>
  );
}

function IconRow({
  icon,
  label,
  hint,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mt-2 flex items-center gap-3 px-1 py-1.5 first:mt-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-font-dim">{label}</span>
        {hint && (
          <span className="block break-all text-sm font-semibold text-font-main-sub">
            {hint}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </div>
  );
}
