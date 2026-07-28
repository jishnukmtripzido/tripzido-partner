import { api } from "@/lib/api";
import type {
  VendorTermsResponse,
  VendorTermsUpdatePayload,
} from "@/types/settings.types";

export async function getVendorTermsApi(
  accessToken: string,
): Promise<VendorTermsResponse> {
  return api.get<VendorTermsResponse>("/api/vendors/me/terms/", {
    token: accessToken,
  });
}

export async function saveVendorTermsApi(
  payload: VendorTermsUpdatePayload,
  accessToken: string,
): Promise<VendorTermsResponse> {
  return api.post<VendorTermsResponse>("/api/vendors/me/terms/", payload, {
    token: accessToken,
  });
}
