"use client";

import type {
  VendorBookingListItem,
  BookingStatus,
} from "@/types/booking.types";
import { STATUS_BADGE_STYLES, STATUS_ACTION_CONFIG } from "@/lib/bookingStatus";

const USER_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
  />
);

const PHONE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
  />
);

const STOREFRONT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
  />
);

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
    <div className="group relative flex w-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-[#FFD166] hover:shadow-md mb-4">
      {/* Top Section: Clickable Booking Details */}
      <button
        onClick={onClick}
        className="w-full text-left flex flex-col sm:flex-row items-start gap-4 sm:gap-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166] rounded-xl"
      >
        {/* 1. Image Container */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-50 p-2 transition-transform duration-200 group-hover:scale-105 border border-gray-100/50">
          {booking.vehicle_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.vehicle_image}
              alt={booking.vehicle_name}
              className="h-full w-full object-contain mix-blend-multiply"
            />
          ) : (
            <svg
              className="w-8 h-8 text-gray-300"
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

        {/* 2. Content Container */}
        <div className="flex-1 min-w-0 w-full">
          {/* Header Row: Title, Ref & Status */}
          <div className="flex items-start justify-between gap-2 mb-2 w-full">
            <div className="flex flex-col">
              <h3 className="font-heading text-lg font-bold text-gray-900 leading-tight truncate">
                {booking.vehicle_name}
              </h3>
              <span className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">
                Ref: {booking.booking_reference}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                  STATUS_BADGE_STYLES[booking.status] ??
                  "bg-[#F0F4FF] text-[#4A72FF]"
                }`}
              >
                {booking.status_label}
              </span>
              {booking.is_offline && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[13px] text-gray-600">
            {/* Customer Name */}
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {USER_ICON}
              </svg>
              <span className="font-medium text-gray-900 truncate">
                {booking.customer_name}
              </span>
            </div>

            {/* Customer Phone */}
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {PHONE_ICON}
              </svg>
              <span className="font-medium text-gray-900">
                {booking.customer_phone}
              </span>
            </div>

            {/* Location / Pickup Point */}
            <div className="flex items-center gap-2 sm:col-span-2">
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {STOREFRONT_ICON}
              </svg>
              <span className="truncate">
                Pickup Point:{" "}
                <span className="font-medium text-gray-900">
                  {booking.location_name}
                </span>
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Bottom Section: Action Buttons */}
      {booking.available_next_statuses.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
          {booking.available_next_statuses.map((target) => {
            const config = STATUS_ACTION_CONFIG[target];
            if (!config) return null;

            const isPrimary = target !== "CANCELLED";

            return (
              <button
                key={target}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusAction(target);
                }}
                className={`flex-1 text-[13px] font-bold py-2.5 px-4 rounded-full transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isPrimary
                    ? "bg-[#FFD166] border-[#FFD166] text-[#242A38] hover:bg-[#ffc63b] focus:ring-[#FFD166]"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 focus:ring-gray-200"
                } ${
                  config.destructive
                    ? "hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:ring-red-200"
                    : ""
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
