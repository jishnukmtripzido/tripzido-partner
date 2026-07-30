"use client";

import type { VendorPayout } from "@/types/ledger.types";
import { PAYOUT_STATUS_STYLES } from "@/lib/payoutStatus";

interface LedgerListItemProps {
  entry: VendorPayout;
  onClick: () => void;
}

export function LedgerListItem({ entry, onClick }: LedgerListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-brand-yellow transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-yellow/15 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-brand-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span className="font-heading font-bold text-sm text-font-main-sub">
            Payout #{entry.id}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            PAYOUT_STATUS_STYLES[entry.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {entry.status_label}
        </span>
      </div>

      <p className="text-2xl font-heading font-extrabold text-font-main-sub mb-3">
        ₹
        {Number(entry.total_amount).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </p>

      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-font-dim">Bookings covered</span>
          <span className="font-semibold text-font-main-sub">
            {entry.items_count}
          </span>
        </div>
        {entry.paid_at && (
          <div className="flex justify-between">
            <span className="text-font-dim">Paid on</span>
            <span className="font-semibold text-font-main-sub">
              {new Date(entry.paid_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {entry.utr_number && (
          <div className="flex justify-between">
            <span className="text-font-dim">UTR</span>
            <span className="font-semibold text-font-main-sub">
              {entry.utr_number}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
