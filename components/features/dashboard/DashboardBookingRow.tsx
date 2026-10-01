"use client";

import type { VendorBookingListItem } from "@/types/booking.types";
import { STATUS_BADGE_STYLES } from "@/lib/bookingStatus";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay(d, today)) return `Today, ${time}`;
  if (sameDay(d, tomorrow)) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * One booking as a sidebar-style row, for the dashboard's grouped
 * lists. `when` picks which time to show: pickup (to hand over) or
 * return (to collect back).
 */
export function DashboardBookingRow({
  booking,
  when = "start",
  showStatus = false,
  onClick,
}: {
  booking: VendorBookingListItem;
  when?: "start" | "end";
  showStatus?: boolean;
  onClick: () => void;
}) {
  const time = formatWhen(when === "end" ? booking.end_date : booking.start_date);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-gray-100 active:bg-gray-100 transition-colors"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
        {booking.vehicle_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={booking.vehicle_image}
            alt=""
            className="h-full w-full object-contain p-1 mix-blend-multiply"
          />
        ) : (
          <svg
            className="h-5 w-5 text-font-dim"
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
        <span className="block truncate text-sm font-semibold text-font-main-sub">
          {booking.vehicle_name}
        </span>
        <span className="block truncate text-xs text-font-dim">
          {booking.customer_name} · {time}
        </span>
      </span>
      {showStatus ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            STATUS_BADGE_STYLES[booking.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {booking.status_label}
        </span>
      ) : (
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
      )}
    </button>
  );
}
