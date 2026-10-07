"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getVendorDashboardStatusApi } from "@/services/dashboard.service";
import { queryKeys } from "@/lib/queryKeys";

const STALE_MS = 60000;

/**
 * The vendor account's status (APPROVED / SUSPENDED / …). Shares its
 * query key and data shape with the dashboard's status banner, so the
 * two never cost more than one request.
 *
 * A SUSPENDED vendor can still view everything and serve existing
 * bookings (start / complete / cancel), but the backend rejects every
 * other change with a 403 — `isSuspended` lets pages hide those actions
 * instead of letting them fail.
 *
 * While loading, or if the request fails, isSuspended is false: the
 * backend enforces the rule regardless, so the worst case is a visible
 * button whose 403 message explains the suspension.
 */
export function useVendorStatus() {
  const { token } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.dashboard.status(token),
    queryFn: async () => {
      const res = await getVendorDashboardStatusApi(token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load account status");
      }
      return res.data;
    },
    enabled: !!token,
    staleTime: STALE_MS,
  });

  const status = data?.vendor_status ?? null;
  return { status, isSuspended: status === "SUSPENDED" };
}
