export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED"
  | "EXPIRED";

export interface VendorBookingListItem {
  id: number;
  booking_reference: string;
  vehicle_name: string;
  vehicle_image: string | null;
  customer_name: string;
  customer_phone: string;
  location_name: string;
  start_date: string;
  end_date: string;
  duration: string;
  status: BookingStatus;
  status_label: string;
  is_offline: boolean;
  listing_amount: string;
  advance_amount: string;
  remaining_amount: string;
  available_next_statuses: BookingStatus[];
}

export interface BookingPayment {
  id: number;
  payment_type: string;
  amount: string;
  status: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  initiated_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string;
}

export interface BookingCancellationInfo {
  id: number;
  booking_id: number;
  reason_code: string;
  reason_label: string;
  reason_text: string;
  hours_before_pickup_at_cancellation: string | null;
  refund_percentage: string;
  refundable_amount: string;
  forfeited_amount: string;
  created_at: string;
}

export interface VendorBookingDetail {
  id: number;
  booking_reference: string;
  is_offline: boolean;
  vehicle_name: string;
  vehicle_image: string | null;
  transmission_type: string;
  fuel_type: string;
  customer_name: string;
  customer_phone: string;
  pickup_location_name: string;
  pickup_location_address: string;
  package_name: string | null;
  start_date: string;
  end_date: string;
  duration: string;
  status: BookingStatus;
  status_label: string;
  payment_mode: string;
  payment_mode_label: string;
  listing_amount: string;
  advance_amount: string;
  remaining_amount: string;
  security_deposit_amount: string;
  handed_over_at: string | null;
  returned_at: string | null;
  cancelled_at: string | null;
  cancelled_by_role: string;
  payments: BookingPayment[];
  cancellation: BookingCancellationInfo | null;
  available_next_statuses: BookingStatus[];
  created_at: string;
}

export interface VendorBookingsResponse {
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
    results: VendorBookingListItem[];
  };
}

export interface VendorBookingDetailResponse {
  success: boolean;
  message: string;
  data?: VendorBookingDetail;
}
