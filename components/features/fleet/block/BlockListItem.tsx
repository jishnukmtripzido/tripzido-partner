"use client";

import { useState } from "react";
import type {
  VendorBlockedPeriod,
  BlockUpdatePayload,
} from "@/types/block.types";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BlockListItemProps {
  block: VendorBlockedPeriod;
  onSave: (
    blockId: number,
    patch: BlockUpdatePayload,
  ) => Promise<{ success: boolean; message?: string }>;
  onDelete: (
    blockId: number,
  ) => Promise<{ success: boolean; message?: string }>;
}

export type BlockPhase = "active" | "upcoming" | "ended";

// Indefinite blocks (end_datetime === null) are "active" as soon as
// start has passed — there's no end boundary to compare against.
export function getBlockPhase(
  block: VendorBlockedPeriod,
  now: Date = new Date(),
): BlockPhase {
  if (new Date(block.start_datetime) > now) return "upcoming";
  if (block.end_datetime !== null && new Date(block.end_datetime) < now)
    return "ended";
  return "active";
}

const PHASE_BADGE: Record<BlockPhase, { label: string; className: string }> = {
  active: { label: "Blocked now", className: "bg-red-100 text-red-700" },
  upcoming: { label: "Upcoming", className: "bg-yellow-100 text-yellow-700" },
  ended: { label: "Ended", className: "bg-gray-100 text-gray-600" },
};

const INPUT_CLASS =
  "w-full bg-brand-bg border-2 border-transparent rounded-xl px-3.5 py-3 text-sm font-semibold text-font-main-sub focus:outline-none focus:border-brand-yellow focus:bg-white transition-colors";

const BLOCK_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
  />
);

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalInputValue(): string {
  return toLocalInputValue(new Date().toISOString());
}

