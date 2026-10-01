"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getVendorBookingsApi } from "@/services/booking.service";
import { queryKeys } from "@/lib/queryKeys";

const POLL_INTERVAL_MS = 60000;

/**
 * Number of CONFIRMED bookings — upcoming rentals where the vendor
 * still has to hand the bike over. Drives the Bookings tab badge.
 * Reads only page 1's pagination total, so it's one small request.
 */
export function useConfirmedBookingsCount(): number {
  const { token } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.bookings.confirmedCount(token),
    queryFn: async () => {
      const res = await getVendorBookingsApi("confirmed", 1, token as string);
      if (!res.success || !res.data) return 0;
      return res.data.pagination.total;
    },
    enabled: !!token,
    staleTime: POLL_INTERVAL_MS,
    // Pauses while the app is backgrounded (refetchIntervalInBackground
    // defaults to false) and refreshes on return, like the unread
    // notification count.
    refetchInterval: POLL_INTERVAL_MS,
  });
  return data ?? 0;
}
