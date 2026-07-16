"use client";

import type { LedgerEntry } from "@/types/ledger.types";

const STATUS_STYLES = {
  success: { badge: "bg-green-100 text-brand-green", dot: "bg-green-50 text-brand-green", amount: "text-brand-green" },
  pending: { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-50 text-yellow-600", amount: "text-yellow-700" },
  failed: { badge: "bg-red-100 text-red-600", dot: "bg-red-50 text-red-500", amount: "text-red-600" },
} as const;

interface LedgerListItemProps {
  entry: LedgerEntry;
  highlighted?: boolean;
}

export function LedgerListItem({ entry, highlighted = false }: LedgerListItemProps) {
  const styles = STATUS_STYLES[entry.status];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4 relative overflow-hidden">
      {highlighted && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-yellow" />
      )}

      <div className="flex justify-between items-center border-b border-gray-50 pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.dot}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-heading font-bold text-sm text-font-main-sub">{entry.title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${styles.badge}`}>
          {entry.status}
        </span>
      </div>

      <div>
        <p className="text-xs text-font-dim font-medium mb-1">Amount</p>
        <p className={`font-heading font-extrabold text-2xl ${styles.amount}`}>
          ₹{entry.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="flex justify-between">
          <span className="text-font-dim">Initiated</span>
          <span className="font-semibold text-font-main-sub">{entry.initiatedLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-font-dim">Updated</span>
          <span className="font-semibold text-font-main-sub">{entry.updatedLabel}</span>
        </div>
        <div className="flex justify-between pt-1 mt-1 border-t border-gray-200/50">
          <span className="text-font-dim">UTR</span>
          <span className="font-mono font-bold text-gray-600">{entry.utr}</span>
        </div>
      </div>
    </div>
  );
}
