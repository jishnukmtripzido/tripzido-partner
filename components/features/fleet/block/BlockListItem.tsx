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

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalInputValue(): string {
  return toLocalInputValue(new Date().toISOString());
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

  const now = new Date();
  // Indefinite blocks (end_datetime === null) are "active" as soon as
  // start has passed — there's no end boundary to compare against.
  const isActive =
    new Date(block.start_datetime) <= now &&
    (block.end_datetime === null || now <= new Date(block.end_datetime));

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
      <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-brand-yellow">
        <div className="text-xs text-gray-400 font-medium mb-3 border-b border-gray-50 pb-2">
          Editing Block #{block.id}
        </div>
        <h3 className="font-heading font-bold text-font-main-sub text-base mb-3">
          {block.vehicle_name}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Start
            </label>
            <input
              type="datetime-local"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={draftIndefinite}
                onChange={(e) => {
                  setDraftIndefinite(e.target.checked);
                  if (e.target.checked) setDraftEnd("");
                }}
              />
              Block until further notice (no end date)
            </label>

            {!draftIndefinite && (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={draftEnd}
                  min={nowLocalInputValue()}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600">
              Bikes blocked{" "}
              <span className="font-normal text-gray-400">
                (max {block.listing_available_count})
              </span>
            </label>
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
          <p className="text-xs text-red-500 font-medium mt-3">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setIsEditing(false)}
            disabled={submitting}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-bold text-font-dim disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex-1 bg-brand-yellow text-brand-secondary rounded-lg py-2 text-sm font-bold hover:bg-brand-yellow-lg disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
          <span className="text-xs text-gray-400 font-medium">
            Block ID #{block.id}
          </span>
          <div className="flex items-center gap-3">
            {block.is_indefinite && isActive && (
              <button
                onClick={handleCloseNow}
                disabled={closing}
                className="text-xs font-bold text-green-600 disabled:opacity-50"
              >
                {closing ? "Closing..." : "Close now"}
              </button>
            )}
            <button
              onClick={startEditing}
              className="text-xs font-bold text-brand-yellow-lg"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              className="text-xs font-bold text-red-500"
            >
              Delete
            </button>
          </div>
        </div>

        {closeError && (
          <p className="text-xs text-red-500 font-medium mb-2">{closeError}</p>
        )}

        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-heading font-bold text-font-main-sub text-base mb-1 leading-tight pr-2">
              {block.vehicle_name}
            </h3>
            <p className="text-xs text-font-dim mb-2">{block.location_name}</p>
            <div className="space-y-1.5 text-xs">
              <p className="text-font-dim">
                <span className="font-semibold text-gray-700">Start:</span>{" "}
                {new Date(block.start_datetime).toLocaleString()}
              </p>
              <p className="text-font-dim">
                <span className="font-semibold text-gray-700">End:</span>{" "}
                {block.end_datetime
                  ? new Date(block.end_datetime).toLocaleString()
                  : "Until further notice"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="font-bold text-sm text-font-main-sub bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
              {block.count}
            </span>
            <span className="text-[10px] text-gray-400 font-medium mr-1">
              (Fleet size: {block.listing_available_count})
            </span>
          </div>
        </div>
      </div>

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
