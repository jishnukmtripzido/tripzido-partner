import { api } from "@/lib/api";
import type {
  VendorBookingsResponse,
  VendorBookingDetailResponse,
  BookingStatus,
} from "@/types/booking.types";

export async function getVendorBookingsApi(
  tab: string,
  page: number,
  accessToken: string,
): Promise<VendorBookingsResponse> {
  return api.get<VendorBookingsResponse>(
    `/api/bookings/vendor/?status=${tab}&page=${page}`,
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
): Promise<VendorBookingDetailResponse> {
  return api.patch<VendorBookingDetailResponse>(
    `/api/bookings/vendor/${bookingId}/status/`,
    { status: newStatus },
    { token: accessToken },
  );
}
