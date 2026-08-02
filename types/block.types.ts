export interface VendorBlockedPeriod {
  id: number;
  listing_id: number;
  vehicle_name: string;
  location_name: string;
  start_datetime: string;
  end_datetime: string | null; // null = indefinite, blocked until further notice
  is_indefinite: boolean;
  count: number;
  listing_available_count: number;
  reason: string;
  reason_label: string;
  note: string;
  created_at: string;
}

export interface VendorBlockedPeriodsResponse {
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
    results: VendorBlockedPeriod[];
  };
}

export interface VendorBlockedPeriodResponse {
  success: boolean;
  message: string;
  data?: VendorBlockedPeriod;
}

export interface BlockCreatePayload {
  listing_id: number;
  start_datetime: string;
  end_datetime: string | null; // omit or send null for an indefinite block
  count: number;
  reason?: string;
  note?: string;
}

export interface BlockUpdatePayload {
  start_datetime: string;
  end_datetime: string | null; // null keeps/sets indefinite; a concrete value closes it
  count: number;
  reason?: string;
  note?: string;
}
