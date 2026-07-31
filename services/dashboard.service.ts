import { api } from "@/lib/api";
import type { VendorDashboardResponse } from "@/types/dashboard.types";

export async function getVendorDashboardApi(
  accessToken: string,
): Promise<VendorDashboardResponse> {
  return api.get<VendorDashboardResponse>("/api/vendors/me/dashboard/", {
    token: accessToken,
  });
}
