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
// pageSize defaults to 100 (CustomPagination's own max_page_size) so
// an empty search effectively returns the full city list in one call,
// for the "browse everything" sheet UX.
export async function searchCitiesApi(
  search: string,
  pageSize: number = 100,
): Promise<CityListResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page_size", String(pageSize));
  return api.get<CityListResponse>(
    `/api/locations/cities/?${params.toString()}`,
  );
}

export async function getPickupLocationsByCityApi(
  cityId: number,
): Promise<PickupLocationListResponse> {
  return api.get<PickupLocationListResponse>(
    `/api/locations/pickup-locations/by-city/${cityId}/`,
  );
}
