"use client";

import type {
  VendorBookingListItem,
  BookingStatus,
} from "@/types/booking.types";
import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";

interface BookingListItemProps {
  booking: VendorBookingListItem;
  onClick: () => void;
  onStatusAction: (target: BookingStatus) => void;
}

export function BookingListItem({
  booking,
  onClick,
  onStatusAction,
}: BookingListItemProps) {
  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <button
        onClick={onClick}
        className="w-full text-left flex items-start gap-3"
      >
        <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
          {booking.vehicle_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.vehicle_image}
              alt={booking.vehicle_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-sm text-font-main-sub truncate">
              {booking.vehicle_name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                STATUS_BADGE_STYLES[booking.status] ??
                "bg-gray-100 text-gray-600"
              }`}
            >
              {booking.status_label}
            </span>
          </div>
          <p className="text-xs text-font-dim mt-0.5">
            {booking.customer_name} • {booking.customer_phone}
          </p>
          <p className="text-xs text-font-dim mt-0.5">
            {booking.location_name}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-font-dim">
              #{booking.booking_reference}
            </p>
            {booking.is_offline && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Offline
              </span>
            )}
          </div>
        </div>
      </button>

      {booking.available_next_statuses.length > 0 && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {booking.available_next_statuses.map((target) => {
            const config = STATUS_ACTION_CONFIG[target];
            if (!config) return null;
            return (
              <button
                key={target}
                onClick={() => onStatusAction(target)}
                className={`flex-1 text-xs font-bold py-2 rounded-lg ${
                  config.destructive
                    ? "bg-red-50 text-red-600"
                    : "bg-brand-yellow/15 text-brand-secondary"
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
