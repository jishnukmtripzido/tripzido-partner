"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getFleetOptionsApi } from "@/services/fleet.service";
import { createBlockApi } from "@/services/block.service";
import type { VendorBlockedPeriod } from "@/types/block.types";
import { useDismissTransition } from "@/hooks/useDismissTransition";
import { queryKeys } from "@/lib/queryKeys";

const REASON_OPTIONS = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "PERSONAL_USE", label: "Personal Use" },
  { value: "HOLIDAY", label: "Holiday Closure" },
  { value: "OTHER", label: "Other" },
];

function nowLocalInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AddBlockModalProps {
  onClose: () => void;
  onCreated: (block: VendorBlockedPeriod) => void;
}

export function AddBlockModal({ onClose, onCreated }: AddBlockModalProps) {
  const { token } = useAuth();
  const { phase, dismiss } = useDismissTransition(onClose);

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: queryKeys.fleet.options(token),
    queryFn: async () => {
      const res = await getFleetOptionsApi(token as string);
      return res.data?.results ?? [];
    },
    enabled: !!token,
  });

  const [listingId, setListingId] = useState<number | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [count, setCount] = useState(1);
  const [reason, setReason] = useState("OTHER");
  const [note, setNote] = useState("");

  // Client-side validation error (e.g. missing end date) — kept
  // separate from the mutation's own error so a fixed-and-resubmitted
  // form doesn't show a stale API error alongside it.
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await createBlockApi(
        {
          listing_id: listingId as number,
          start_datetime: start,
          end_datetime: isIndefinite ? null : end,
          count,
          reason,
          note,
        },
        token as string,
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to create block");
      }
      return res.data;
    },
    onSuccess: (block) => {
      // The parent list (fleet/block/page.tsx) owns the blocks query
      // cache and merges the new block in via setQueryData — this just
      // hands the created block back, same data flow as before.
      onCreated(block);
    },
  });

  const selectedListing = listings.find((l) => l.id === listingId);
  const maxCount = selectedListing?.quantity ?? 1;

  const submitting = createMutation.isPending;
  const error =
    formError ??
    (createMutation.error instanceof Error
      ? createMutation.error.message
      : null);

  function handleSubmit() {
    if (!token || !listingId || !start) return;
    if (!isIndefinite && !end) {
      setFormError("Please set an end date, or mark this block as indefinite.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        onClick={dismiss}
        className={`modal-backdrop modal-backdrop-${phase} absolute inset-0 bg-black/50`}
        aria-hidden="true"
      />
      <div
        className={`modal-panel modal-panel-${phase} relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 pb-safe max-h-[90vh] overflow-y-auto`}
      >
        <h3 className=" font-bold text-base text-font-main-sub mb-4">
          Block bikes
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Vehicle
            </label>
            {listingsLoading ? (
              <p className="text-xs text-font-dim">Loading your fleet...</p>
            ) : (
              <select
                value={listingId ?? ""}
                onChange={(e) => {
                  setListingId(Number(e.target.value) || null);
                  setCount(1);
                }}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                <option value="">Select a listing</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.location_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              min={nowLocalInputValue()}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={isIndefinite}
                onChange={(e) => {
                  setIsIndefinite(e.target.checked);
                  if (e.target.checked) setEnd("");
                }}
              />
              Block until further notice (no end date)
            </label>

            {!isIndefinite && (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={end}
                  min={start || nowLocalInputValue()}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </>
            )}
          </div>

          {selectedListing && (
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">
                Bikes to block{" "}
                <span className="font-normal text-gray-400">
                  (max {maxCount})
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="w-7 h-7 rounded bg-gray-50 border border-gray-200 text-sm font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold">
                  {count}
                </span>
                <button
                  onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
                  className="w-7 h-7 rounded bg-brand-yellow text-brand-secondary text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={dismiss}
            disabled={submitting}
            className="flex-1 border-2 border-gray-200 rounded-xl py-3 text-sm font-bold text-font-dim disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting || !listingId || !start || (!isIndefinite && !end)
            }
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create block"}
          </button>
        </div>
      </div>
    </div>
  );
}
