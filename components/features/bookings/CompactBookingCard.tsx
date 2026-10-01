"use client";

import type { VendorBookingListItem } from "@/types/booking.types";
import { STATUS_BADGE_STYLES } from "@/lib/bookingStatus";

interface CompactBookingCardProps {
  booking: VendorBookingListItem;
  onClick: () => void;
  /**
   * "compact" — Dashboard: vehicle + customer + status only.
   * "full" — Bookings list: adds booking reference, phone, and
   * pickup location on top of the compact fields.
   */
  variant?: "compact" | "full";
}

function formatBookingDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function CompactBookingCard({
  booking,
  onClick,
  variant = "full",
}: CompactBookingCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        aria-label={`View booking ${booking.booking_reference}: ${booking.vehicle_name}`}
        className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-yellow-lg"
      >
        {booking.vehicle_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={booking.vehicle_image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-contain p-1"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-sm font-extrabold text-gray-900">
                {booking.vehicle_name}
              </h3>
              <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
                {booking.customer_name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  STATUS_BADGE_STYLES[booking.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {booking.status_label}
              </span>
              {booking.is_offline && (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-500">
                  Offline
                </span>
              )}
            </div>
          </div>
          {variant === "full" && (
            <p className="mt-1 truncate text-[11px] font-medium text-gray-500">
              #{booking.booking_reference} <span aria-hidden="true">·</span>{" "}
              {booking.location_name}
            </p>
          )}
        </div>
      </button>

      {variant === "full" && (
        <>
          <div className="grid grid-cols-2 gap-2 px-4 pb-3">
            <div className="min-w-0 rounded-lg bg-[#f7f7f4] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-gray-500">
                Pickup
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-gray-800">
                {formatBookingDateTime(booking.start_date)}
              </p>
            </div>
            <div className="min-w-0 rounded-lg bg-[#f7f7f4] px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-gray-500">
                Return
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-gray-800">
                {formatBookingDateTime(booking.end_date)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
            <a
              href={`tel:${booking.customer_phone}`}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Call ${booking.customer_name}`}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-amber-50 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg"
            >
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.9.95a11 11 0 005.2 5.2l.95-1.9a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.27 21 3 14.73 3 7V5z"
                />
              </svg>
              {booking.customer_phone}
            </a>
            <p className="shrink-0 text-xs font-semibold text-gray-500">
              Rent{" "}
              <span className="ml-1 text-sm font-extrabold tabular-nums text-gray-900">
                ₹{booking.listing_amount}
              </span>
            </p>
          </div>
        </>
      )}
    </article>
  );
}
