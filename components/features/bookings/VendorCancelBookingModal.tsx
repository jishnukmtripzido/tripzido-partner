"use client";

import { useState } from "react";
import type { VendorCancellationReasonCode } from "@/types/booking.types";

const REASONS: { value: VendorCancellationReasonCode; label: string }[] = [
  { value: "VENDOR_BREAKDOWN", label: "Vehicle Breakdown" },
  { value: "VENDOR_EMERGENCY", label: "Vendor Emergency" },
  { value: "OTHER", label: "Other" },
];

interface VendorCancelBookingModalProps {
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (
    reasonCode: VendorCancellationReasonCode,
    reasonText: string,
  ) => void;
}

export function VendorCancelBookingModal({
  submitting,
  error,
  onCancel,
  onConfirm,
}: VendorCancelBookingModalProps) {
  const [reasonCode, setReasonCode] =
    useState<VendorCancellationReasonCode>("VENDOR_BREAKDOWN");
  const [reasonText, setReasonText] = useState("");

  const isOther = reasonCode === "OTHER";
  const canSubmit = !isOther || reasonText.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="font-heading font-bold text-[16px] text-gray-900 mb-1">
          Cancel this booking?
        </h3>
        <p className="text-[13px] text-gray-500 mb-4">
          The customer will be refunded 100% of what they&apos;ve paid. This
          can&apos;t be undone.
        </p>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer text-[13px] font-medium ${
                reasonCode === r.value
                  ? "border-brand-yellow bg-brand-yellow/10 text-brand-secondary"
                  : "border-gray-100 text-gray-600"
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                className="accent-brand-yellow"
                checked={reasonCode === r.value}
                onChange={() => setReasonCode(r.value)}
              />
              {r.label}
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Tell us what happened…"
            className="w-full text-[13px] border border-gray-200 rounded-xl px-3 py-2.5 mb-4 resize-none"
            rows={3}
          />
        )}

        {error && (
          <p className="text-[12px] text-red-500 font-semibold mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 text-[13px] font-bold py-3 rounded-xl bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={() => onConfirm(reasonCode, reasonText)}
            disabled={submitting || !canSubmit}
            className="flex-1 text-[13px] font-bold py-3 rounded-xl bg-red-50 text-red-600 disabled:opacity-50"
          >
            {submitting ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
