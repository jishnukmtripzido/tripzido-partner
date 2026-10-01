import { api } from "@/lib/api";
import type {
  VendorPayoutsResponse,
  VendorPayoutDetailResponse,
} from "@/types/ledger.types";

export async function getVendorPayoutsApi(
  page: number,
  accessToken: string,
  // PENDING / PAID / FAILED — omitted (or "all") for every payout.
  status?: string,
): Promise<VendorPayoutsResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (status && status !== "all") params.set("status", status);
  return api.get<VendorPayoutsResponse>(
    `/api/payments/vendor/payouts/?${params.toString()}`,
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
