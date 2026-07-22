import { api } from "@/lib/api";
import type { ListingDetailResponse } from "@/types/listing-detail.types";

export interface FleetListing {
  id: number;
  name: string;
  brand: string;
  vehicle_type: string;
  location_name: string;
  quantity: number;
  status: string;
  primary_image: string | null;
}

export interface FleetPage {
  success: boolean;
  message: string;
  data?: {
    pagination: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      next: string | null;
      previous: string | null;
    };
    results: FleetListing[];
  };
}

export async function getFleetApi(
  page: number,
  accessToken: string,
): Promise<FleetPage> {
  return api.get<FleetPage>(`/api/vehicles/vendor/fleet/?page=${page}`, {
    token: accessToken,
  });
}

export async function getListingDetailApi(
  listingId: number | string,
  accessToken: string,
): Promise<ListingDetailResponse> {
  return api.get<ListingDetailResponse>(
    `/api/vehicles/vendor/fleet/${listingId}/`,
    {
      token: accessToken,
    },
  );
}
