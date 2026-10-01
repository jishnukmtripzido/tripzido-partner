"use client";

import type { VendorBookingListItem } from "@/types/booking.types";
import { STATUS_BADGE_STYLES } from "@/lib/bookingStatus";

interface BookingListCardProps {
  booking: VendorBookingListItem;
  onClick: () => void;
}

// An outstanding balance only matters while the booking is still live;
// on expired/cancelled/completed bookings it would just be noise.
const DUE_RELEVANT_STATUSES = new Set(["PENDING_PAYMENT", "CONFIRMED", "ONGOING"]);

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

/**
 * Bookings-list card. Visual language follows the Sidebar: white
 * rounded-2xl cards, gray-100 icon tiles, small uppercase labels and
 * brand-yellow accents. The Dashboard uses the more compact
 * DashboardBookingRow instead.
 *
 * The whole card opens the booking; the call button is a separate tap
 * target that doesn't bubble up to the card.
 */
export function BookingListCard({ booking, onClick }: BookingListCardProps) {
  const remaining = Number(booking.remaining_amount);
  const hasDue =
    DUE_RELEVANT_STATUSES.has(booking.status) &&
    Number.isFinite(remaining) &&
    remaining > 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View booking ${booking.booking_reference}: ${booking.vehicle_name}`}
      className="bg-white rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow-lg"
    >
      {/* Vehicle + status */}
      <div className="flex items-center gap-3">
        {booking.vehicle_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={booking.vehicle_image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl bg-gray-100 object-contain p-1.5"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-font-dim">
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
          <h3 className="truncate font-heading text-[15px] font-bold text-font-main-sub">
            {booking.vehicle_name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-font-dim">
            #{booking.booking_reference}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              STATUS_BADGE_STYLES[booking.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {booking.status_label}
          </span>
          {booking.is_offline && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase text-font-dim">
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Trip: pickup → return */}
      <div className="mt-3 rounded-xl bg-brand-bg p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-font-dim/70">
              Pickup
            </p>
            <p className="mt-0.5 truncate text-[13px] font-bold text-font-main-sub">
              {formatDate(booking.start_date)}
            </p>
            <p className="truncate text-xs text-font-dim">
              {formatTime(booking.start_date)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-1 px-1">
            {booking.duration && (
              <span className="max-w-24 rounded-xl bg-white px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-font-main-sub shadow-sm">
                {booking.duration}
              </span>
            )}
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
              Return
            </p>
            <p className="mt-0.5 truncate text-[13px] font-bold text-font-main-sub">
              {formatDate(booking.end_date)}
            </p>
            <p className="truncate text-xs text-font-dim">
              {formatTime(booking.end_date)}
            </p>
          </div>
        </div>

        {booking.location_name && (
          <p className="mt-2.5 flex items-center gap-1.5 border-t border-black/5 pt-2.5 text-xs text-font-dim">
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
            <span className="truncate">{booking.location_name}</span>
          </p>
        )}
      </div>

      {/* Customer + amount */}
      <div className="mt-3 flex items-center gap-3 px-0.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-secondary font-heading text-sm font-bold text-brand-yellow">
          {getInitials(booking.customer_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-font-main-sub">
            {booking.customer_name}
          </p>
          <p className="truncate text-xs text-font-dim">
            {hasDue ? (
              <>
                ₹{booking.listing_amount} ·{" "}
                <span className="font-semibold text-amber-600">
                  ₹{booking.remaining_amount} due
                </span>
              </>
            ) : (
              <>
                Rent{" "}
                <span className="font-bold tabular-nums text-font-main-sub">
                  ₹{booking.listing_amount}
                </span>
              </>
            )}
          </p>
        </div>
        {booking.customer_phone && (
          <a
            href={`tel:${booking.customer_phone}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`Call ${booking.customer_name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow-lg text-brand-secondary hover:bg-brand-yellow active:bg-brand-yellow transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
          >
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.9.95a11 11 0 005.2 5.2l.95-1.9a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.27 21 3 14.73 3 7V5z"
              />
            </svg>
          </a>
        )}
      </div>
    </article>
  );
}
