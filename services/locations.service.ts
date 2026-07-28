import { api } from "@/lib/api";
import type { City, PickupLocationOption } from "@/types/listing-create.types";

interface CityListResponse {
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
    results: City[];
  };
}

interface PickupLocationListResponse {
  success: boolean;
  message: string;
  data?: PickupLocationOption[];
}

// GET /api/locations/cities/ is AllowAny on the backend — no token
// needed here, unlike everything else in this app.
export async function searchCitiesApi(
  search: string,
): Promise<CityListResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get<CityListResponse>(`/api/locations/cities/${params}`);
}

export async function getPickupLocationsByCityApi(
  cityId: number,
): Promise<PickupLocationListResponse> {
  return api.get<PickupLocationListResponse>(
    `/api/locations/pickup-locations/by-city/${cityId}/`,
  );
}
