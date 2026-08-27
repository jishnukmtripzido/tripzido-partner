import { api } from "@/lib/api";
import type { VehicleReviewsResponse } from "@/types/review.types";

// GET /api/vehicles/<id>/reviews/ — the same public, AllowAny endpoint
// the customer-facing vehicle detail page already uses. Reused as-is
// here rather than building a separate vendor-scoped endpoint: it
// already returns exactly what's needed, and since it's public there's
// no ownership check to add — a vendor viewing reviews for their own
// listing is no different from anyone else viewing them.
export async function getListingReviewsApi(
  listingId: string | number,
  token?: string,
) {
  return api.get<VehicleReviewsResponse>(
    `/api/vehicles/${listingId}/reviews/`,
    token ? { token } : undefined,
  );
}
