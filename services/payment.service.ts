import { api } from "@/lib/api";
import type {
  VendorPayoutsResponse,
  VendorPayoutDetailResponse,
} from "@/types/ledger.types";

export async function getVendorPayoutsApi(
  page: number,
  accessToken: string,
): Promise<VendorPayoutsResponse> {
  return api.get<VendorPayoutsResponse>(
    `/api/payments/vendor/payouts/?page=${page}`,
    {
      token: accessToken,
    },
  );
}

export async function getVendorPayoutDetailApi(
  payoutId: number | string,
  accessToken: string,
): Promise<VendorPayoutDetailResponse> {
  return api.get<VendorPayoutDetailResponse>(
    `/api/payments/vendor/payouts/${payoutId}/`,
    { token: accessToken },
  );
}
