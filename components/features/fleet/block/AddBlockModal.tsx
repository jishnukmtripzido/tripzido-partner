"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getFleetOptionsApi,
  type FleetListing,
} from "@/services/fleet.service";
import { createBlockApi } from "@/services/block.service";
import type { VendorBlockedPeriod } from "@/types/block.types";
import { useDismissTransition } from "@/hooks/useDismissTransition";

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

  const [listings, setListings] = useState<FleetListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  const [listingId, setListingId] = useState<number | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [count, setCount] = useState(1);
  const [reason, setReason] = useState("OTHER");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setListingsLoading(true);
      try {
        const res = await getFleetOptionsApi(token);
        if (!cancelled) setListings(res.data?.results ?? []);
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedListing = listings.find((l) => l.id === listingId);
  const maxCount = selectedListing?.quantity ?? 1;

  async function handleSubmit() {
    if (!token || !listingId || !start || !end) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createBlockApi(
        {
          listing_id: listingId,
          start_datetime: start,
          end_datetime: end,
          count,
          reason,
          note,
        },
        token,
      );
      if (!res.success || !res.data) {
        setError(res.message || "Failed to create block");
        return;
      }
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create block");
    } finally {
      setSubmitting(false);
    }
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
        <h3 className="font-heading font-bold text-base text-font-main-sub mb-4">
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
            disabled={submitting || !listingId || !start || !end}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-brand-yellow text-brand-secondary hover:bg-brand-yellow-lg disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create block"}
          </button>
        </div>
      </div>
    </div>
  );
}
