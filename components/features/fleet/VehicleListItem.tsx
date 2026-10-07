"use client";

import { useState } from "react";
import type { Vehicle } from "@/types/fleet.types";
import {
  LISTING_STATUS_STYLES,
  LISTING_STATUS_LABELS,
} from "@/lib/listingStatus";

const MOTORCYCLE_ICON = (
  <>
    <path d="M19.5 13.5A3.5 3.5 0 1 0 23 17a3.5 3.5 0 0 0-3.5-3.5ZM19.5 19A2 2 0 1 1 21.5 17 2 2 0 0 1 19.5 19ZM4.5 13.5A3.5 3.5 0 1 0 8 17a3.5 3.5 0 0 0-3.5-3.5ZM4.5 19A2 2 0 1 1 6.5 17 2 2 0 0 1 4.5 19Z" />
    <path d="M15.5 8H13V6a1 1 0 0 0-2 0v2H8.5a.5.5 0 0 0-.5.5v1.944A4.52 4.52 0 0 0 9.873 14H14.5a.5.5 0 0 0 .5-.5V10.5A2.5 2.5 0 0 1 17.5 13H19a1 1 0 0 0 0-2h-1.5a.5.5 0 0 0-.5.5.5.5 0 0 0-.5.5v1H14.5v-2H16v-2h-.5z" />
  </>
);

const SCOOTER_ICON = (
  <path d="M18 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-12-6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7.62-10h3.58l-1.39-3h-2.19l-3.3 5h3.04l.26-.5zm-6.02-3.12l-1.9 2.12h3.29l1.83-2.62-3.22.5zM11.66 12H6.94l.89-1h3.36l.47 1z" />
);

// One-line explanation shown in the footer for listings that can't be
// toggled, so the partner knows why and what happens next.
const STATUS_HINTS: Record<string, string> = {
  PENDING: "Waiting for Tripzido approval",
  SUSPENDED: "Suspended — contact support",
  REJECTED: "Rejected — open to see details",
};

interface ToggleResult {
  success: boolean;
  message?: string;
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  onClick?: () => void;
  /** Omit to show the Live/Paused switch read-only (e.g. suspended vendor). */
  onToggleActive?: (vehicleId: string) => Promise<ToggleResult>;
}

/**
 * Fleet-list card. Visual language follows the Sidebar and
 * BookingListCard: white rounded-2xl card, gray-100 tiles, a tinted
 * info panel and brand-yellow accents.
 *
 * The whole card opens the listing; the Live/Paused switch is its own
 * tap target and doesn't bubble up to the card.
 */
export function VehicleListItem({
  vehicle,
  onClick,
  onToggleActive,
}: VehicleListItemProps) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const statusStyle = vehicle.status
    ? (LISTING_STATUS_STYLES[vehicle.status] ?? "bg-gray-100 text-gray-600")
    : null;
  const statusLabel = vehicle.status
    ? (LISTING_STATUS_LABELS[vehicle.status] ?? vehicle.status)
    : null;

  const isToggleable =
    vehicle.status === "APPROVED" || vehicle.status === "PAUSED";
  const isActive = vehicle.status === "APPROVED";

  const kindLabel = vehicle.kind === "scooter" ? "Scooter" : "Motorcycle";
  const subtitle = vehicle.brand ? `${vehicle.brand} · ${kindLabel}` : kindLabel;

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onToggleActive || toggling) return;
    setToggling(true);
    setToggleError(null);
    const res = await onToggleActive(vehicle.id);
    if (!res.success) setToggleError(res.message || "Failed to update");
    setToggling(false);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Open listing ${vehicle.name}`}
      className="bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg"
    >
      {/* Vehicle + status */}
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 p-1.5">
          {vehicle.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.imageUrl}
              alt=""
              className="h-full w-full object-contain mix-blend-multiply"
            />
          ) : (
            <svg
              className="h-7 w-7 text-font-dim"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
            {vehicle.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-font-dim">{subtitle}</p>
        </div>

        {/* Live/Paused is already shown by the footer switch, so the
            badge only appears for states the switch can't express. */}
        {statusLabel && !isToggleable && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyle}`}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {/* Location + units */}
      <div className="mt-3 rounded-xl bg-brand-bg p-3 space-y-2">
        <p className="flex items-center gap-2 text-xs text-font-dim">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">
            {vehicle.locationName ? (
              <>
                <span className="font-semibold text-font-main-sub">
                  {vehicle.locationName}
                </span>
                {vehicle.pickupPointLabel && ` · ${vehicle.pickupPointLabel}`}
              </>
            ) : (
              "No pickup location set"
            )}
          </span>
        </p>
        <p className="flex items-center gap-2 text-xs text-font-dim">
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <span>
            <span className="font-semibold text-font-main-sub">
              {vehicle.quantity}
            </span>{" "}
            unit{vehicle.quantity === 1 ? "" : "s"} in fleet
          </span>
        </p>
      </div>

      {/* Footer: live switch, or why it can't be toggled */}
      <div className="mt-3 flex items-center gap-3 px-0.5">
        {isToggleable ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-font-main-sub">
                {isActive ? "Live" : "Paused"}
              </p>
              <p className="truncate text-xs text-font-dim">
                {isActive
                  ? "Customers can book this bike"
                  : "Hidden from customers"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={isActive ? "Pause listing" : "Activate listing"}
              onClick={handleToggle}
              onKeyDown={(e) => e.stopPropagation()}
              disabled={toggling || !onToggleActive}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary ${
                isActive ? "bg-brand-yellow-lg" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  isActive ? "translate-x-[26px]" : "translate-x-1"
                }`}
              />
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 flex-1 truncate text-xs text-font-dim">
              {(vehicle.status && STATUS_HINTS[vehicle.status]) ??
                "Open to view details"}
            </p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
              <svg
                className="h-4 w-4"
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
            </span>
          </>
        )}
      </div>

      {toggleError && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {toggleError}
        </p>
      )}
    </article>
  );
}
