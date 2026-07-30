export interface VendorPayout {
  id: number;
  status: "PENDING" | "PAID" | "FAILED";
  status_label: string;
  total_amount: string;
  items_count: number;
  period_start: string | null;
  period_end: string | null;
  utr_number: string;
  paid_at: string | null;
  created_at: string;
}

export interface VendorPayoutsResponse {
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
    results: VendorPayout[];
  };
}

export interface VendorPayoutItemDetail {
  id: number;
  booking_id: number;
  booking_reference: string;
  vehicle_name: string;
  pickup_date: string;
  dropoff_date: string;
  amount: string;
}

export interface VendorPayoutDetail {
  id: number;
  status: "PENDING" | "PAID" | "FAILED";
  status_label: string;
  total_amount: string;
  period_start: string | null;
  period_end: string | null;
  bank_account_snapshot: Record<string, string>;
  utr_number: string;
  paid_at: string | null;
  note: string;
  items: VendorPayoutItemDetail[];
  created_at: string;
}

export interface VendorPayoutDetailResponse {
  success: boolean;
  message: string;
  data?: VendorPayoutDetail;
}
