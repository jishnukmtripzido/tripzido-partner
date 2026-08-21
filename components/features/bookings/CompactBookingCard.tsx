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

export function CompactBookingCard({
  booking,
  onClick,
  variant = "full",
}: CompactBookingCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-[#FFD166] hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-sm text-gray-900 truncate">
            {booking.vehicle_name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {booking.customer_name}
            {variant === "full" && ` • ${booking.customer_phone}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
              STATUS_BADGE_STYLES[booking.status] ??
              "bg-[#F0F4FF] text-[#4A72FF]"
            }`}
          >
            {booking.status_label}
          </span>
          {booking.is_offline && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200">
              Offline
            </span>
          )}
        </div>
      </div>

      {variant === "full" && (
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
          Ref: {booking.booking_reference} • {booking.location_name}
        </p>
      )}
    </button>
  );
}
