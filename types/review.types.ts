export interface ReviewRatingItem {
  criterion: string;
  criterion_label: string;
  score: number;
}

export interface RatingBreakdownItem {
  criterion: string;
  criterion_label: string;
  average_score: number;
  count: number;
}

export interface VehicleReviewItem {
  id: number;
  author_name: string;
  rating: number | null;
  comment: string;
  created_at: string;
  vehicle_name: string;
  ratings: ReviewRatingItem[];
}

export interface VehicleReviewsResponse {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: RatingBreakdownItem[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
  results: VehicleReviewItem[];
}
