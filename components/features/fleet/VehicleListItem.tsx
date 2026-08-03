"use client";

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

const LOCATION_ICON = (
  <>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </>
);

interface VehicleListItemProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export function VehicleListItem({ vehicle, onClick }: VehicleListItemProps) {
  const statusStyle = vehicle.status
    ? (LISTING_STATUS_STYLES[vehicle.status] ?? "bg-gray-100 text-gray-600")
    : null;
  const statusLabel = vehicle.status
    ? (LISTING_STATUS_LABELS[vehicle.status] ?? vehicle.status)
    : null;

  const inStock = vehicle.quantity > 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-brand-yellow hover:shadow-md transition-all group text-left"
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {vehicle.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.imageUrl}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-7 h-7 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {vehicle.kind === "scooter" ? SCOOTER_ICON : MOTORCYCLE_ICON}
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-bold text-font-main-sub text-base leading-tight truncate">
              {vehicle.name}
            </h3>
            {statusLabel && (
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle}`}
              >
                {statusLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                inStock
                  ? "bg-brand-yellow/15 text-brand-secondary"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {vehicle.quantity} {vehicle.quantity === 1 ? "unit" : "units"}
            </span>
          </div>

          {vehicle.locationName && (
            <p className="text-xs text-font-dim font-medium mt-1.5 flex items-center gap-1 truncate">
              <svg
                className="w-3 h-3 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {LOCATION_ICON}
              </svg>
              <span className="truncate">
                {vehicle.locationName}
                {vehicle.pickupPointLabel && (
                  <span className="text-gray-400">
                    {" "}
                    • {vehicle.pickupPointLabel}
                  </span>
                )}
              </span>
            </p>
          )}
        </div>

        <svg
          className="w-5 h-5 text-gray-300 group-hover:text-brand-yellow transition-colors shrink-0 mt-1"
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
      </div>
    </button>
  );
}
