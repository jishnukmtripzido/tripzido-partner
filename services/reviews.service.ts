import { api } from "@/lib/api";
import type { VehicleReviewsResponse } from "@/types/review.types";

// The backend wraps every response in an envelope — { success, message,
// data } — as seen in the actual runtime response (average_rating,
// total_reviews, results, etc. all live under `data`). If your app
// already has a shared envelope type (check what fleet.service.ts
// imports for getListingDetailApi's return, e.g. `ApiResponse<T>`),
// delete this local interface and import that one instead — don't keep
// two copies of the same shape around. This local version exists so
// the fix compiles without needing to confirm that shared type first.
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// GET /api/vehicles/<id>/reviews/ — the same public, AllowAny endpoint
// the customer-facing vehicle detail page already uses. Reused as-is
// here rather than building a separate vendor-scoped endpoint: it
// already returns exactly what's needed, and since it's public there's
// no ownership check to add — a vendor viewing reviews for their own
// listing is no different from anyone else viewing them.
//
// NOTE: `VehicleReviewsResponse` is the *inner* payload shape
// (average_rating, total_reviews, results, ...), not the full response.
// Passing it bare to api.get() as the resolved type was the root cause
// of both the original runtime bug (reviews always showing "No reviews
// yet" because res.data was undefined on an object that had no .data
// at the type level) and the "Property 'success' does not exist"
// compile error — the envelope needs to be the generic, not the payload.
export async function getListingReviewsApi(
  listingId: string | number,
  token?: string,
): Promise<ApiEnvelope<VehicleReviewsResponse>> {
  return api.get<ApiEnvelope<VehicleReviewsResponse>>(
    `/api/vehicles/${listingId}/reviews/`,
    token ? { token } : undefined,
  );
}
