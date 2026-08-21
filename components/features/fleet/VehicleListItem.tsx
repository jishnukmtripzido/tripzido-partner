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

interface ToggleResult {
  success: boolean;
  message?: string;
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  onClick?: () => void;
  onToggleActive?: (vehicleId: string) => Promise<ToggleResult>;
}

export function VehicleListItem({
  vehicle,
  onClick,
  onToggleActive,
}: VehicleListItemProps) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const statusStyle = vehicle.status
    ? (LISTING_STATUS_STYLES[vehicle.status] ?? "bg-[#F0F4FF] text-[#4A72FF]")
    : null;
  const statusLabel = vehicle.status
    ? (LISTING_STATUS_LABELS[vehicle.status] ?? vehicle.status)
    : null;

  const isToggleable =
    vehicle.status === "APPROVED" || vehicle.status === "PAUSED";
  const isActive = vehicle.status === "APPROVED";

  const metaLine = [vehicle.locationName, vehicle.pickupPointLabel]
    .filter(Boolean)
    .join(" • ");

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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-[#D4A33B] hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D4A33B]"
    >
      {/* Image */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-1.5 border border-gray-100/50">
        {vehicle.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            className="h-full w-full object-contain mix-blend-multiply"
          />
        ) : (
          <svg
            className="h-7 w-7 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
          </svg>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-sm font-bold text-gray-900 truncate">
          {vehicle.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {metaLine || "No location set"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {vehicle.quantity} unit{vehicle.quantity === 1 ? "" : "s"}
        </p>
      </div>

      {/* Status (top) + toggle/affordance (bottom), one column */}
      <div className="flex flex-col items-end gap-4 shrink-0">
        {statusLabel && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${statusStyle}`}
          >
            {statusLabel}
          </span>
        )}

        {isToggleable ? (
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label={isActive ? "Pause listing" : "Activate listing"}
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#D4A33B] focus:ring-offset-2 ${
              isActive ? "bg-[#D4A33B]" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                isActive ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        ) : (
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
        {toggleError && (
          <span className="text-[10px] text-red-500 max-w-[90px] text-right leading-tight">
            {toggleError}
          </span>
        )}
      </div>
    </div>
  );
}