// Display-only formatter — day/month/year, distinct from
// toLocalInputValue above which feeds <input type="datetime-local">
// and must stay in that fixed YYYY-MM-DDTHH:mm shape regardless of
// display preference. Split into date and time so the period panel
// can stack them.
function formatBlockDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatBlockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BlockListItem({ block, onSave, onDelete }: BlockListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [draftIndefinite, setDraftIndefinite] = useState(false);
  const [draftCount, setDraftCount] = useState(block?.count ?? 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  if (!block) {
    console.warn("BlockListItem received an undefined block prop");
    return null;
  }

  const phase = getBlockPhase(block);
  const isActive = phase === "active";
  const badge = PHASE_BADGE[phase];

  function startEditing() {
    setDraftStart(toLocalInputValue(block.start_datetime));
    setDraftIndefinite(block.end_datetime === null);
    setDraftEnd(
      block.end_datetime ? toLocalInputValue(block.end_datetime) : "",
    );
    setDraftCount(block.count);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!draftIndefinite && !draftEnd) {
      setError("Please set an end date, or mark this block as indefinite.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await onSave(block.id, {
        start_datetime: draftStart,
        end_datetime: draftIndefinite ? null : draftEnd,
        count: draftCount,
      });
      if (!res.success) {
        setError(res.message || "Failed to update block");
        return;
      }
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseNow() {
    setClosing(true);
    setCloseError(null);
    try {
      const res = await onSave(block.id, {
        start_datetime: block.start_datetime,
        end_datetime: new Date().toISOString(),
        count: block.count,
      });
      if (!res.success) {
        setCloseError(res.message || "Failed to close block");
      }
    } finally {
      setClosing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await onDelete(block.id);
      if (!res.success) {
        setDeleteError(res.message || "Failed to delete block");
        return;
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl p-3 shadow-sm ring-2 ring-brand-yellow-lg">
        <div className="flex items-center gap-3 px-1 pt-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {BLOCK_ICON}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
              Editing block #{block.id}
            </p>
            <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
              {block.vehicle_name}
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
              Start
            </label>
            <input
              type="datetime-local"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <SwitchRow
            label="Until further notice"
            hint="No end date — close it when the bike is back"
            checked={draftIndefinite}
            onChange={(checked) => {
              setDraftIndefinite(checked);
              if (checked) setDraftEnd("");
            }}
          />

          {!draftIndefinite && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-font-dim/70 mb-1.5 px-1">
                End
              </label>
              <input
                type="datetime-local"
                value={draftEnd}
                min={nowLocalInputValue()}
                onChange={(e) => setDraftEnd(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-bg px-3.5 py-3">
            <div>
              <p className="text-sm font-semibold text-font-main-sub">
                Bikes blocked
              </p>
              <p className="text-xs text-font-dim">
                Up to {block.listing_available_count} in this fleet
              </p>
            </div>
            <QuantityStepper
              value={draftCount}
              min={1}
              max={block.listing_available_count}
              onIncrement={() =>
                setDraftCount((v) =>
                  Math.min(v + 1, block.listing_available_count),
                )
              }
              onDecrement={() => setDraftCount((v) => Math.max(v - 1, 1))}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            disabled={submitting}
            className="rounded-xl bg-gray-100 py-3 text-sm font-semibold text-font-main-sub active:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="rounded-xl bg-brand-secondary py-3 text-sm font-semibold text-brand-yellow active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <article className="bg-white rounded-2xl p-3 shadow-sm">
        {/* Vehicle + phase */}
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-red-50 text-red-600" : "bg-gray-100 text-font-dim"
            }`}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {BLOCK_ICON}
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
              {block.vehicle_name}
            </h3>
            <p className="truncate text-xs text-font-dim">
              {block.location_name}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Period + count */}
        <div className="mt-3 rounded-xl bg-brand-bg p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
                From
              </p>
              <p className="mt-0.5 text-[13px] font-bold text-font-main-sub">
                {formatBlockDate(block.start_datetime)}
              </p>
              <p className="text-xs text-font-dim">
                {formatBlockTime(block.start_datetime)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1 px-1">
              <span className="rounded-xl bg-white px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-font-main-sub shadow-sm">
                {block.count} of {block.listing_available_count}
              </span>
              <svg
                className="h-4 w-4 text-brand-yellow-lg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
                Until
              </p>
              {block.end_datetime ? (
                <>
                  <p className="mt-0.5 text-[13px] font-bold text-font-main-sub">
                    {formatBlockDate(block.end_datetime)}
                  </p>
                  <p className="text-xs text-font-dim">
                    {formatBlockTime(block.end_datetime)}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-[13px] font-bold text-font-main-sub">
                  Further notice
                </p>
              )}
            </div>
          </div>

          {(block.reason_label || block.note) && (
            <p className="mt-2.5 border-t border-black/5 pt-2.5 text-xs text-font-dim">
              {block.reason_label && (
                <span className="font-semibold text-font-main-sub">
                  {block.reason_label}
                </span>
              )}
              {block.reason_label && block.note && " · "}
              {block.note}
            </p>
          )}
        </div>

        {closeError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {closeError}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 px-0.5">
          <span className="mr-auto text-[11px] font-semibold text-font-dim/70">
            #{block.id}
          </span>
          {block.is_indefinite && isActive && (
            <button
              onClick={handleCloseNow}
              disabled={closing}
              className="rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 active:bg-green-100 transition-colors disabled:opacity-50"
            >
              {closing ? "Closing..." : "Close now"}
            </button>
          )}
          <button
            onClick={startEditing}
            className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-font-main-sub active:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteError(null);
              setShowDeleteConfirm(true);
            }}
            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 active:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </article>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this block?"
          message={
            isActive
              ? `This block is currently active — deleting it will immediately make ${block.count} bike(s) available for booking again. This can't be undone.`
              : "This will permanently remove this block. This can't be undone."
          }
          confirmLabel="Delete block"
          destructive
          submitting={deleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

/** Sidebar-style row with a switch, shared with AddBlockModal. */
export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 rounded-xl bg-brand-bg px-3.5 py-3 text-left active:bg-gray-100 transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-font-main-sub">
          {label}
        </span>
        {hint && (
          <span className="block text-xs text-font-dim mt-0.5">{hint}</span>
        )}
      </span>
      <span
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-brand-yellow-lg" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-[26px]" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
