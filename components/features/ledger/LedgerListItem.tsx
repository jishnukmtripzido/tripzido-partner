"use client";

import type { VendorPayout } from "@/types/ledger.types";
import { PAYOUT_STATUS_STYLES } from "@/lib/payoutStatus";

interface LedgerListItemProps {
  entry: VendorPayout;
  onClick: () => void;
}

// Icon tile colour follows the payout's state, so paid / pending /
// failed read at a glance down the list.
const TILE_STYLES: Record<VendorPayout["status"], string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-brand-yellow-lg text-brand-secondary",
  FAILED: "bg-red-100 text-red-700",
};

export function formatAmount(value: string): string {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Ledger row card. Visual language follows the Sidebar and the other
 * list cards: white rounded-2xl card, 44px icon tile, bold primary
 * line with a one-line hint underneath.
 */
export function LedgerListItem({ entry, onClick }: LedgerListItemProps) {
  const hint = [
    `${entry.items_count} booking${entry.items_count === 1 ? "" : "s"}`,
    entry.paid_at
      ? `Paid ${formatShortDate(entry.paid_at)}`
      : `Created ${formatShortDate(entry.created_at)}`,
  ].join(" · ");

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            TILE_STYLES[entry.status] ?? "bg-gray-100 text-font-dim"
          }`}
        >
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
              d="M3 10h18M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
            />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-bold text-font-main-sub">
            Payout #{entry.id}
          </p>
          <p className="truncate text-xs text-font-dim">{hint}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="font-heading text-base font-bold tabular-nums text-font-main-sub">
            ₹{formatAmount(entry.total_amount)}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              PAYOUT_STATUS_STYLES[entry.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {entry.status_label}
          </span>
        </div>
      </div>

      {entry.utr_number && (
        <p className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-brand-bg px-3 py-2 text-xs">
          <span className="text-font-dim">UTR</span>
          <span className="truncate font-semibold tabular-nums text-font-main-sub">
            {entry.utr_number}
          </span>
        </p>
      )}
    </button>
  );
}
