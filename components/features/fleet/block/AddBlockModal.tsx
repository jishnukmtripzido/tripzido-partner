"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getFleetOptionsApi } from "@/services/fleet.service";
import { createBlockApi } from "@/services/block.service";
import type { VendorBlockedPeriod } from "@/types/block.types";
import { useDismissTransition } from "@/hooks/useDismissTransition";
import { queryKeys } from "@/lib/queryKeys";
import { SwitchRow } from "@/components/features/fleet/block/BlockListItem";
import { SearchPickerSheet } from "@/components/ui/SearchPickerSheet";

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

  // Listing picker sheet — the fleet options are already fully loaded
  // (page_size=100), so search filters that list client-side instead of
  // re-hitting the network per keystroke.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItems, setPickerItems] = useState<typeof listings>([]);

  function openPicker() {
    if (listingsLoading) return;
    setPickerItems(listings);
    setPickerOpen(true);
  }

  function filterListings(query: string) {
    const q = query.trim().toLowerCase();
    setPickerItems(
      q
        ? listings.filter((l) =>
            [l.name, l.brand, l.location_name, l.pickup_point_label]
              .filter(Boolean)
              .some((field) => field!.toLowerCase().includes(q)),
          )
        : listings,
    );
  }

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
        className={`modal-panel modal-panel-${phase} relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </span>
          <div>
            <h3 className="font-heading font-bold text-base text-font-main-sub">
              Block bikes
            </h3>
            <p className="text-xs text-font-dim">
              Blocked bikes can&apos;t be booked by customers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
              Vehicle
            </label>
            <button
              type="button"
              onClick={openPicker}
              disabled={listingsLoading}
              className={`w-full flex items-center gap-3 rounded-2xl p-2.5 text-left transition-colors disabled:opacity-60 ${
                selectedListing
                  ? "bg-brand-yellow/20"
                  : "bg-brand-bg hover:bg-gray-100 active:bg-gray-100"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-font-dim">
                {selectedListing?.primary_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedListing.primary_image}
                    alt=""
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
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
                      d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-6l2-5h9l4 5h1a2 2 0 012 2v4h-2M9 17h6"
                    />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${
                    selectedListing
                      ? "font-semibold text-font-main-sub"
                      : "text-font-dim"
                  }`}
                >
                  {listingsLoading
                    ? "Loading your fleet..."
                    : (selectedListing?.name ?? "Select a listing")}
                </span>
                {selectedListing && (
                  <span className="block truncate text-xs text-font-dim">
                    {[
                      selectedListing.location_name,
                      selectedListing.pickup_point_label,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
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
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              min={nowLocalInputValue()}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
            />
          </div>

          <SwitchRow
            label="Until further notice"
            hint="No end date — close it when the bike is back"
            checked={isIndefinite}
            onChange={(checked) => {
              setIsIndefinite(checked);
              if (checked) setEnd("");
            }}
          />

          <div>
            {!isIndefinite && (
              <>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={end}
                  min={start || nowLocalInputValue()}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
                />
              </>
            )}
          </div>

          {selectedListing && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-bg px-3.5 py-3">
              <div>
                <p className="text-sm font-semibold text-font-main-sub">
                  Bikes to block
                </p>
                <p className="text-xs text-font-dim">
                  Up to {maxCount} in this fleet
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  aria-label="Block one fewer bike"
                  className="w-9 h-9 rounded-xl bg-white shadow-sm text-base font-bold text-font-main-sub hover:bg-gray-100 active:bg-gray-100"
                >
                  −
                </button>
                <span className="w-7 text-center text-base font-bold tabular-nums">
                  {count}
                </span>
                <button
                  onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
                  aria-label="Block one more bike"
                  className="w-9 h-9 rounded-xl bg-brand-yellow-lg text-brand-secondary text-base font-bold hover:bg-brand-yellow active:bg-brand-yellow"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors"
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={dismiss}
            disabled={submitting}
            className="flex-1 rounded-xl bg-gray-100 py-3.5 text-sm font-semibold text-font-main-sub hover:bg-gray-200 active:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting || !listingId || !start || (!isIndefinite && !end)
            }
            className="flex-1 rounded-xl py-3.5 text-sm font-semibold bg-brand-secondary text-brand-yellow hover:opacity-90 active:opacity-80 transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create block"}
          </button>
        </div>
      </div>

      {/* Rendered outside the animated panel: its transform would
          otherwise trap this fixed-position sheet inside the panel. */}
      {pickerOpen && (
        <SearchPickerSheet
          title="Select a listing"
          placeholder="Search by bike, brand or location..."
          items={pickerItems}
          loading={false}
          getKey={(l) => l.id}
          renderItem={(l) => (
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                {l.primary_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.primary_image}
                    alt=""
                    className="h-full w-full object-contain p-0.5 mix-blend-multiply"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-font-main-sub">
                  {l.name}
                </span>
                <span className="block truncate text-xs text-font-dim">
                  {[l.location_name, l.pickup_point_label]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  · {l.quantity} unit{l.quantity === 1 ? "" : "s"}
                </span>
              </span>
            </span>
          )}
          onQueryChange={filterListings}
          onSelect={(l) => {
            setListingId(l.id);
            setCount(1);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
          selectedKey={listingId}
          showAllByDefault
          emptyLabel="No listings match your search."
        />
      )}
    </div>
  );
}
