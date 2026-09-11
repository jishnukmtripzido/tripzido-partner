import { api } from "@/lib/api";
import type {
  VendorBookingsResponse,
  VendorBookingDetailResponse,
  BookingStatus,
  VendorCancellationReasonCode,
} from "@/types/booking.types";

export async function getVendorBookingsApi(
  tab: string,
  page: number,
  accessToken: string,
  search?: string,
): Promise<VendorBookingsResponse> {
  const params = new URLSearchParams({ status: tab, page: String(page) });
  if (search && search.trim()) {
    params.set("search", search.trim());
  }
  return api.get<VendorBookingsResponse>(
    `/api/bookings/vendor/?${params.toString()}`,
    { token: accessToken },
  );
}

export async function getVendorBookingDetailApi(
  bookingId: number | string,
  accessToken: string,
): Promise<VendorBookingDetailResponse> {
  return api.get<VendorBookingDetailResponse>(
    `/api/bookings/vendor/${bookingId}/`,
    {
      token: accessToken,
    },
  );
}

export async function updateVendorBookingStatusApi(
  bookingId: number | string,
  newStatus: BookingStatus,
  accessToken: string,
  verificationPin?: string,
): Promise<VendorBookingDetailResponse> {
  return api.patch<VendorBookingDetailResponse>(
    `/api/bookings/vendor/${bookingId}/status/`,
    {
      status: newStatus,
      ...(verificationPin ? { verification_pin: verificationPin } : {}),
    },
    { token: accessToken },
  );
}

// Vendor-initiated cancellation. Unlike updateVendorBookingStatusApi with
// status="CANCELLED", this hits the dedicated cancel endpoint
// (CancellationService.cancel_booking_by_vendor) which computes the 100%
// refund, writes a BookingCancellation + RefundRecord, and notifies staff —
// none of which the plain status-update endpoint does.
export async function cancelVendorBookingApi(
  bookingId: number | string,
  reasonCode: VendorCancellationReasonCode,
  reasonText: string,
  accessToken: string,
): Promise<VendorBookingDetailResponse> {
  return api.post<VendorBookingDetailResponse>(
    `/api/bookings/vendor/${bookingId}/cancel/`,
    {
      reason_code: reasonCode,
      reason_text: reasonText,
    },
    { token: accessToken },
  );
}
