import { api } from "@/lib/api";
import type {
  VendorBlockedPeriodsResponse,
  VendorBlockedPeriodResponse,
  BlockCreatePayload,
  BlockUpdatePayload,
} from "@/types/block.types";

export async function getVendorBlocksApi(
  page: number,
  accessToken: string,
): Promise<VendorBlockedPeriodsResponse> {
  return api.get<VendorBlockedPeriodsResponse>(
    `/api/vehicles/vendor/blocks/?page=${page}`,
    {
      token: accessToken,
    },
  );
}

export async function createBlockApi(
  payload: BlockCreatePayload,
  accessToken: string,
): Promise<VendorBlockedPeriodResponse> {
  return api.post<VendorBlockedPeriodResponse>(
    "/api/vehicles/vendor/blocks/",
    payload,
    {
      token: accessToken,
    },
  );
}

export async function updateBlockApi(
  blockId: number,
  payload: BlockUpdatePayload,
  accessToken: string,
): Promise<VendorBlockedPeriodResponse> {
  return api.patch<VendorBlockedPeriodResponse>(
    `/api/vehicles/vendor/blocks/${blockId}/`,
    payload,
    {
      token: accessToken,
    },
  );
}

export async function deleteBlockApi(
  blockId: number,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete(`/api/vehicles/vendor/blocks/${blockId}/`, {
    token: accessToken,
  });
}
