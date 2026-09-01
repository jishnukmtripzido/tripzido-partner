import { api } from "@/lib/api";
import type {
  VendorDashboardAttentionResponse,
  VendorDashboardFleetResponse,
  VendorDashboardRecentBookingsResponse,
  VendorDashboardResponse,
  VendorDashboardStatsResponse,
  VendorDashboardStatusResponse,
} from "@/types/dashboard.types";

export async function getVendorDashboardApi(
  accessToken: string,
): Promise<VendorDashboardResponse> {
  return api.get<VendorDashboardResponse>("/api/vendors/me/dashboard/", {
    token: accessToken,
  });
}

export async function getVendorDashboardStatusApi(
  accessToken: string,
): Promise<VendorDashboardStatusResponse> {
  return api.get<VendorDashboardStatusResponse>(
    "/api/vendors/me/dashboard/status/",
    { token: accessToken },
  );
}

export async function getVendorDashboardAttentionApi(
  accessToken: string,
): Promise<VendorDashboardAttentionResponse> {
  return api.get<VendorDashboardAttentionResponse>(
    "/api/vendors/me/dashboard/attention/",
    { token: accessToken },
  );
}

export async function getVendorDashboardStatsApi(
  accessToken: string,
): Promise<VendorDashboardStatsResponse> {
  return api.get<VendorDashboardStatsResponse>(
    "/api/vendors/me/dashboard/stats/",
    { token: accessToken },
  );
}

export async function getVendorDashboardFleetApi(
  accessToken: string,
): Promise<VendorDashboardFleetResponse> {
  return api.get<VendorDashboardFleetResponse>(
    "/api/vendors/me/dashboard/fleet/",
    { token: accessToken },
  );
}

export async function getVendorDashboardRecentBookingsApi(
  accessToken: string,
): Promise<VendorDashboardRecentBookingsResponse> {
  return api.get<VendorDashboardRecentBookingsResponse>(
    "/api/vendors/me/dashboard/recent-bookings/",
    { token: accessToken },
  );
}
