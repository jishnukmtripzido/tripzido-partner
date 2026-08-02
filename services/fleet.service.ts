import { api } from "@/lib/api";
import type { ListingDetailResponse } from "@/types/listing-detail.types";
import type { ListingUpdatePayload } from "@/types/listing-create.types";

export interface FleetListing {
  id: number;
  name: string;
  brand: string;
  vehicle_type: string;
  location_name: string;
  quantity: number;
  status: string;
  primary_image: string | null;
  pickup_point_label: string | null;
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

import type {
  VehicleTypeOptionsResponse,
  PackageTypeOptionsResponse,
  ScheduleTemplateListResponse,
  ScheduleTemplateCreateResponse,
  ScheduleTemplateDay,
  ListingCreatePayload,
} from "@/types/listing-create.types";

export async function getVehicleTypesApi(
  search: string,
  accessToken: string,
): Promise<VehicleTypeOptionsResponse> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get<VehicleTypeOptionsResponse>(
    `/api/vehicles/vendor/vehicle-types/${params}`,
    { token: accessToken },
  );
}

export async function getPackageTypesApi(
  accessToken: string,
): Promise<PackageTypeOptionsResponse> {
  return api.get<PackageTypeOptionsResponse>(
    "/api/vehicles/vendor/package-types/",
    {
      token: accessToken,
    },
  );
}

export async function getScheduleTemplatesApi(
  accessToken: string,
): Promise<ScheduleTemplateListResponse> {
  return api.get<ScheduleTemplateListResponse>(
    "/api/vehicles/vendor/schedule-templates/",
    { token: accessToken },
  );
}

export async function createScheduleTemplateApi(
  name: string,
  days: ScheduleTemplateDay[],
  accessToken: string,
): Promise<ScheduleTemplateCreateResponse> {
  return api.post<ScheduleTemplateCreateResponse>(
    "/api/vehicles/vendor/schedule-templates/",
    { name, days },
    { token: accessToken },
  );
}

export async function createListingApi(
  payload: ListingCreatePayload,
  accessToken: string,
): Promise<ListingDetailResponse> {
  return api.post<ListingDetailResponse>(
    "/api/vehicles/vendor/fleet/",
    payload,
    {
      token: accessToken,
    },
  );
}

// Multipart — can't go through the JSON-only api.post wrapper, so this
// builds the request directly rather than teaching lib/api.ts to
// special-case FormData for this one caller.
export async function uploadListingImagesApi(
  listingId: number | string,
  files: File[],
  accessToken: string,
): Promise<{ success: boolean; message: string; data?: unknown }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/vendor/fleet/${listingId}/images/`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
  );
  if (!res.ok) {
    let message = `Upload failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export async function updateListingApi(
  listingId: number | string,
  payload: ListingUpdatePayload,
  accessToken: string,
): Promise<ListingDetailResponse> {
  return api.patch<ListingDetailResponse>(
    `/api/vehicles/vendor/fleet/${listingId}/`,
    payload,
    { token: accessToken },
  );
}

export async function deleteListingImageApi(
  listingId: number | string,
  imageId: number,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete(
    `/api/vehicles/vendor/fleet/${listingId}/images/${imageId}/`,
    {
      token: accessToken,
    },
  );
}

// For the Add Block dropdown — page_size=100 so a vendor's whole
// fleet fits in one call rather than paginating a select box.
export async function getFleetOptionsApi(
  accessToken: string,
): Promise<FleetPage> {
  return api.get<FleetPage>(
    "/api/vehicles/vendor/fleet/?page=1&page_size=100",
    {
      token: accessToken,
    },
  );
}

export async function getScheduleTemplateDetailApi(
  templateId: number,
  accessToken: string,
): Promise<ScheduleTemplateCreateResponse> {
  return api.get<ScheduleTemplateCreateResponse>(
    `/api/vehicles/vendor/schedule-templates/${templateId}/`,
    { token: accessToken },
  );
}

export async function updateScheduleTemplateApi(
  templateId: number,
  name: string,
  days: ScheduleTemplateDay[],
  accessToken: string,
): Promise<ScheduleTemplateCreateResponse> {
  return api.patch<ScheduleTemplateCreateResponse>(
    `/api/vehicles/vendor/schedule-templates/${templateId}/`,
    { name, days },
    { token: accessToken },
  );
}

export async function deleteScheduleTemplateApi(
  templateId: number,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete(`/api/vehicles/vendor/schedule-templates/${templateId}/`, {
    token: accessToken,
  });
}

import type {
  PickupPoint,
  PickupPointPayload,
} from "@/types/listing-create.types";

export async function getPickupPointsApi(
  token: string,
  pickupLocationId?: number,
) {
  const params = pickupLocationId
    ? `?pickup_location_id=${pickupLocationId}`
    : "";
  return api.get<{ success: boolean; message: string; data?: PickupPoint[] }>(
    `/api/vehicles/vendor/pickup-points/${params}`,
    { token },
  );
}

export async function getPickupPointDetailApi(id: number, token: string) {
  return api.get<{ success: boolean; message: string; data?: PickupPoint }>(
    `/api/vehicles/vendor/pickup-points/${id}/`,
    { token },
  );
}

export async function createPickupPointApi(
  payload: PickupPointPayload,
  token: string,
) {
  return api.post<{ success: boolean; message: string; data?: PickupPoint }>(
    "/api/vehicles/vendor/pickup-points/",
    payload,
    { token },
  );
}

export async function updatePickupPointApi(
  id: number,
  payload: PickupPointPayload,
  token: string,
) {
  return api.patch<{ success: boolean; message: string; data?: PickupPoint }>(
    `/api/vehicles/vendor/pickup-points/${id}/`,
    payload,
    { token },
  );
}

export async function deletePickupPointApi(id: number, token: string) {
  return api.delete<{ success: boolean; message: string }>(
    `/api/vehicles/vendor/pickup-points/${id}/`,
    { token },
  );
}
