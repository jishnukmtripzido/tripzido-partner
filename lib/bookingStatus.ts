import type { BookingStatus } from "@/types/booking.types";

export const STATUS_BADGE_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

export const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_payment", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

interface StatusActionConfig {
  label: string;
  confirmText: string;
  confirmLabel: string;
  destructive?: boolean;
}

// Mirrors apps.bookings.services.VendorBookingService.ALLOWED_TRANSITIONS
// on the backend — keep these two in sync if that map ever changes.
export const STATUS_ACTION_CONFIG: Record<string, StatusActionConfig> = {
  ONGOING: {
    label: "Start trip",
    confirmText:
      "Mark this booking as Ongoing? This means the vehicle has been handed over to the customer.",
    confirmLabel: "Yes, start trip",
  },
  COMPLETED: {
    label: "Mark returned",
    confirmText:
      "Mark this booking as Completed? This means the vehicle has been returned.",
    confirmLabel: "Yes, mark completed",
  },
  CANCELLED: {
    label: "Cancel booking",
    confirmText: "Cancel this booking? This action cannot be undone here.",
    confirmLabel: "Yes, cancel booking",
    destructive: true,
  },
};
